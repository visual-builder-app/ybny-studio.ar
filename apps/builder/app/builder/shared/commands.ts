import {
  unwrapInstance,
  deleteSelectedInstance,
  reparentInstance,
} from "~/shared/instance-utils/mutation";
import {
  canMoveInstanceInContentMode,
  sortInstancePathsForChildMutation,
} from "@webstudio-is/project-build/runtime";
import { toggleInstanceShow } from "~/shared/instance-utils/mutation";
import { insertWebstudioFragmentAt } from "~/shared/instance-utils/insert";
import { toast } from "@webstudio-is/design-system";
import {
  ROOT_INSTANCE_ID,
  isComponentDetachable,
  type WebstudioFragment,
} from "@webstudio-is/sdk";
import {
  duplicateFolder,
  duplicatePage,
  duplicateTemplate,
} from "~/builder/features/pages/page-utils";
import { createCommandsEmitter, type Command } from "~/shared/commands-emitter";
import {
  $editingItemSelector,
  $editingPageId,
  $folderIdToDelete,
  $isContentMode,
  $isDesignMode,
  $isPreviewMode,
  $pageIdToDelete,
  $templateIdToDelete,
  toggleBuilderMode,
} from "~/shared/nano-states";
import { $instances } from "~/shared/sync/data-stores";
import {
  externalContentInstanceNameMessage,
  getExternalContentRoots,
  findExternalContentRootEntryBySelector,
  isExternalContentInstance,
} from "~/shared/external-content-mutations";
import { traverseExternalContentHistory } from "~/shared/external-content-roots";

// Declare command for type safety
declare module "~/shared/pubsub" {
  interface CommandRegistry {
    focusStyleSourceInput: undefined;
  }
}

import {
  $breakpointsMenuView,
  selectBreakpointByOrder,
} from "~/shared/breakpoints";
import { executeRuntimeMutation } from "~/shared/instance-utils/data";
import { canDeleteInstanceInContentMode } from "@webstudio-is/project-build/runtime";
import { serverSyncStore } from "~/shared/sync/sync-stores";
import { $publisher } from "~/shared/pubsub";
import {
  $activeInspectorPanel,
  $isUiHidden,
  $publishDialog,
  setActiveSidebarPanel,
  toggleActiveSidebarPanel,
} from "./nano-states";
import {
  $allSelectedInstanceSelectors,
  $selectedInstancePath,
  clearInstanceSelection,
  selectInstance,
  selectInstances,
  selectPage,
} from "~/shared/nano-states";
import {
  getInstancePath,
  type InstancePath,
} from "@webstudio-is/project-build/runtime";
import { openCommandPanel } from "../features/command-panel";
import { showWrapComponentsList } from "../features/command-panel/groups/wrap-group";
import { showConvertComponentsList } from "../features/command-panel/groups/convert-group";
import { showDuplicateTokensView } from "../features/command-panel/groups/duplicate-tokens-group";
import { builderApi } from "~/shared/builder-api";
import { readClipboardText } from "~/shared/clipboard";
import { getSetting, setSetting } from "./client-settings";
import { generateFragmentFromHtml } from "@webstudio-is/project-build/runtime";
import { generateFragmentFromTailwind } from "~/shared/tailwind/tailwind";
import { denormalizeSrcProps } from "~/shared/copy-paste/asset-upload";
import { isSyncIdle } from "~/shared/sync/project-queue";
import { openDeleteUnusedTokensDialog } from "~/builder/shared/style-source-actions";
import { openDeleteUnusedDataVariablesDialog } from "~/builder/shared/data-variable-utils";
import { openDeleteUnusedCssVariablesDialog } from "~/builder/shared/css-variable-utils";
import { openDeleteUnusedAssetsDialog } from "~/builder/shared/asset-manager/delete-unused-assets";
import { openKeyboardShortcutsDialog } from "~/builder/features/keyboard-shortcuts-dialog";
import {
  copyFolder,
  copyInstance,
  copyPage,
  copyTemplate,
  emitPaste,
  cutInstance,
} from "~/shared/copy-paste/copy-paste";
import {
  getDeletablePageActionTarget,
  getPageActionTarget,
} from "~/shared/page-action-target";
import { getDirectSharedSlotChildBoundary } from "~/shared/instance-utils/slot";
import type { InstanceSelector } from "@webstudio-is/project-build/runtime";
import { areInstanceSelectorsEqual } from "@webstudio-is/project-build/runtime";
import { findChildReferenceIndex } from "@webstudio-is/project-build/runtime";

const makeBreakpointCommand = <CommandName extends string>(
  name: CommandName,
  number: number
): Command<CommandName> => ({
  name,
  hidden: true,
  defaultHotkeys: [`${number}`],
  disableOnInputLikeControls: true,
  handler: () => {
    selectBreakpointByOrder(number);
  },
});

const exitPreviewModeFromNonCanvasSource = (source: string) => {
  if (source === "canvas") {
    return;
  }

  setActiveSidebarPanel("auto");
  toggleBuilderMode("preview");
};

const canRunDesignModeCommand = ({ isDesignMode }: { isDesignMode: boolean }) =>
  isDesignMode;

const canRunDesignOrContentModeCommand = ({
  isContentMode,
  isDesignMode,
}: {
  isContentMode: boolean;
  isDesignMode: boolean;
}) => isDesignMode || isContentMode;

const guardDesignModeCommand = ({
  isDesignMode,
  message,
  toastInfo = builderApi.toast.info,
}: {
  isDesignMode: boolean;
  message: string;
  toastInfo?: (message: string) => void;
}) => {
  if (canRunDesignModeCommand({ isDesignMode })) {
    return true;
  }
  toastInfo(message);
  return false;
};

const guardDesignOrContentModeCommand = ({
  isContentMode,
  isDesignMode,
  message,
  toastInfo = builderApi.toast.info,
}: {
  isContentMode: boolean;
  isDesignMode: boolean;
  message: string;
  toastInfo?: (message: string) => void;
}) => {
  if (canRunDesignOrContentModeCommand({ isContentMode, isDesignMode })) {
    return true;
  }
  toastInfo(message);
  return false;
};

const hasMultiInstanceSelection = () =>
  $allSelectedInstanceSelectors.get().length > 1;

const traverseSelectedContentHistory = (direction: "undo" | "redo") => {
  const selector = $selectedInstancePath.get()?.[0]?.instanceSelector;
  if (selector === undefined) {
    return false;
  }
  const roots = getExternalContentRoots();
  const root = findExternalContentRootEntryBySelector(roots, selector)?.[1];
  if (
    root?.projectId === undefined ||
    root.assetId === undefined ||
    ($isContentMode.get() === false &&
      isExternalContentInstance(roots, selector[0]) === false &&
      root.contentInstanceId !== selector[0])
  ) {
    return false;
  }
  void traverseExternalContentHistory({
    projectId: root.projectId,
    direction,
  }).catch((error) => {
    toast.error(
      error instanceof Error
        ? error.message
        : "تعذّرت استعادة تعديل المقال."
    );
  });
  return true;
};

const copyPageActionTarget = () => {
  if ($isDesignMode.get() === false) {
    return false;
  }
  const target = getPageActionTarget();
  if (target?.type === "page") {
    void copyPage(target.id);
    return true;
  }
  if (target?.type === "folder") {
    void copyFolder(target.id);
    return true;
  }
  if (target?.type === "template") {
    void copyTemplate(target.id);
    return true;
  }
  return false;
};

const duplicatePageActionTarget = () => {
  const target = getPageActionTarget();
  if (target?.type === "page") {
    const newPageId = duplicatePage(target.id);
    if (newPageId) {
      selectPage(newPageId);
    }
    return true;
  }
  if (target?.type === "folder") {
    const newFolderId = duplicateFolder(target.id);
    if (newFolderId) {
      $editingPageId.set(newFolderId);
    }
    return true;
  }
  if (target?.type === "template") {
    const newTemplateId = duplicateTemplate(target.id);
    if (newTemplateId) {
      selectPage(newTemplateId);
    }
    return true;
  }
  return false;
};

export const __testing__ = {
  canRunDesignOrContentModeCommand,
  canRunDesignModeCommand,
  guardDesignOrContentModeCommand,
  guardDesignModeCommand,
};

const requestSelectedPageItemDelete = () => {
  if ($isDesignMode.get() === false) {
    return false;
  }
  const target = getDeletablePageActionTarget();
  if (target === undefined) {
    return false;
  }
  $pageIdToDelete.set(undefined);
  $folderIdToDelete.set(undefined);
  $templateIdToDelete.set(undefined);
  if (target.type === "page") {
    $pageIdToDelete.set(target.id);
  }
  if (target.type === "folder") {
    $folderIdToDelete.set(target.id);
  }
  if (target.type === "template") {
    $templateIdToDelete.set(target.id);
  }
  return true;
};

type InstanceMoveDirection = "up" | "down" | "intoPreviousSibling" | "out";

export const instanceMoveCommandMetas = [
  {
    name: "moveInstanceUp",
    label: "تحريك لأعلى",
    description: "تحريك النسخة المحددة فوق الشقيق السابق",
    direction: "up",
    shortcut: "arrowup",
  },
  {
    name: "moveInstanceDown",
    label: "تحريك لأسفل",
    description: "تحريك النسخة المحددة تحت الشقيق التالي",
    direction: "down",
    shortcut: "arrowdown",
  },
  {
    name: "moveInstanceOut",
    label: "إخراج",
    description: "إخراج النسخة المحددة من عنصرها الأصلي",
    direction: "out",
    shortcut: "arrowleft",
  },
  {
    name: "moveInstanceIntoPreviousSibling",
    label: "إدخال",
    description: "إدخال النسخة المحددة في الشقيق السابق",
    direction: "intoPreviousSibling",
    shortcut: "arrowright",
  },
] as const satisfies readonly {
  name: string;
  label: string;
  description: string;
  direction: InstanceMoveDirection;
  shortcut: string;
}[];

type SelectedInstancePath = {
  index: number;
  instancePath: InstancePath;
  instanceSelector: InstanceSelector;
};

const getAllSelectedInstancePaths = () => {
  const instances = $instances.get();
  const selectedInstanceSelectors = $allSelectedInstanceSelectors.get();
  const selectedInstancePaths: SelectedInstancePath[] = [];
  selectedInstanceSelectors.forEach((instanceSelector, index) => {
    if (instanceSelector[0] === ROOT_INSTANCE_ID) {
      return;
    }
    const instancePath = getInstancePath(instanceSelector, instances);
    if (instancePath === undefined || instancePath.length === 1) {
      return;
    }
    selectedInstancePaths.push({ index, instancePath, instanceSelector });
  });
  return selectedInstancePaths;
};

const getSiblingSelection = (selectedInstancePaths: SelectedInstancePath[]) => {
  const [firstSelectedPath] = selectedInstancePaths;
  const parentItem = firstSelectedPath?.instancePath[1];
  if (parentItem === undefined) {
    return;
  }
  const parentSelector = parentItem.instanceSelector;
  if (
    selectedInstancePaths.every(({ instancePath }) =>
      areInstanceSelectorsEqual(
        instancePath[1]?.instanceSelector,
        parentSelector
      )
    ) === false
  ) {
    return;
  }
  const siblingIds = parentItem.instance.children.flatMap((child) =>
    child.type === "id" ? [child.value] : []
  );
  const selectedIndexes = selectedInstancePaths
    .map(({ instancePath }) => siblingIds.indexOf(instancePath[0].instance.id))
    .filter((index) => index !== -1);
  if (selectedIndexes.length === 0) {
    return;
  }
  return { parentSelector, selectedIndexes, siblingIds };
};

const selectAdjacentSibling = (direction: "previous" | "next") => {
  const selectedInstancePaths = getAllSelectedInstancePaths();
  if (selectedInstancePaths.length === 0) {
    return;
  }
  const siblingSelection = getSiblingSelection(selectedInstancePaths);
  if (siblingSelection === undefined) {
    return;
  }
  const { parentSelector, selectedIndexes, siblingIds } = siblingSelection;
  const nextIndex =
    direction === "previous"
      ? Math.min(...selectedIndexes) - 1
      : Math.max(...selectedIndexes) + 1;
  const nextSiblingId = siblingIds[nextIndex];
  if (nextSiblingId === undefined) {
    return;
  }
  const selectedSiblingIds = new Set(
    selectedInstancePaths.map(({ instancePath }) => instancePath[0].instance.id)
  );
  selectedSiblingIds.add(nextSiblingId);
  selectInstances(
    siblingIds
      .filter((instanceId) => selectedSiblingIds.has(instanceId))
      .map((instanceId) => [instanceId, ...parentSelector])
  );
};

const selectSiblingInstances = () => {
  const selectedInstancePaths = getAllSelectedInstancePaths();
  if (selectedInstancePaths.length === 0) {
    return;
  }
  const siblingSelection = getSiblingSelection(selectedInstancePaths);
  if (siblingSelection === undefined) {
    return;
  }
  const { parentSelector, siblingIds } = siblingSelection;
  selectInstances(
    siblingIds.map((instanceId) => [instanceId, ...parentSelector])
  );
};

const reportSkippedSelectedInstances = (
  operation: "duplicated" | "deleted"
) => {
  builderApi.toast.info(`لم يتم ${operation} بعض النسخ المحددة.`);
};

const duplicateInstanceAfterItself = ({
  instancePath,
}: {
  instancePath: InstancePath;
}): InstanceSelector | undefined => {
  const [selectedItem, parentItem] = instancePath;
  if (parentItem === undefined) {
    return;
  }
  const result = executeRuntimeMutation({
    id: "instances.duplicateAfterItself",
    input: {
      sourceInstanceId: selectedItem.instance.id,
      parentInstanceId: parentItem.instance.id,
    },
  });
  const newRootInstanceId = result?.result.instanceId;
  if (newRootInstanceId === undefined) {
    return;
  }
  const newParentInstanceId = result?.result.parentInstanceId;
  if (
    newParentInstanceId === undefined ||
    newParentInstanceId === parentItem.instance.id
  ) {
    return [newRootInstanceId, ...parentItem.instanceSelector];
  }
  return [
    newRootInstanceId,
    newParentInstanceId,
    ...parentItem.instanceSelector,
  ];
};

const deleteSelectedInstances = () => {
  if ($isPreviewMode.get()) {
    return false;
  }
  const selectedInstancePaths = getAllSelectedInstancePaths();
  if (selectedInstancePaths.length < 2) {
    return false;
  }
  const instances = $instances.get();
  const isContentMode = $isContentMode.get();
  const actionableInstancePaths = selectedInstancePaths.filter(
    ({ instancePath, instanceSelector }) =>
      isComponentDetachable(instancePath[0].instance.component) &&
      (isContentMode === false ||
        canDeleteInstanceInContentMode({ instanceSelector, instances }))
  );
  if (actionableInstancePaths.length === 0) {
    return true;
  }
  if (actionableInstancePaths.length < selectedInstancePaths.length) {
    reportSkippedSelectedInstances("deleted");
  }

  executeRuntimeMutation({
    id: "instances.delete",
    input: {
      instanceIds: sortInstancePathsForChildMutation(
        actionableInstancePaths
      ).map(({ instancePath }) => instancePath[0].instance.id),
    },
  });
  clearInstanceSelection();
  return true;
};

const duplicateSelectedInstances = () => {
  const selectedInstancePaths = getAllSelectedInstancePaths();
  if (selectedInstancePaths.length < 2) {
    return false;
  }
  const actionableInstancePaths = selectedInstancePaths.filter(
    ({ instancePath }) =>
      isComponentDetachable(instancePath[0].instance.component)
  );
  if (actionableInstancePaths.length === 0) {
    return true;
  }
  if (actionableInstancePaths.length < selectedInstancePaths.length) {
    reportSkippedSelectedInstances("duplicated");
  }
  const newInstanceSelectors = new Map<number, InstanceSelector>();

  for (const { index, instancePath } of sortInstancePathsForChildMutation(
    actionableInstancePaths
  )) {
    const newInstanceSelector = duplicateInstanceAfterItself({ instancePath });
    if (newInstanceSelector !== undefined) {
      newInstanceSelectors.set(index, newInstanceSelector);
    }
  }

  const sortedNewInstanceSelectors = [...newInstanceSelectors]
    .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
    .map(([, instanceSelector]) => instanceSelector);
  if (sortedNewInstanceSelectors.length > 0) {
    selectInstances(sortedNewInstanceSelectors);
  }
  return true;
};

const getOutdentMoveTarget = (
  instancePath: NonNullable<ReturnType<typeof $selectedInstancePath.get>>,
  positionRelativeToParent: "before" | "after"
) => {
  const parentItem = instancePath[1];
  const grandparentItem = instancePath[2];
  if (parentItem === undefined || grandparentItem === undefined) {
    return;
  }

  const directSlotBoundary = getDirectSharedSlotChildBoundary(instancePath);
  if (directSlotBoundary !== undefined) {
    const slotParentItem = directSlotBoundary.slotParentItem;
    if (slotParentItem === undefined) {
      return;
    }
    const slotPosition = findChildReferenceIndex(
      slotParentItem.instance.children,
      directSlotBoundary.slotId
    );
    if (slotPosition === -1) {
      return;
    }
    return {
      parentSelector: slotParentItem.instanceSelector,
      position:
        positionRelativeToParent === "before" ? slotPosition : slotPosition + 1,
    };
  }

  const parent = parentItem.instance;
  const parentIndex = findChildReferenceIndex(
    grandparentItem.instance.children,
    parent.id
  );
  if (parentIndex === -1) {
    return;
  }
  return {
    parentSelector: grandparentItem.instanceSelector,
    position:
      positionRelativeToParent === "before" ? parentIndex : parentIndex + 1,
  };
};

const getInstanceMoveTarget = (direction: InstanceMoveDirection) => {
  const instancePath = $selectedInstancePath.get();
  const selectedItem = instancePath?.[0];
  const parentItem = instancePath?.[1];
  if (
    instancePath === undefined ||
    selectedItem === undefined ||
    parentItem === undefined
  ) {
    return;
  }

  const parent = parentItem.instance;
  const selectedIndex = findChildReferenceIndex(
    parent.children,
    selectedItem.instance.id
  );
  if (selectedIndex === -1) {
    return;
  }

  if (direction === "up") {
    if (selectedIndex === 0) {
      return getOutdentMoveTarget(instancePath, "before");
    }
    return {
      parentSelector: parentItem.instanceSelector,
      position: selectedIndex - 1,
    };
  }

  if (direction === "down") {
    if (selectedIndex >= parent.children.length - 1) {
      return getOutdentMoveTarget(instancePath, "after");
    }
    return {
      parentSelector: parentItem.instanceSelector,
      position: selectedIndex + 2,
    };
  }

  if (direction === "intoPreviousSibling") {
    if (selectedIndex === 0) {
      return;
    }
    const previousChild = parent.children[selectedIndex - 1];
    if (previousChild?.type !== "id") {
      return;
    }
    return {
      parentSelector: [previousChild.value, ...parentItem.instanceSelector],
      position: "end" as const,
    };
  }

  return getOutdentMoveTarget(
    instancePath,
    selectedIndex === 0 ? "before" : "after"
  );
};

const moveSelectedInstance = (direction: InstanceMoveDirection) => {
  const isContentMode = $isContentMode.get();
  if (
    guardDesignOrContentModeCommand({
      isContentMode,
      isDesignMode: $isDesignMode.get(),
      message: "التحريك مسموح فقط في وضع التصميم أو المحتوى.",
    }) === false
  ) {
    return;
  }
  const instancePath = $selectedInstancePath.get();
  const selectedItem = instancePath?.[0];
  if (selectedItem === undefined) {
    return;
  }
  const target = getInstanceMoveTarget(direction);
  if (target === undefined) {
    return;
  }
  if (isContentMode) {
    if (
      canMoveInstanceInContentMode({
        instanceSelector: selectedItem.instanceSelector,
        parentSelector: target.parentSelector,
        instances: $instances.get(),
      }) === false
    ) {
      return;
    }
  }
  reparentInstance(selectedItem.instanceSelector, target);
};

export const { emitCommand, subscribeCommands } = createCommandsEmitter({
  source: "builder",
  externalCommands: [
    "editInstanceText",
    "formatBold",
    "formatItalic",
    "formatSuperscript",
    "formatSubscript",
    "formatLink",
    "formatSpan",
    "formatClear",
  ],
  commands: [
    // system

    {
      name: "cancelCurrentDrag",
      label: "إلغاء التحديد",
      description: "إلغاء السحب أو إلغاء التحديد",
      hidden: true,
      category: "General",
      defaultHotkeys: ["escape"],
      // radix check event.defaultPrevented before invoking callbacks
      preventDefault: false,
      handler: (source) => {
        if ($isPreviewMode.get()) {
          exitPreviewModeFromNonCanvasSource(source);
          return;
        }

        const { publish } = $publisher.get();
        publish?.({ type: "cancelCurrentDrag" });
      },
    },
    {
      name: "clickCanvas",
      description: "النقر على اللوحة",
      hidden: true,
      handler: () => {
        $breakpointsMenuView.set(undefined);
        setActiveSidebarPanel("auto");
      },
    },

    // ui

    {
      name: "togglePreviewMode",
      description: "وضع المعاينة",
      category: "Top bar",
      defaultHotkeys: ["meta+shift+p", "ctrl+shift+p"],
      handler: () => {
        setActiveSidebarPanel("auto");
        toggleBuilderMode("preview");
      },
    },
    {
      name: "toggleUiHidden",
      description: "إخفاء الواجهة",
      category: "General",
      defaultHotkeys: ["meta+\\", "ctrl+\\"],
      handler: () => {
        $isUiHidden.set($isUiHidden.get() === false);
      },
    },
    {
      name: "toggleDesignMode",
      description: "تبديل وضع التصميم",
      category: "Top bar",
      defaultHotkeys: ["meta+shift+d", "ctrl+shift+d"],
      handler: () => {
        setActiveSidebarPanel("auto");
        toggleBuilderMode("design");
      },
    },
    {
      name: "toggleContentMode",
      description: "تبديل وضع المحتوى",
      category: "Top bar",
      defaultHotkeys: ["meta+shift+c", "ctrl+shift+c"],
      handler: () => {
        setActiveSidebarPanel("auto");
        toggleBuilderMode("content");
      },
    },
    {
      name: "openBreakpointsMenu",
      description: "إدارة نقاط التوقف المتجاوبة",
      handler: () => {
        $breakpointsMenuView.set("initial");
      },
    },
    {
      name: "openPublishDialog",
      description: "نشر مشروعك",
      category: "Top bar",
      defaultHotkeys: ["shift+P"],
      handler: () => {
        $publishDialog.set("publish");
      },
      disableOnInputLikeControls: true,
    },
    {
      name: "openExportDialog",
      description: "تصدير شيفرة المشروع",
      category: "General",
      defaultHotkeys: ["shift+E"],
      handler: () => {
        $publishDialog.set("export");
      },
      disableOnInputLikeControls: true,
    },
    {
      name: "toggleComponentsPanel",
      description: "تبديل لوحة المكوّنات",
      category: "Panels",
      defaultHotkeys: ["a"],
      handler: () => {
        if ($isDesignMode.get() === false) {
          builderApi.toast.info(
            "لوحة المكوّنات متاحة فقط في وضع التصميم."
          );
          return;
        }
        toggleActiveSidebarPanel("components");
      },
      disableOnInputLikeControls: true,
    },
    {
      name: "toggleNavigatorPanel",
      description: "تبديل لوحة شجرة العناصر",
      category: "Panels",
      defaultHotkeys: ["z"],
      handler: () => {
        toggleActiveSidebarPanel("navigator");
      },
      disableOnInputLikeControls: true,
    },
    {
      name: "openStylePanel",
      description: "فتح لوحة الأنماط",
      category: "Panels",
      defaultHotkeys: ["s"],
      handler: () => {
        if ($isDesignMode.get() === false) {
          builderApi.toast.info(
            "لوحة الأنماط متاحة فقط في وضع التصميم."
          );
          return;
        }
        $activeInspectorPanel.set("style");
      },
      disableOnInputLikeControls: true,
    },
    {
      name: "focusStyleSources",
      description: "التركيز على حقل مصادر الأنماط",
      category: "Style panel",
      defaultHotkeys: ["meta+enter", "ctrl+enter"],
      handler: () => {
        if (hasMultiInstanceSelection()) {
          return;
        }
        if ($isDesignMode.get() === false) {
          builderApi.toast.info(
            "لوحة الأنماط متاحة فقط في وضع التصميم."
          );
          return;
        }
        $activeInspectorPanel.set("style");
        requestAnimationFrame(() => {
          emitCommand("focusStyleSourceInput");
        });
      },
      disableOnInputLikeControls: true,
    },
    {
      name: "focusStyleSourceInput",
      description: "التركيز على حقل مصدر النمط",
      hidden: true,
      handler: () => {
        // This command is handled by the style panel component
        // It's emitted by openStylePanel command
      },
    },
    {
      name: "toggleStylePanelFocusMode",
      description: "تبديل وضع التركيز في لوحة الأنماط",
      category: "Style panel",
      defaultHotkeys: ["alt+shift+s"],
      handler: () => {
        setSetting(
          "stylePanelMode",
          getSetting("stylePanelMode") === "focus" ? "default" : "focus"
        );
      },
      disableOnInputLikeControls: true,
    },
    {
      name: "toggleStylePanelAdvancedMode",
      description: "تبديل الوضع المتقدم في لوحة الأنماط",
      category: "Style panel",
      defaultHotkeys: ["alt+shift+a"],
      handler: () => {
        setSetting(
          "stylePanelMode",
          getSetting("stylePanelMode") === "advanced" ? "default" : "advanced"
        );
      },
      disableOnInputLikeControls: true,
    },
    {
      name: "openSettingsPanel",
      description: "فتح لوحة الإعدادات",
      category: "Panels",
      defaultHotkeys: ["d"],
      handler: () => {
        if (hasMultiInstanceSelection()) {
          return;
        }
        $activeInspectorPanel.set("settings");
      },
      disableOnInputLikeControls: true,
    },
    makeBreakpointCommand("selectBreakpoint1", 1),
    makeBreakpointCommand("selectBreakpoint2", 2),
    makeBreakpointCommand("selectBreakpoint3", 3),
    makeBreakpointCommand("selectBreakpoint4", 4),
    makeBreakpointCommand("selectBreakpoint5", 5),
    makeBreakpointCommand("selectBreakpoint6", 6),
    makeBreakpointCommand("selectBreakpoint7", 7),
    makeBreakpointCommand("selectBreakpoint8", 8),
    makeBreakpointCommand("selectBreakpoint9", 9),
    {
      name: "copy",
      description: "نسخ الصفحة أو النسخ المحددة",
      category: "Navigator",
      handler: () => {
        if (copyPageActionTarget()) {
          return;
        }
        void copyInstance();
      },
    },
    {
      name: "paste",
      description: "لصق النسخ المنسوخة",
      category: "Navigator",
      handler: () => {
        if (
          guardDesignOrContentModeCommand({
            isContentMode: $isContentMode.get(),
            isDesignMode: $isDesignMode.get(),
            message: "اللصق مسموح فقط في وضع التصميم أو المحتوى.",
          })
        ) {
          void emitPaste();
        }
      },
    },
    {
      name: "cut",
      description: "قص النسخ المحددة",
      category: "Navigator",
      handler: () => {
        if (
          guardDesignModeCommand({
            isDesignMode: $isDesignMode.get(),
            message: "القص مسموح فقط في وضع التصميم.",
          })
        ) {
          void cutInstance();
        }
      },
    },
    {
      name: "toggleShow",
      description: "تبديل ظهور النسخة",
      category: "Navigator",
      handler: () => {
        if (
          guardDesignModeCommand({
            isDesignMode: $isDesignMode.get(),
            message: "تبديل الظهور مسموح فقط في وضع التصميم.",
          }) === false
        ) {
          return;
        }
        if (hasMultiInstanceSelection()) {
          return;
        }
        const instancePath = $selectedInstancePath.get();
        if (instancePath?.[0]) {
          toggleInstanceShow(instancePath[0].instance.id);
        }
      },
    },
    ...instanceMoveCommandMetas.map(
      ({ direction, shortcut, ...commandMeta }) => ({
        ...commandMeta,
        category: "Navigator" as const,
        defaultHotkeys: [`meta+${shortcut}`, `ctrl+${shortcut}`],
        disableOnInputLikeControls: true,
        handler: () => moveSelectedInstance(direction),
      })
    ),
    {
      name: "selectPreviousSibling",
      hidden: true,
      category: "Navigator",
      defaultHotkeys: ["shift+arrowup"],
      disableOnInputLikeControls: true,
      handler: () => selectAdjacentSibling("previous"),
    },
    {
      name: "selectNextSibling",
      hidden: true,
      category: "Navigator",
      defaultHotkeys: ["shift+arrowdown"],
      disableOnInputLikeControls: true,
      handler: () => selectAdjacentSibling("next"),
    },
    {
      name: "selectSiblingInstances",
      hidden: true,
      category: "Navigator",
      defaultHotkeys: ["meta+a", "ctrl+a"],
      disableOnInputLikeControls: true,
      handler: selectSiblingInstances,
    },
    {
      name: "deleteInstanceBuilder",
      label: "حذف",
      description: "حذف الصفحة أو النسخ المحددة",
      category: "Navigator",
      defaultHotkeys: ["backspace", "delete"],
      // See "deleteInstanceCanvas" for details on why the command is separated for the canvas and builder.
      disableHotkeyOutsideApp: true,
      disableOnInputLikeControls: true,
      handler: () => {
        if (deleteSelectedInstances()) {
          return;
        }
        if (requestSelectedPageItemDelete()) {
          return;
        }
        deleteSelectedInstance();
      },
    },
    {
      name: "duplicateInstance",
      description: "إنشاء نسخة من الصفحة أو النسخ المحددة",
      category: "Navigator",
      defaultHotkeys: ["meta+d", "ctrl+d"],
      handler: () => {
        if (
          guardDesignModeCommand({
            isDesignMode: $isDesignMode.get(),
            message: "إنشاء النسخ مسموح فقط في وضع التصميم.",
          }) === false
        ) {
          return;
        }
        if (duplicateSelectedInstances()) {
          return;
        }
        if (duplicatePageActionTarget()) {
          return;
        }
        const instancePath = $selectedInstancePath.get();
        // global root or body are selected
        if (instancePath === undefined || instancePath.length === 1) {
          return;
        }

        const newInstanceSelector = duplicateInstanceAfterItself({
          instancePath,
        });
        selectInstance(newInstanceSelector);
      },
    },
    {
      name: "editInstanceLabel",
      description: "تعديل تسمية النسخة",
      category: "Navigator",
      defaultHotkeys: ["meta+e", "ctrl+e"],
      handler: () => {
        if (
          guardDesignModeCommand({
            isDesignMode: $isDesignMode.get(),
            message: "إعادة التسمية مسموحة فقط في وضع التصميم.",
          }) === false
        ) {
          return;
        }
        if (hasMultiInstanceSelection()) {
          return;
        }
        const instancePath = $selectedInstancePath.get();
        if (instancePath === undefined) {
          return;
        }
        const [selectedItem] = instancePath;
        if (
          isExternalContentInstance(
            getExternalContentRoots(),
            selectedItem.instance.id
          )
        ) {
          toast.info(externalContentInstanceNameMessage);
          return;
        }
        $editingItemSelector.set(selectedItem.instanceSelector);
      },
    },
    {
      name: "wrap",
      label: "تغليف",
      description: "تغليف",
      category: "Navigator",
      defaultHotkeys: ["meta+alt+g", "ctrl+alt+g"],
      keepCommandPanelOpen: true,
      handler: () => {
        if (
          guardDesignModeCommand({
            isDesignMode: $isDesignMode.get(),
            message: "التغليف مسموح فقط في وضع التصميم.",
          }) === false
        ) {
          return;
        }
        if (hasMultiInstanceSelection()) {
          return;
        }
        showWrapComponentsList();
      },
    },
    {
      name: "unwrap",
      description: "إزالة الغلاف الأصلي",
      category: "Navigator",
      defaultHotkeys: ["meta+shift+g", "ctrl+shift+g"],
      handler: () => {
        if (
          guardDesignModeCommand({
            isDesignMode: $isDesignMode.get(),
            message: "إزالة التغليف مسموحة فقط في وضع التصميم.",
          })
        ) {
          if (hasMultiInstanceSelection()) {
            return;
          }
          unwrapInstance();
        }
      },
    },
    {
      name: "convert",
      label: "تحويل",
      description: "تحويل المكوّن",
      category: "Navigator",
      keepCommandPanelOpen: true,
      handler: () => {
        if (
          guardDesignModeCommand({
            isDesignMode: $isDesignMode.get(),
            message: "التحويل مسموح فقط في وضع التصميم.",
          }) === false
        ) {
          return;
        }
        if (hasMultiInstanceSelection()) {
          return;
        }
        showConvertComponentsList();
      },
    },

    {
      name: "pasteTailwind",
      label: "لصق HTML مع أصناف Tailwind",
      description: "تحويل Tailwind إلى CSS",
      handler: async () => {
        if (
          guardDesignModeCommand({
            isDesignMode: $isDesignMode.get(),
            message: "لصق HTML مسموح فقط في وضع التصميم.",
          }) === false
        ) {
          return;
        }
        const html = await readClipboardText();
        if (html === undefined) {
          return;
        }
        const parseResult = generateFragmentFromHtml(html);
        const { skippedSelectors } = parseResult;
        let fragment: WebstudioFragment = parseResult;
        fragment = await denormalizeSrcProps(fragment);
        fragment = await generateFragmentFromTailwind(fragment);
        const result = await insertWebstudioFragmentAt(fragment);
        if (skippedSelectors.length > 0) {
          builderApi.toast.info(
            `تم تخطي محددات متداخلة (لا توجد عناصر مطابقة): ${skippedSelectors.join(", ")}`
          );
        }
        return result;
      },
    },

    // history

    {
      name: "undo",
      description: "التراجع عن آخر إجراء",
      category: "General",
      // safari use meta+z to reopen closed tabs, here added ctrl as alternative
      defaultHotkeys: ["meta+z", "ctrl+z"],
      disableOnInputLikeControls: true,
      handler: () => {
        if (traverseSelectedContentHistory("undo") === false) {
          serverSyncStore.undo();
        }
      },
    },
    {
      name: "redo",
      description: "إعادة آخر إجراء",
      category: "General",
      // safari use meta+z to reopen closed tabs, here added ctrl as alternative
      defaultHotkeys: ["meta+shift+z", "ctrl+shift+z"],
      disableOnInputLikeControls: true,
      handler: () => {
        if (traverseSelectedContentHistory("redo") === false) {
          serverSyncStore.redo();
        }
      },
    },

    {
      name: "save",
      description: "حفظ المشروع",
      category: "General",
      defaultHotkeys: ["meta+s", "ctrl+s"],
      handler: async () => {
        toast.dismiss("save-success");
        try {
          await isSyncIdle();
          toast.success("تم حفظ المشروع بنجاح", { id: "save-success" });
        } catch (error) {
          if (error instanceof Error) {
            toast.error(error.message);
          }
        }
      },
    },

    {
      name: "openCommandPanel",
      description: "فتح لوحة الأوامر",
      category: "General",
      defaultHotkeys: ["meta+k", "ctrl+k"],
      handler: () => {
        if ($isDesignMode.get()) {
          openCommandPanel();
        }
      },
    },

    {
      name: "deleteUnusedTokens",
      label: "حذف الرموز غير المستخدمة",
      description: "إزالة الرموز غير المستخدمة",
      handler: () => {
        openDeleteUnusedTokensDialog();
      },
    },

    {
      name: "findDuplicateTokens",
      label: "البحث عن رموز مكررة",
      description: "البحث عن رموز بأنماط أو أسماء متطابقة",
      handler: () => {
        showDuplicateTokensView();
      },
    },

    {
      name: "deleteUnusedDataVariables",
      label: "حذف متغيرات البيانات غير المستخدمة",
      description: "إزالة متغيرات البيانات غير المستخدمة",
      handler: () => {
        openDeleteUnusedDataVariablesDialog();
      },
    },

    {
      name: "deleteUnusedCssVariables",
      label: "حذف متغيرات CSS غير المستخدمة",
      description: "إزالة متغيرات CSS غير المستخدمة",
      handler: () => {
        openDeleteUnusedCssVariablesDialog();
      },
    },

    {
      name: "deleteUnusedAssets",
      label: "حذف الوسائط غير المستخدمة",
      description: "إزالة الوسائط غير المستخدمة",
      handler: () => {
        openDeleteUnusedAssetsDialog();
      },
    },

    {
      name: "openKeyboardShortcuts",
      description: "عرض اختصارات لوحة المفاتيح",
      category: "General",
      defaultHotkeys: ["shift+?"],
      disableOnInputLikeControls: true,
      handler: () => {
        openKeyboardShortcutsDialog();
      },
    },
  ],
});

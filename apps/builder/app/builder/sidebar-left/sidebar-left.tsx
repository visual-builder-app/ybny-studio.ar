import { useRef, type ReactNode } from "react";
import {
  cssVar,
  Kbd,
  rawTheme,
  Text,
  treeActionBoundary,
} from "@webstudio-is/design-system";
import { useSubscribe, type Publish } from "~/shared/pubsub";
import {
  $dragAndDropState,
  $isContentMode,
  $isPreviewMode,
} from "~/shared/nano-states";
import { Flex } from "@webstudio-is/design-system";
import { theme } from "@webstudio-is/design-system";
import {
  ExtensionIcon,
  HelpIcon,
  ImageIcon,
  NavigatorIcon,
  PageIcon,
  PlusIcon,
  type IconComponent,
} from "@webstudio-is/icons";
import { HelpCenter } from "../features/help/help-center";
import { useStore } from "@nanostores/react";
import {
  $activeSidebarPanel,
  setActiveSidebarPanel,
  toggleActiveSidebarPanel,
} from "~/builder/shared/nano-states";
import { $selectedPage } from "~/shared/nano-states";
import {
  SidebarButton,
  SidebarTabs,
  SidebarTabsContent,
  SidebarTabsList,
  SidebarTabsTrigger,
} from "./sidebar-tabs";
import {
  ExternalDragDropMonitor,
  POTENTIAL,
  isBlockedByBackdrop,
  useOnDropEffect,
  useExternalDragStateEffect,
} from "~/builder/shared/assets/drag-monitor";
import { getSetting, setSetting } from "~/builder/shared/client-settings";
import { ComponentsPanel } from "~/builder/features/components";
import { PagesPanel } from "~/builder/features/pages";
import { NavigatorPanel } from "~/builder/features/navigator";
import { AssetsPanel } from "~/builder/features/assets";
import { MarketplacePanel } from "~/builder/features/marketplace";
import type { SidebarPanelName } from "./types";
import { $effectiveNavigatorLayout, $isCompactEditor } from "../shared/responsive-layout";

const none = { Panel: () => null };

const HelpTabTrigger = () => {
  return (
    <HelpCenter>
      <HelpCenter.Trigger asChild>
        <SidebarButton label="تعلّم Webstudio أو اطلب المساعدة">
          <HelpIcon size={rawTheme.spacing[10]} />
        </SidebarButton>
      </HelpCenter.Trigger>
    </HelpCenter>
  );
};

type PanelConfig = {
  name: SidebarPanelName;
  ariaLabel?: string;
  label: ReactNode;
  Icon: IconComponent;
  Panel: (props: { publish: Publish; onClose: () => void }) => ReactNode;
  visibility?: {
    content?: boolean;
    text?: boolean;
  };
};

const isPanelVisible = (
  panel: Pick<PanelConfig, "visibility">,
  {
    isPreviewMode,
    isContentMode,
    isTextPage,
  }: { isPreviewMode: boolean; isContentMode: boolean; isTextPage: boolean }
) => {
  if (isPreviewMode) {
    return false;
  }

  const { visibility } = panel;

  if (visibility === undefined) {
    return true;
  }

  if (isTextPage) {
    // Show all panels for text pages; panels with text: false are disabled, not hidden
    return true;
  }

  if (isContentMode) {
    return visibility.content ?? true;
  }

  return true;
};

const isPanelDisabled = (
  panel: Pick<PanelConfig, "visibility">,
  { isTextPage }: { isTextPage: boolean }
) => {
  return isTextPage === true && panel.visibility?.text === false;
};

const panels: PanelConfig[] = [
  {
    name: "components",
    ariaLabel: "المكوّنات",
    label: (
      <Text>
        المكوّنات&nbsp;&nbsp;
        <Kbd value={["A"]} color="moreSubtle" />
      </Text>
    ),
    Icon: PlusIcon,
    Panel: ComponentsPanel,
    visibility: {
      content: false,
      text: false,
    },
  },
  {
    name: "pages",
    label: "الصفحات",
    Icon: PageIcon,
    Panel: PagesPanel,
  },
  {
    name: "navigator",
    ariaLabel: "شجرة العناصر",
    label: (
      <Text>
        شجرة العناصر&nbsp;&nbsp;
        <Kbd value={["z"]} color="moreSubtle" />
      </Text>
    ),
    Icon: NavigatorIcon,
    Panel: NavigatorPanel,
  },
  {
    name: "assets",
    label: "الوسائط",
    Icon: ImageIcon,
    Panel: AssetsPanel,
  },
  {
    name: "marketplace",
    label: "السوق",
    Icon: ExtensionIcon,
    Panel: MarketplacePanel,
    visibility: {
      content: false,
    },
  },
];

const setSidebarPanelWidth = (panelName: string, width: number) => {
  const widths = getSetting("sidebarPanelWidths");
  setSetting("sidebarPanelWidths", { ...widths, [panelName]: width });
};

const getSidebarPanelWidth = (panelName: SidebarPanelName) => {
  if (panelName === "none") {
    return theme.sizes.sidebarWidth;
  }
  const width = getSetting("sidebarPanelWidths")[panelName];
  if (width === undefined) {
    return theme.sizes.sidebarWidth;
  }
  return width + "px";
};

type SidebarLeftProps = {
  publish: Publish;
};

export const SidebarLeft = ({ publish }: SidebarLeftProps) => {
  const activePanel = useStore($activeSidebarPanel);
  const isCompact = useStore($isCompactEditor);
  const navigatorLayout = useStore($effectiveNavigatorLayout);
  const dragAndDropState = useStore($dragAndDropState);
  const { Panel } = panels.find((item) => item.name === activePanel) ?? none;
  const isPreviewMode = useStore($isPreviewMode);
  const isContentMode = useStore($isContentMode);
  const selectedPage = useStore($selectedPage);
  const isTextPage = selectedPage?.meta.documentType === "text";
  const tabsWrapperRef = useRef<HTMLDivElement>(null);
  const returnTabRef = useRef<SidebarPanelName | undefined>(undefined);

  useSubscribe("dragEnd", ({ isCanceled }) => {
    if (isCanceled === false) {
      setActiveSidebarPanel("auto");
    }
  });

  useOnDropEffect(() => {
    const element = tabsWrapperRef.current;

    if (element == null) {
      return;
    }

    if (isBlockedByBackdrop(element)) {
      return;
    }

    returnTabRef.current = undefined;
  });

  useExternalDragStateEffect((state) => {
    if (state !== POTENTIAL) {
      if (returnTabRef.current !== undefined) {
        setActiveSidebarPanel(returnTabRef.current);
      }
      returnTabRef.current = undefined;
      return;
    }

    const element = tabsWrapperRef.current;

    if (element == null) {
      return;
    }

    if (isBlockedByBackdrop(element)) {
      return;
    }

    returnTabRef.current = activePanel;
    // Save prevous state
    setActiveSidebarPanel("assets");
  });

  const modes = { isContentMode, isPreviewMode, isTextPage };

  return (
    <SidebarTabs
      dir="rtl"
      activationMode="manual"
      value={activePanel}
      orientation="vertical"
    >
      {
        // In preview mode, we don't show left sidebar, but we want to allow pages panel to be open in the preview mode.
        // This way user can switch pages without exiting preview mode.
      }
      {isPreviewMode === false && (
        <Flex
          grow
          direction="column"
          css={{ borderInlineEnd: `1px solid ${cssVar("--border-default")}` }}
        >
          <ExternalDragDropMonitor />
          <div ref={tabsWrapperRef} style={{ display: "contents" }}>
            <SidebarTabsList>
              {panels
                .filter((panel) => isPanelVisible(panel, modes))
                .map(({ name, Icon, label, visibility, ariaLabel }) => {
                  const disabled = isPanelDisabled({ visibility }, modes);
                  return (
                    <SidebarTabsTrigger
                      key={name}
                      label={label}
                      aria-label={ariaLabel}
                      value={name}
                      disabled={disabled}
                      onClick={() => {
                        toggleActiveSidebarPanel(name);
                      }}
                    >
                      <Icon size={rawTheme.spacing[10]} />
                    </SidebarTabsTrigger>
                  );
                })}
            </SidebarTabsList>
          </div>

          <HelpTabTrigger />
        </Flex>
      )}

      <SidebarTabsContent
        value={activePanel === "none" ? "" : activePanel}
        onResize={isCompact ? undefined : ({ width }) => {
          if (activePanel !== "none") {
            setSidebarPanelWidth(activePanel, width);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setActiveSidebarPanel("none");
          }
        }}
        resizable={!isCompact}
        css={{
          [treeActionBoundary]: `${getSidebarPanelWidth(activePanel)}`,
          width: cssVar(treeActionBoundary),
          minWidth: `min(${theme.sizes.sidebarWidth}, calc(100vw - 100% - 8px))`,
          maxWidth: `min(${theme.spacing[35]}, calc(100vw - 100% - 8px))`,
          // We need the node to be rendered but hidden
          // to keep receiving the drag events.
          visibility:
            dragAndDropState.isDragging &&
            dragAndDropState.dragPayload?.origin === "panel" &&
            navigatorLayout !== "undocked"
              ? "hidden"
              : "visible",
        }}
      >
        <Flex
          css={{
            position: "relative",
            height: "100%",
            flexGrow: 1,
            background: cssVar("--background-primary"),
          }}
          direction="column"
        >
          <Panel
            publish={publish}
            onClose={() => setActiveSidebarPanel("none")}
          />
        </Flex>
      </SidebarTabsContent>
    </SidebarTabs>
  );
};

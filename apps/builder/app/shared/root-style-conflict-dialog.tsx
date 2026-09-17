import { atom } from "nanostores";
import { useStore } from "@nanostores/react";
import { hyphenateProperty, toValue } from "@webstudio-is/css-engine";
import type {
  RootStyleConflict,
  RootStyleConflictResolution,
} from "@webstudio-is/project-build/runtime";
import { ConflictResolutionDialog } from "./conflict-resolution-dialog";

export type RootStyleConflictDialogResult =
  | RootStyleConflictResolution
  | "cancel";
export type RootStyleConflictDialogConflict = Pick<
  RootStyleConflict,
  "existingStyle" | "incomingStyle"
> & { breakpointLabel: string };

const conflictResolutionOptions = [
  {
    value: "ours",
    label: "الاحتفاظ بالموجود",
    description: "الحفاظ على قيم الأنماط العامة الحالية في مشروعك",
  },
  {
    value: "theirs",
    label: "استخدام الوارد",
    description: "استبدال قيم الأنماط العامة المتعارضة بالقيم الملصوقة",
  },
] as const satisfies ReadonlyArray<{
  value: RootStyleConflictResolution;
  label: string;
  description: string;
}>;

type DialogState =
  | {
      conflicts: RootStyleConflictDialogConflict[];
      resolution: RootStyleConflictResolution;
      resolve: (result: RootStyleConflictDialogResult) => void;
    }
  | undefined;

const $dialogState = atom<DialogState>(undefined);

export const showRootStyleConflictDialog = (
  conflicts: RootStyleConflictDialogConflict[]
): Promise<RootStyleConflictDialogResult> =>
  new Promise((resolve) => {
    $dialogState.get()?.resolve("cancel");
    $dialogState.set({ conflicts, resolution: "ours", resolve });
  });

export const RootStyleConflictDialog = () => {
  const dialogState = useStore($dialogState);
  if (dialogState === undefined) {
    return;
  }

  const { conflicts, resolution, resolve } = dialogState;
  const handleClose = () => {
    if ($dialogState.get()?.resolve === resolve) {
      $dialogState.set(undefined);
    }
  };
  const handleCancel = () => {
    resolve("cancel");
    handleClose();
  };
  if (conflicts.length === 0) {
    return null;
  }

  return (
    <ConflictResolutionDialog
      title="تم اكتشاف تعارض في الأنماط العامة"
      description={
        conflicts.length === 1
          ? "نمط عام ملصوق يتعارض مع قيمة موجودة. الأنماط العامة تؤثر على كل صفحة."
          : `تتعارض ${conflicts.length} أنماط عامة ملصوقة مع قيم موجودة. الأنماط العامة تؤثر على كل صفحة.`
      }
      detailsLabel="إظهار الأنماط المتعارضة"
      details={conflicts
        .map(({ existingStyle, incomingStyle, breakpointLabel }) => {
          const property = hyphenateProperty(incomingStyle.property);
          const state =
            incomingStyle.state === undefined ? "" : `, ${incomingStyle.state}`;
          return `${property} (${breakpointLabel}${state}): ${toValue(existingStyle.value)} → ${toValue(incomingStyle.value)}`;
        })
        .join("; ")}
      resolution={resolution}
      options={conflictResolutionOptions}
      onResolutionChange={(nextResolution) => {
        if ($dialogState.get()?.resolve === resolve) {
          $dialogState.set({
            conflicts,
            resolution: nextResolution,
            resolve,
          });
        }
      }}
      onResolve={() => {
        resolve(resolution);
        handleClose();
      }}
      onCancel={handleCancel}
    />
  );
};

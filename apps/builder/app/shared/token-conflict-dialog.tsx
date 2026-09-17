import { atom } from "nanostores";
import { useStore } from "@nanostores/react";
import type {
  ConflictResolution,
  TokenConflict,
} from "@webstudio-is/project-build/runtime";
import { ConflictResolutionDialog } from "./conflict-resolution-dialog";

export type TokenConflictDialogResult = ConflictResolution | "cancel";
export type TokenConflictDialogConflict = Pick<TokenConflict, "tokenName">;

const conflictResolutionOptions = [
  {
    value: "theirs",
    label: "الوارد",
    description:
      'الاحتفاظ بالرموز الواردة مع إضافة لاحقة إلى أسمائها (مثل "primary-color-1")',
  },
  {
    value: "ours",
    label: "الحالي",
    description:
      "تجاهل الرموز الواردة واستخدام رموز مشروعك الموجودة بدلًا منها",
  },
  {
    value: "merge",
    label: "دمج",
    description:
      "دمج الاثنين في الرمز الموجود لديك (الأنماط الواردة تتجاوز الأنماط الموجودة)",
  },
] as const satisfies ReadonlyArray<{
  value: ConflictResolution;
  label: string;
  description: string;
}>;

type DialogState =
  | {
      conflicts: TokenConflictDialogConflict[];
      resolution: ConflictResolution;
      resolve: (result: TokenConflictDialogResult) => void;
    }
  | undefined;

const $dialogState = atom<DialogState>(undefined);

export const showTokenConflictDialog = (
  conflicts: TokenConflictDialogConflict[]
): Promise<TokenConflictDialogResult> =>
  new Promise((resolve) => {
    $dialogState.get()?.resolve("cancel");
    $dialogState.set({ conflicts, resolution: "theirs", resolve });
  });

export const TokenConflictDialog = () => {
  const dialogState = useStore($dialogState);

  if (!dialogState) {
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

  const conflictCount = conflicts.length;
  const firstConflict = conflicts[0];

  return (
    <ConflictResolutionDialog
      title="تم اكتشاف تعارض في الرموز"
      description={
        conflictCount === 1
          ? `الرمز "${firstConflict.tokenName}" موجود بالفعل بأنماط مختلفة.`
          : `توجد ${conflictCount} رموز بنفس الأسماء ولكن بأنماط مختلفة.`
      }
      detailsLabel="إظهار الرموز المتعارضة"
      details={conflicts.map((conflict) => conflict.tokenName).join(", ")}
      resolution={resolution}
      options={conflictResolutionOptions}
      onResolutionChange={(nextResolution) => {
        if ($dialogState.get()?.resolve === resolve) {
          $dialogState.set({ conflicts, resolution: nextResolution, resolve });
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

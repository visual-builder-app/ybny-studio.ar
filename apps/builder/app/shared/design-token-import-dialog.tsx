import { atom } from "nanostores";
import { useStore } from "@nanostores/react";
import {
  PanelContent,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Flex,
} from "@webstudio-is/design-system";
import { DialogRadioOptions } from "./dialog-radio-options";

export type DesignTokenImportTarget = "design-token" | "css-variable";
export type DesignTokenImportDialogResult = DesignTokenImportTarget | "cancel";

const importTargetOptions = [
  {
    value: "design-token",
    label: "رموز التصميم",
    description:
      "أنشئ رموز أنماط قابلة لإعادة الاستخدام للقيم المركبة وغير الغامضة. احتفظ بالقيم الأولية الأخرى كمتغيرات CSS."
  },
  {
    value: "css-variable",
    label: "متغيرات CSS",
    description:
      "أنشئ خصائص مخصصة يمكن استخدامها في الأنماط الفردية."
  },
] as const satisfies ReadonlyArray<{
  value: DesignTokenImportTarget;
  label: string;
  description: string;
}>;

type DialogState =
  | {
      target: DesignTokenImportTarget;
      resolve: (result: DesignTokenImportDialogResult) => void;
    }
  | undefined;

const $dialogState = atom<DialogState>(undefined);

export const showDesignTokenImportDialog = () =>
  new Promise<DesignTokenImportDialogResult>((resolve) => {
    $dialogState.get()?.resolve("cancel");
    $dialogState.set({ target: "design-token", resolve });
  });

export const DesignTokenImportDialog = () => {
  const dialogState = useStore($dialogState);

  if (dialogState === undefined) {
    return;
  }

  const { resolve, target } = dialogState;
  const close = () => {
    if ($dialogState.get()?.resolve === resolve) {
      $dialogState.set(undefined);
    }
  };
  const finish = (result: DesignTokenImportDialogResult) => {
    resolve(result);
    close();
  };

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (open === false) {
          finish("cancel");
        }
      }}
    >
      <DialogContent css={{ minWidth: "40ch" }}>
        <DialogTitle>استيراد الرموز</DialogTitle>
        <PanelContent as={Flex} direction="column" gap="2">
          <DialogDescription>
            اختر كيفية تمثيل هذه الرموز في Webstudio.
          </DialogDescription>
          <DialogRadioOptions
            value={target}
            options={importTargetOptions}
            onValueChange={(target) => {
              if ($dialogState.get()?.resolve === resolve) {
                $dialogState.set({ target, resolve });
              }
            }}
          />
        </PanelContent>
        <DialogActions>
          <Button autoFocus color="primary" onClick={() => finish(target)}>
            استيراد
          </Button>
          <Button color="ghost" onClick={() => finish("cancel")}>
            إلغاء
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

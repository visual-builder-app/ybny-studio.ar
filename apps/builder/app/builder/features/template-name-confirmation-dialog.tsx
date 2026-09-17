import { useStore } from "@nanostores/react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Text,
  theme,
} from "@webstudio-is/design-system";
import {
  $pendingTemplateNameConfirmation,
  abortPendingTemplateNameConfirmation,
  confirmPendingTemplateNameChange,
} from "~/shared/instance-utils/data";

export const TemplateNameConfirmationDialog = () => {
  const pending = useStore($pendingTemplateNameConfirmation);
  const action = pending?.confirmation.action;
  return (
    <Dialog
      open={pending !== undefined}
      onOpenChange={(open) => {
        if (open === false) {
          abortPendingTemplateNameConfirmation();
        }
      }}
    >
      <DialogContent>
        <DialogTitle suffix={false}>
          {action === "delete" ? "حذف القالب" : "إعادة تسمية القالب"}
        </DialogTitle>
        <DialogDescription asChild>
          <Text css={{ padding: theme.spacing[5] }}>
            {action === "delete"
              ? "قد يؤدي حذف هذا القالب إلى فصل المراجع في ملفات MDX المرتبطة. لن يتم تغيير الملفات."
              : "قد تؤدي إعادة تسمية هذا القالب إلى فصل المراجع في ملفات MDX المرتبطة. لن يتم تغيير الملفات."}
          </Text>
        </DialogDescription>
        <DialogActions>
          <Button
            autoFocus
            color="neutral"
            onClick={abortPendingTemplateNameConfirmation}
          >
            إلغاء
          </Button>
          <Button
            color={action === "delete" ? "destructive" : "primary"}
            onClick={confirmPendingTemplateNameChange}
          >
            {action === "delete" ? "حذف" : "إعادة تسمية"}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

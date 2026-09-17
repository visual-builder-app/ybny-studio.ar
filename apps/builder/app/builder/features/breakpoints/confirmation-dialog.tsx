import type { Breakpoint } from "@webstudio-is/sdk";
import {
  theme,
  Button,
  Flex,
  Text,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
} from "@webstudio-is/design-system";

type ConfirmationDialogProps = {
  onAbort: () => void;
  onConfirm: () => void;
  breakpoint: Breakpoint;
  open: boolean;
};

export const ConfirmationDialog = ({
  breakpoint,
  onConfirm,
  onAbort,
  open,
}: ConfirmationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onAbort()}>
      <DialogContent>
        <DialogTitle>حذف نقطة التوقف</DialogTitle>
        <Flex gap="2" direction="column" css={{ padding: theme.spacing[5] }}>
          <Text>{`هل أنت متأكد من حذف "${breakpoint.label}"؟`}</Text>
          <Text>
            {`Deleting a breakpoint will also delete all styles associated with this
        breakpoint.`}
          </Text>
        </Flex>
        <DialogActions>
          <Button autoFocus onClick={onConfirm} color="destructive">
            حذف
          </Button>
          <Button onClick={onAbort}>إلغاء</Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

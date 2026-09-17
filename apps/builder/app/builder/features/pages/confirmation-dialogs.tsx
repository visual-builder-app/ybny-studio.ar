import {
  PanelContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogClose,
  Flex,
  Text,
  Button,
} from "@webstudio-is/design-system";
import type { Page, Folder, PageTemplate } from "@webstudio-is/sdk";
import { getPageDisplayName } from "./page-utils";

type DeletePageConfirmationDialogProps = {
  onClose: () => void;
  onConfirm: () => void;
  page: Page;
};

export const DeletePageConfirmationDialog = ({
  onClose,
  onConfirm,
  page,
}: DeletePageConfirmationDialogProps) => {
  return (
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (isOpen === false) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogTitle>حذف صفحة</DialogTitle>
        <PanelContent as={Flex} gap="3" direction="column">
          <Text>{`هل أنت متأكد من حذف "${getPageDisplayName(page)}"؟`}</Text>
          <Text>
            يمكنك التراجع عن الحذف ما لم تُعِد تحميل الصفحة.
          </Text>
        </PanelContent>
        <DialogActions>
          <Button
            autoFocus
            color="destructive"
            onClick={() => {
              onConfirm();
            }}
          >
            حذف الصفحة
          </Button>
          <DialogClose>
            <Button color="ghost">إلغاء</Button>
          </DialogClose>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

type DeleteFolderConfirmationDialogProps = {
  onClose: () => void;
  onConfirm: () => void;
  folder: Folder;
};

export const DeleteFolderConfirmationDialog = ({
  onClose,
  onConfirm,
  folder,
}: DeleteFolderConfirmationDialogProps) => {
  return (
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (isOpen === false) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <PanelContent as={Flex} gap="3" direction="column">
          <Text>{`حذف المجلد "${folder.name}" مع جميع صفحاته؟`}</Text>
        </PanelContent>
        <DialogActions>
          <Button
            autoFocus
            color="destructive"
            onClick={() => {
              onConfirm();
            }}
          >
            حذف
          </Button>
          <DialogClose>
            <Button color="ghost">إلغاء</Button>
          </DialogClose>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

type DeleteTemplateConfirmationDialogProps = {
  onClose: () => void;
  onConfirm: () => void;
  template: PageTemplate;
};

export const DeleteTemplateConfirmationDialog = ({
  onClose,
  onConfirm,
  template,
}: DeleteTemplateConfirmationDialogProps) => {
  return (
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (isOpen === false) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogTitle>حذف قالب</DialogTitle>
        <PanelContent as={Flex} gap="3" direction="column">
          <Text>{`هل أنت متأكد من حذف القالب "${template.name}"؟`}</Text>
          <Text>
            يمكنك التراجع عن الحذف ما لم تُعِد تحميل الصفحة.
          </Text>
        </PanelContent>
        <DialogActions>
          <Button
            autoFocus
            color="destructive"
            onClick={() => {
              onConfirm();
            }}
          >
            حذف القالب
          </Button>
          <DialogClose>
            <Button color="ghost">إلغاء</Button>
          </DialogClose>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

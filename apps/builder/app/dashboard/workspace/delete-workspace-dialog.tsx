import { useState } from "react";
import { useRevalidator } from "@remix-run/react";
import {
  Button,
  Flex,
  Text,
  DialogActions,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
  DialogDescription,
  theme,
} from "@webstudio-is/design-system";
import type { Workspace } from "@webstudio-is/project";
import { trpcClient } from "~/shared/trpc/trpc-client";

export const DeleteWorkspaceDialog = ({
  workspace,
  isOpen,
  onOpenChange,
  onDeleted,
}: {
  workspace: Workspace;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) => {
  const { send, state } = trpcClient.workspace.delete.useMutation();
  const revalidator = useRevalidator();
  const [error, setError] = useState<string>();

  if (workspace.isDefault) {
    return;
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (open === false) {
          setError(undefined);
        }
      }}
    >
      <DialogContent>
        <Flex
          direction="column"
          gap="2"
          css={{
            paddingInline: theme.spacing[9],
            paddingTop: theme.spacing[5],
          }}
        >
          <DialogDescription asChild>
            <Text as="p">
              هل أنت متأكد من حذف{" "}
              <Text as="span" variant="titles">
                {workspace.name}
              </Text>
              ؟ سيتم حذف{" "}
              <Text as="span" color="destructive">
                جميع المشاريع
              </Text>{" "}
              في مساحة العمل هذه. لا يمكن التراجع عن هذا الإجراء.
            </Text>
          </DialogDescription>
          {error && <Text color="destructive">{error}</Text>}
        </Flex>
        <DialogActions>
          <Button
            color="destructive"
            state={state === "idle" ? undefined : "pending"}
            onClick={() => {
              send(
                { workspaceId: workspace.id, deleteProjects: true },
                (result) => {
                  if (result && "error" in result) {
                    setError(result.error);
                    return;
                  }
                  onOpenChange(false);
                  onDeleted();
                  revalidator.revalidate();
                }
              );
            }}
          >
            حذف نهائي
          </Button>
          <DialogClose>
            <Button color="ghost">إلغاء</Button>
          </DialogClose>
        </DialogActions>
        <DialogTitle>حذف مساحة العمل</DialogTitle>
      </DialogContent>
    </Dialog>
  );
};

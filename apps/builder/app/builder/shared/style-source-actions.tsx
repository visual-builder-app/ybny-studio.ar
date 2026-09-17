import { useState, useEffect } from "react";
import { atom, computed } from "nanostores";
import { useStore } from "@nanostores/react";
import {
  PanelContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogClose,
  Button,
  Text,
  Flex,
  theme,
  InputField,
  toast,
  cssVar,
} from "@webstudio-is/design-system";
import type { StyleSource } from "@webstudio-is/sdk";
import type { RenameStyleSourceError } from "@webstudio-is/project-build/runtime";
import {
  $selectedStyleSources,
  $selectedStyleState,
} from "~/shared/nano-states";
import {
  $styleSourceSelections,
  $styleSources,
} from "~/shared/sync/data-stores";
import {
  findUnusedTokens,
  getStyleSourceUsages,
  validateStyleSourceName,
} from "@webstudio-is/project-build/runtime";
import { $selectedInstance } from "~/shared/nano-states";
import { executeRuntimeMutation } from "~/shared/instance-utils/data";

const $isDeleteUnusedTokensDialogOpen = atom(false);

export const openDeleteUnusedTokensDialog = () => {
  $isDeleteUnusedTokensDialogOpen.set(true);
};

export const $styleSourceUsages = computed(
  $styleSourceSelections,
  (styleSourceSelections) =>
    getStyleSourceUsages(styleSourceSelections.values())
);

export const deselectMatchingStyleSource = (
  styleSourceId: StyleSource["id"]
) => {
  const instanceId = $selectedInstance.get()?.id;
  if (instanceId === undefined) {
    return;
  }
  const selectedStyleSources = new Map($selectedStyleSources.get());
  if (selectedStyleSources.get(instanceId) === styleSourceId) {
    selectedStyleSources.delete(instanceId);
    $selectedStyleSources.set(selectedStyleSources);
    $selectedStyleState.set(undefined);
  }
};

export const deleteStyleSource = (styleSourceId: StyleSource["id"]) => {
  executeRuntimeMutation({
    id: "styleSources.delete",
    input: { styleSourceIds: [styleSourceId] },
  });
  // reset selected style source if necessary
  deselectMatchingStyleSource(styleSourceId);
};

export const deleteUnusedTokens = () => {
  const styleSources = $styleSources.get();
  const styleSourceUsages = $styleSourceUsages.get();
  const unusedTokenIds = findUnusedTokens({ styleSources, styleSourceUsages });

  if (unusedTokenIds.length === 0) {
    return 0;
  }

  executeRuntimeMutation({
    id: "styleSources.delete",
    input: { styleSourceIds: unusedTokenIds },
  });

  return unusedTokenIds.length;
};

export const renameStyleSource = (
  id: StyleSource["id"],
  name: string
): RenameStyleSourceError | undefined => {
  const styleSources = $styleSources.get();
  const validationError = validateStyleSourceName({
    id,
    name,
    styleSources,
  });
  if (validationError) {
    return validationError;
  }
  executeRuntimeMutation({
    id: "styleSources.rename",
    input: {
      styleSourceId: id,
      name,
    },
  });
};

export const setStyleSourceLocked = (
  id: StyleSource["id"],
  locked: boolean
) => {
  executeRuntimeMutation({
    id: "styleSources.setLock",
    input: {
      styleSourceId: id,
      locked,
    },
  });
};

type DeleteStyleSourceDialogProps = {
  styleSource?: { id: StyleSource["id"]; name: string };
  onClose: () => void;
  onConfirm: (styleSourceId: StyleSource["id"]) => void;
};

export const DeleteStyleSourceDialog = ({
  styleSource,
  onClose,
  onConfirm,
}: DeleteStyleSourceDialogProps) => {
  return (
    <Dialog
      open={styleSource !== undefined}
      onOpenChange={(isOpen) => {
        if (isOpen === false) {
          onClose();
        }
      }}
    >
      <DialogContent
        onKeyDown={(event) => {
          // Prevent command panel from handling keyboard events
          event.stopPropagation();
        }}
      >
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <PanelContent as={Flex} gap="3" direction="column">
          <Text>{`حذف الرمز "${styleSource?.name}" من المشروع بما في ذلك كل أنماطه؟`}</Text>
        </PanelContent>
        <DialogActions>
          <Button
            autoFocus
            color="destructive"
            onClick={() => {
              onConfirm(styleSource!.id);
              onClose();
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

type RenameStyleSourceDialogProps = {
  styleSource?: { id: StyleSource["id"]; name: string };
  onClose: () => void;
  onConfirm: (styleSourceId: StyleSource["id"], newName: string) => void;
};

export const RenameStyleSourceDialog = ({
  styleSource,
  onClose,
  onConfirm,
}: RenameStyleSourceDialogProps) => {
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();

  // Reset name and clear error when styleSource changes
  useEffect(() => {
    if (styleSource?.name !== undefined) {
      setName(styleSource.name);
      setError(undefined);
    }
  }, [styleSource?.id, styleSource?.name]);

  const handleConfirm = () => {
    const renameError = renameStyleSource(styleSource!.id, name);
    if (renameError) {
      if (renameError.type === "minlength") {
        setError("لا يمكن أن يكون اسم الرمز فارغًا");
      } else if (renameError.type === "duplicate") {
        setError("يوجد بالفعل رمز بهذا الاسم");
      }
      return;
    }
    onConfirm(styleSource!.id, name);
    onClose();
  };

  return (
    <Dialog
      open={styleSource !== undefined}
      onOpenChange={(isOpen) => {
        if (isOpen === false) {
          onClose();
        }
      }}
    >
      <DialogContent
        onKeyDown={(event) => {
          // Prevent command panel from handling keyboard events
          event.stopPropagation();
          if (event.key === "Enter" && !error) {
            handleConfirm();
          }
        }}
      >
        <DialogTitle>إعادة تسمية الرمز</DialogTitle>
        <PanelContent as={Flex} gap="3" direction="column">
          <Flex direction="column" gap="1">
            <InputField
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError(undefined);
              }}
              color={error ? "error" : undefined}
            />
            {error && (
              <Text color="destructive" variant="monoBold">
                {error}
              </Text>
            )}
          </Flex>
        </PanelContent>
        <DialogActions>
          <Button color="primary" onClick={handleConfirm}>
            إعادة تسمية
          </Button>
          <DialogClose>
            <Button color="ghost">إلغاء</Button>
          </DialogClose>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

export const DeleteUnusedTokensDialog = () => {
  const open = useStore($isDeleteUnusedTokensDialogOpen);
  const styleSourceUsages = useStore($styleSourceUsages);
  const styleSources = useStore($styleSources);

  const handleClose = () => {
    $isDeleteUnusedTokensDialogOpen.set(false);
  };

  const unusedTokenIds = findUnusedTokens({ styleSources, styleSourceUsages });
  const unusedTokens: Array<{ id: string; name: string }> = unusedTokenIds
    .map((id) => {
      const styleSource = styleSources.get(id);
      return styleSource?.type === "token"
        ? { id, name: styleSource.name }
        : null;
    })
    .filter((token): token is { id: string; name: string } => token !== null);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (isOpen === false) {
          handleClose();
        }
      }}
    >
      <DialogContent
        onKeyDown={(event) => {
          event.stopPropagation();
        }}
      >
        <DialogTitle>حذف الرموز غير المستخدمة</DialogTitle>
        <PanelContent as={Flex} gap="3" direction="column">
          {unusedTokens.length === 0 ? (
            <Text>لا توجد رموز غير مستخدمة لحذفها.</Text>
          ) : (
            <>
              <Text>
                حذف {unusedTokens.length}{" "}
                {unusedTokens.length === 1 ? "رمز غير مستخدم" : "رموز غير مستخدمة"} من
                المشروع؟
              </Text>
              <Text
                variant="mono"
                css={{
                  maxHeight: 200,
                  overflowY: "auto",
                  backgroundColor: cssVar("--background-primary"),
                  borderRadius: theme.borderRadius[4],
                  wordBreak: "break-word",
                }}
              >
                {unusedTokens.map((token) => token.name).join(", ")}
              </Text>
            </>
          )}
        </PanelContent>
        <DialogActions>
          {unusedTokens.length > 0 && (
            <Button
              color="destructive"
              autoFocus
              onClick={() => {
                const deletedCount = deleteUnusedTokens();
                handleClose();
                if (deletedCount === 0) {
                  toast.info("لا توجد رموز غير مستخدمة لحذفها");
                } else {
                  toast.success(
                    `تم حذف ${deletedCount} ${deletedCount === 1 ? "رمز غير مستخدم" : "رموز غير مستخدمة"}`
                  );
                }
              }}
            >
              حذف
            </Button>
          )}
          <DialogClose>
            <Button color="ghost">
              {unusedTokens.length > 0 ? "إلغاء" : "إغلاق"}
            </Button>
          </DialogClose>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

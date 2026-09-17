import { useEffect, useRef, useState } from "react";
import { useRevalidator, useSearchParams } from "@remix-run/react";
import {
  PanelContent,
  Button,
  Flex,
  Label,
  Text,
  SearchField,
  DialogActions,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
  DialogDescription,
  css,
  theme,
  toast,
  cssVar,
} from "@webstudio-is/design-system";
import { useStore } from "@nanostores/react";
import { $workspaces, $user } from "~/shared/nano-states";
import { nativeClient } from "~/shared/trpc/trpc-client";
import {
  WorkspaceDropdown,
  type WorkspaceDropdownGroup,
} from "~/dashboard/workspace/workspace-dropdown";

const sortWorkspaces = <T extends { name: string }>(workspaces: Array<T>) =>
  [...workspaces].sort((a, b) => a.name.localeCompare(b.name));

const orSeparatorStyle = css({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing[5],
  "&::before, &::after": {
    content: "''",
    flexGrow: 1,
    height: theme.spacing[1],
    backgroundColor: cssVar("--border-default"),
  },
});

const SEARCH_DEBOUNCE_MS = 300;

export const TransferProjectDialog = ({
  isOpen,
  onOpenChange,
  projectId,
  title,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  title: string;
}) => {
  const workspaces = useStore($workspaces);
  const user = useStore($user);
  const userEmail = user?.email ?? "";
  const revalidator = useRevalidator();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>();
  const [filteredWorkspaces, setFilteredWorkspaces] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const requestCounterRef = useRef(0);

  // Group and sort workspaces by ownership
  const ownedWorkspaces = sortWorkspaces(
    workspaces.filter((w) => w.role === "own")
  );
  // Determine the current workspace from URL or fall back to default
  const getCurrentWorkspaceId = () => {
    const urlWorkspaceId = searchParams.get("workspaceId");
    if (urlWorkspaceId !== null) {
      return urlWorkspaceId;
    }
    // When no workspaceId in URL, the user is on the default workspace
    return (
      ownedWorkspaces.find((w) => w.isDefault)?.id ?? ownedWorkspaces[0]?.id
    );
  };

  // Reset state when dialog opens — pre-select the current workspace
  useEffect(() => {
    if (isOpen) {
      setSelectedWorkspaceId(getCurrentWorkspaceId());
    } else {
      setEmail("");
      setSelectedWorkspaceId(undefined);
      setFilteredWorkspaces([]);
      setIsFiltered(false);
      setError(undefined);
      clearTimeout(debounceTimerRef.current);
    }

    return () => clearTimeout(debounceTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleEmailChange = (searchEmail: string) => {
    setEmail(searchEmail);
    setError(undefined);

    if (searchEmail.trim() === "") {
      setIsFiltered(false);
      setSelectedWorkspaceId(getCurrentWorkspaceId());
      clearTimeout(debounceTimerRef.current);
      return;
    }

    // Basic email validation
    if (searchEmail.includes("@") === false) {
      setIsFiltered(false);
      clearTimeout(debounceTimerRef.current);
      return;
    }

    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      const requestId = ++requestCounterRef.current;
      nativeClient.workspace.findSharedWorkspacesByOwnerEmail
        .query({ email: searchEmail.trim() })
        .then((result) => {
          // Ignore stale responses
          if (requestCounterRef.current !== requestId) {
            return;
          }
          if (result.success) {
            setFilteredWorkspaces(result.data);
            setIsFiltered(true);
            setSelectedWorkspaceId(undefined);
          }
        })
        .catch(() => {
          // Silently fail — keep showing all workspaces
        });
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleClearEmail = () => {
    setEmail("");
    setIsFiltered(false);
    setSelectedWorkspaceId(getCurrentWorkspaceId());
    setError(undefined);
    clearTimeout(debounceTimerRef.current);
  };

  const handleSubmit = async () => {
    setError(undefined);
    setIsSubmitting(true);

    try {
      const trimmedEmail = email.trim();

      // Case 1: No email entered — move to the selected workspace (same-owner move)
      if (trimmedEmail === "" && selectedWorkspaceId !== undefined) {
        const result = await nativeClient.workspace.moveProject.mutate({
          projectId,
          targetWorkspaceId: selectedWorkspaceId,
        });
        if ("error" in result) {
          setError(result.error);
          return;
        }
        toast.info(`تم نقل "${title}" بنجاح`);
        onOpenChange(false);
        revalidator.revalidate();
        return;
      }

      // Case 2: Email entered — transfer to another user
      if (trimmedEmail !== "") {
        const result = await nativeClient.workspace.transferProject.mutate({
          projectId,
          recipientEmail: trimmedEmail,
          targetWorkspaceId: selectedWorkspaceId,
        });
        if ("error" in result) {
          setError(result.error);
          return;
        }
        toast.info("تم إرسال طلب النقل");
        onOpenChange(false);
        revalidator.revalidate();
        return;
      }

      setError("حدد مساحة عمل أو أدخل عنوان بريد إلكتروني");
    } catch {
      setError("حدث خطأ ما");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasEmail = email.trim() !== "";
  const hasWorkspace = selectedWorkspaceId !== undefined;
  const isSelfTransfer =
    hasEmail &&
    userEmail !== "" &&
    email.trim().toLowerCase() === userEmail.toLowerCase();
  const canSubmit = (hasEmail || hasWorkspace) && isSelfTransfer === false;

  // Build groups for the dropdown.
  // In filtered mode (email entered): show the recipient's workspaces.
  // In unfiltered mode (no email): only show own workspaces — moving to
  // another user's workspace requires the transfer flow with a notification.
  const dropdownGroups: Array<WorkspaceDropdownGroup> = isFiltered
    ? filteredWorkspaces.length > 0
      ? [
          {
            label: "مساحات عملهم التي يمكنك الوصول إليها",
            items: sortWorkspaces(filteredWorkspaces),
          },
        ]
      : []
    : [
        ...(ownedWorkspaces.length > 0
          ? [{ label: "مساحات عملي", items: ownedWorkspaces }]
          : []),
      ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <Flex direction="column" css={{ width: theme.spacing[32] }}>
          <PanelContent as={Flex} direction="column" gap="3">
            <DialogDescription asChild>
              <Text as="p">
                انقل &ldquo;{title}&rdquo; إلى مساحة عمل أخرى، أو حوّله إلى
                مستخدم آخر بإدخال بريده الإلكتروني.
              </Text>
            </DialogDescription>

            <Flex direction="column" gap="1" align="start">
              <Label>
                {isFiltered
                  ? "مساحات عملهم التي يمكنك الوصول إليها"
                  : "مساحة العمل"}
              </Label>
              {dropdownGroups.length > 0 ? (
                <WorkspaceDropdown
                  groups={dropdownGroups}
                  selectedId={selectedWorkspaceId}
                  onSelectedChange={setSelectedWorkspaceId}
                  color="ghost"
                />
              ) : isFiltered && hasEmail ? (
                <Text color="subtle" variant="labels">
                  لم يتم العثور على مساحات عمل مشتركة. سيتم نقل المشروع دون
                  مساحة عمل وجهة — سيختار المستلم مكان وضعه.
                </Text>
              ) : undefined}
            </Flex>
          </PanelContent>

          <div className={orSeparatorStyle()}>
            <Text color="subtle" variant="tiny">
              أو
            </Text>
          </div>

          <PanelContent as={Flex} direction="column" gap="3">
            <Flex direction="column" gap="1">
              <Label htmlFor="transfer-email">المستلم</Label>
              <SearchField
                id="transfer-email"
                placeholder="user@example.com"
                value={email}
                onChange={(event) => handleEmailChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (canSubmit) {
                      handleSubmit();
                    }
                  }
                }}
                onAbort={handleClearEmail}
              />
            </Flex>

            {error !== undefined && <Text color="destructive">{error}</Text>}

            {isSelfTransfer && (
              <Text color="destructive">
                لا يمكنك نقل المشروع إلى نفسك. استخدم محدد مساحة العمل أعلاه
                لنقله.
              </Text>
            )}
          </PanelContent>
        </Flex>

        <DialogTitle>نقل المشروع</DialogTitle>
        <DialogActions>
          <Button
            color="primary"
            disabled={canSubmit === false}
            state={isSubmitting ? "pending" : undefined}
            onClick={handleSubmit}
          >
            {hasEmail ? "نقل" : "نقل"}
          </Button>
          <DialogClose>
            <Button color="ghost">إلغاء</Button>
          </DialogClose>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

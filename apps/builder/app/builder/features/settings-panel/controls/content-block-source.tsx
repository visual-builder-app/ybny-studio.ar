import { useRef, useState } from "react";
import {
  PanelContent,
  Button,
  Box,
  Dialog,
  DialogActions,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Flex,
  Grid,
  Text,
  Tooltip,
  cssVar,
  theme,
} from "@webstudio-is/design-system";
import { AlertIcon } from "@webstudio-is/icons";
import {
  formatAssetName,
  type Asset,
  type ContentBlockDiagnostic,
  type ContentBlockSource,
} from "@webstudio-is/sdk";
import { BindableExpressionControl } from "~/builder/shared/bindable-expression";
import { useBindableControl } from "./use-bindable-control";
import { SelectAsset } from "./select-asset";
import {
  deduplicateContentBlockDiagnostics,
  formatContentBlockDiagnostic,
} from "~/shared/content-block-diagnostics";

type ContentBlockSourceMutationResult =
  | Readonly<{ status: "applied" }>
  | Readonly<{ status: "partial"; message: string }>
  | Readonly<{ status: "blocked"; message: string }>;

type ContentBlockSourceActionResult =
  | ContentBlockSourceMutationResult
  | Readonly<{
      status: "requires-confirmation";
      diagnostics?: readonly ContentBlockDiagnostic[];
    }>;

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const ConnectSourceDialog = ({
  disabled,
  error,
  onClose,
  onConfirm,
}: {
  disabled: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}) => (
  <Dialog open onOpenChange={(open) => open === false && onClose()}>
    <DialogContent>
      <DialogTitle>ربط مصدر المحتوى</DialogTitle>
      <DialogDescription asChild>
        <PanelContent as={Text}>
          سيؤدي ربط هذا الملف إلى استبدال محتوى كتلة المحتوى الحالي.
          لن يتم تغيير ملف MDX.
        </PanelContent>
      </DialogDescription>
      {error !== undefined && (
        <Text
          role="alert"
          color="destructive"
          variant="tiny"
          css={{
            paddingInline: theme.panel.paddingInline,
            paddingBottom: theme.panel.paddingBlock,
          }}
        >
          {error}
        </Text>
      )}
      <DialogActions>
        <Button disabled={disabled} onClick={onConfirm}>
          Connect
        </Button>
        <DialogClose>
          <Button autoFocus color="ghost" disabled={disabled}>
            Abort
          </Button>
        </DialogClose>
      </DialogActions>
    </DialogContent>
  </Dialog>
);

/**
 * Presentation and interaction boundary for Content Block source lifecycle.
 * The caller owns loading, exact-Asset authorization, lifecycle preparation,
 * and persistence. This component never updates the src prop directly.
 */
export const ContentBlockSourceControl = ({
  source,
  resolvedAsset,
  readOnly = false,
  disabled = false,
  loading = false,
  error,
  diagnostics = [],
  persistenceStatus,
  persistenceError,
  onRetry,
  onRequestSource,
  onOpen,
}: {
  source?: ContentBlockSource;
  resolvedAsset?: Asset;
  readOnly?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  diagnostics?: readonly ContentBlockDiagnostic[];
  persistenceStatus?: "saved" | "pending" | "saving" | "failed" | "conflicting";
  persistenceError?: string;
  onRetry?: () => Promise<void>;
  onRequestSource: (input: {
    source: ContentBlockSource;
    confirmed?: boolean;
  }) => Promise<ContentBlockSourceActionResult>;
  onOpen: (assetId: string) => void;
}) => {
  const [pendingSource, setPendingSource] = useState<ContentBlockSource>();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [localError, setLocalError] = useState<string>();
  const [bindingError, setBindingError] = useState<string>();
  const isDisabled = disabled || loading || busy;
  const isSourceMutationDisabled = readOnly || isDisabled;
  const connected = source !== undefined;
  const binding = useBindableControl({
    boundExpression: source?.type === "expression" ? source : undefined,
    fallbackExpression: JSON.stringify(resolvedAsset?.id ?? ""),
  });
  const uniqueDiagnostics = deduplicateContentBlockDiagnostics(diagnostics);
  const sourceLabel = resolvedAsset
    ? formatAssetName(resolvedAsset)
    : loading
      ? "جارٍ تحميل مصدر المحتوى…"
      : source?.type === "expression"
        ? "مصدر محتوى ديناميكي"
        : source?.type === "asset"
          ? "وسيط MDX مفقود"
          : "لا يوجد مصدر محتوى";

  const beginOperation = () => {
    if (disabled || loading || busyRef.current) {
      return false;
    }
    busyRef.current = true;
    setBusy(true);
    setLocalError(undefined);
    setBindingError(undefined);
    return true;
  };

  const finishOperation = () => {
    busyRef.current = false;
    setBusy(false);
  };

  const requestSource = async (
    requestedSource: ContentBlockSource,
    confirmed?: boolean
  ) => {
    if (readOnly || beginOperation() === false) {
      return;
    }
    const setRequestError =
      requestedSource.type === "expression" ? setBindingError : setLocalError;
    try {
      const result = await onRequestSource({
        source: requestedSource,
        confirmed,
      });
      if (result.status === "requires-confirmation") {
        setPendingSource(requestedSource);
        return;
      }
      if (result.status === "blocked" || result.status === "partial") {
        setRequestError(result.message);
        return;
      }
      setPendingSource(undefined);
    } catch (error) {
      setRequestError(getErrorMessage(error, "تعذر تغيير المصدر"));
    } finally {
      finishOperation();
    }
  };

  return (
    <fieldset disabled={isDisabled} style={{ display: "contents" }}>
      <Grid gap="2">
        <BindableExpressionControl
          {...binding}
          showBinding={readOnly === false}
          value={resolvedAsset?.id}
          validate={(value) =>
            bindingError ??
            (!connected || (typeof value === "string" && value !== "")
              ? undefined
              : "يجب أن يُترجم مصدر المحتوى إلى معرّف وسيط (Asset ID)")
          }
          onChangeValue={(value) => {
            if (typeof value === "string" && value !== "") {
              void requestSource({ type: "asset", assetId: value });
            }
          }}
          onChangeExpression={(value) => {
            void requestSource({ type: "expression", value });
          }}
          onRemove={(value) => {
            if (typeof value === "string" && value !== "") {
              void requestSource({ type: "asset", assetId: value });
            }
          }}
          renderControl={() =>
            connected ? (
              <Grid columns={2} gap="2" aria-label="إجراءات مصدر المحتوى">
                <Flex align="center" gap="1">
                  <Box css={{ flex: 1 }}>
                    <SelectAsset
                      assetId={resolvedAsset?.id}
                      title="تبديل ملف MDX"
                      accept=".mdx"
                      disabled={isSourceMutationDisabled}
                      triggerLabel={sourceLabel}
                      onChange={(assetId) =>
                        void requestSource({ type: "asset", assetId })
                      }
                    />
                  </Box>
                  {uniqueDiagnostics.length > 0 && (
                    <Tooltip
                      content={
                        <Grid gap="1">
                          <Text>
                            {formatContentBlockDiagnostic(uniqueDiagnostics[0])}
                          </Text>
                          {uniqueDiagnostics.length > 1 && (
                            <Text>
                              {uniqueDiagnostics.length - 1} رسالة تشخيص إضافية
                            </Text>
                          )}
                        </Grid>
                      }
                    >
                      <Flex
                        as="span"
                        align="center"
                        role="img"
                        tabIndex={0}
                        aria-label={`تحذير مصدر MDX: ${formatContentBlockDiagnostic(uniqueDiagnostics[0])}${uniqueDiagnostics.length > 1 ? ` و${uniqueDiagnostics.length - 1} رسالة تشخيص إضافية.` : ""}`}
                        css={{
                          color: cssVar("--foreground-warning"),
                          flexShrink: 0,
                        }}
                      >
                        <AlertIcon size={14} />
                      </Flex>
                    </Tooltip>
                  )}
                </Flex>
                <Button
                  color="neutral"
                  disabled={isDisabled || resolvedAsset === undefined}
                  css={{ width: "100%" }}
                  onClick={() => {
                    if (resolvedAsset !== undefined) {
                      onOpen(resolvedAsset.id);
                    }
                  }}
                >
                  فتح
                </Button>
              </Grid>
            ) : readOnly ? null : (
              <SelectAsset
                title="اختيار ملف MDX"
                accept=".mdx"
                disabled={isDisabled}
                triggerLabel="ربط ملف ‎.mdx"
                onChange={(assetId) =>
                  void requestSource({ type: "asset", assetId })
                }
              />
            )
          }
        />

        {(localError ?? error) !== undefined && pendingSource === undefined && (
          <Text role="alert" color="destructive" variant="tiny">
            {localError ?? error}
          </Text>
        )}

        {(persistenceStatus === "pending" ||
          persistenceStatus === "saving") && (
          <Text role="status" variant="tiny">
            جارٍ حفظ مصدر المحتوى…
          </Text>
        )}

        {persistenceStatus === "failed" && (
          <Flex gap="2" align="center" wrap="wrap">
            <Text role="alert" color="destructive" variant="tiny">
              {persistenceError ?? "تعذر حفظ مصدر المحتوى."}
            </Text>
            {onRetry !== undefined && (
              <Button
                color="ghost"
                disabled={isDisabled}
                onClick={() => {
                  if (beginOperation() === false) {
                    return;
                  }
                  void onRetry()
                    .catch((error) =>
                      setLocalError(
                        getErrorMessage(error, "تعذرت إعادة محاولة الحفظ")
                      )
                    )
                    .finally(finishOperation);
                }}
              >
                إعادة المحاولة
              </Button>
            )}
          </Flex>
        )}

        {busy && (
          <Text role="status" variant="tiny">
            جارٍ تحديث مصدر المحتوى…
          </Text>
        )}

        {pendingSource !== undefined && (
          <ConnectSourceDialog
            disabled={isSourceMutationDisabled}
            error={localError ?? error}
            onClose={() => setPendingSource(undefined)}
            onConfirm={() => void requestSource(pendingSource, true)}
          />
        )}
      </Grid>
    </fieldset>
  );
};

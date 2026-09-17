import { useStore } from "@nanostores/react";
import { atom } from "nanostores";
import { useEffect, useRef, useState } from "react";
import {
  Box,
  cssVar,
  Flex,
  keyframes,
  Text,
  theme,
  Tooltip,
} from "@webstudio-is/design-system";
import { OfflineIcon } from "@webstudio-is/icons";
import { $hasUnsavedSyncChanges, $syncStatus } from "@webstudio-is/sync-client";

const syncStatusDotSavedDuration = 2000;
const syncStatusDotPendingColor = cssVar("--foreground-warning");
const $isOnline = atom(false);
const syncStatusDotConfig = {
  idle: {
    label: "حالة المزامنة: خامل",
    color: "transparent",
  },
  pending: {
    label: "حالة المزامنة: تغييرات قيد الانتظار",
    color: syncStatusDotPendingColor,
  },
  saved: {
    label: "حالة المزامنة: تم الحفظ",
    color: cssVar("--foreground-positive"),
  },
  error: {
    label: "حالة المزامنة: خطأ",
    color: cssVar("--foreground-negative"),
  },
} satisfies Record<string, { label: string; color: string }>;

type SyncStatusDotStatus = keyof typeof syncStatusDotConfig;

const syncStatusDotPendingPulse = keyframes({
  "0%": { backgroundColor: syncStatusDotPendingColor },
  "100%": { backgroundColor: "transparent" },
});

const subscribeIsOnline = () => {
  const handle = () => $isOnline.set(navigator.onLine);
  addEventListener("offline", handle);
  addEventListener("online", handle);
  return () => {
    removeEventListener("offline", handle);
    removeEventListener("online", handle);
  };
};

export const SyncStatusDot = () => {
  const statusObject = useStore($syncStatus);
  const hasUnsavedSyncChanges = useStore($hasUnsavedSyncChanges);
  const hadUnsavedSyncChangesRef = useRef(false);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [savedUntil, setSavedUntil] = useState(0);
  let visibleStatus: SyncStatusDotStatus = "idle";
  if (statusObject.status === "failed" || statusObject.status === "fatal") {
    visibleStatus = "error";
  } else if (hasUnsavedSyncChanges) {
    visibleStatus = "pending";
  } else if (Date.now() < savedUntil) {
    visibleStatus = "saved";
  }
  const statusConfig = syncStatusDotConfig[visibleStatus];
  const syncStatusDotLabel =
    visibleStatus === "error" && statusObject.status === "fatal"
      ? `${statusConfig.label}: ${statusObject.error}`
      : statusConfig.label;

  useEffect(() => {
    if (hasUnsavedSyncChanges) {
      hadUnsavedSyncChangesRef.current = true;
      return;
    }

    if (
      statusObject.status === "idle" &&
      hadUnsavedSyncChangesRef.current === true
    ) {
      hadUnsavedSyncChangesRef.current = false;
      setSavedUntil(Date.now() + syncStatusDotSavedDuration);
      clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => {
        setSavedUntil(0);
      }, syncStatusDotSavedDuration);
    }
  }, [hasUnsavedSyncChanges, statusObject.status]);

  useEffect(() => {
    return () => clearTimeout(savedTimeoutRef.current);
  }, []);

  return (
    <Box
      role="status"
      aria-label={syncStatusDotLabel}
      aria-live="polite"
      data-sync-status={visibleStatus}
      title={syncStatusDotLabel}
      style={{
        animation:
          visibleStatus === "pending"
            ? `${syncStatusDotPendingPulse} 1.8s ease-in-out infinite alternate`
            : "none",
        backgroundColor: statusConfig.color,
      }}
      css={{
        position: "absolute",
        top: theme.spacing[2],
        right: theme.spacing[2],
        width: 4,
        height: 4,
        borderRadius: 3,
        transition: "background-color 160ms ease",
      }}
    />
  );
};

export const SyncStatus = () => {
  const statusObject = useStore($syncStatus);
  const isOnline = useStore($isOnline);
  useEffect(subscribeIsOnline, []);

  if (
    statusObject.status === "idle" ||
    statusObject.status === "syncing" ||
    statusObject.status === "recovering"
  ) {
    return;
  }

  const containerProps = {
    align: "center" as const,
    justify: "center" as const,
    css: { height: theme.spacing["15"] },
    shrink: false,
  };

  if (statusObject.status === "failed") {
    return (
      <Tooltip
        variant="wrapped"
        content={
          <Text>
            {isOnline ? (
              <>
                توجد مشاكل في الاتصال. ستتم مزامنة تغييراتك
                مع Webstudio بمجرد حلها.
              </>
            ) : (
              <>
                ستتم مزامنة تغييرات وضع عدم الاتصال مع Webstudio بمجرد
                اتصالك.
                <br />
                يرجى التحقق من اتصالك بالإنترنت.
              </>
            )}
          </Text>
        }
      >
        <Flex {...containerProps}>
          <OfflineIcon
            aria-label={`حالة المزامنة: فشل`}
            color={cssVar("--foreground-negative")}
          />
        </Flex>
      </Tooltip>
    );
  }

  if (statusObject.status === "fatal") {
    return (
      <Flex {...containerProps}>
        <Tooltip variant="wrapped" content={<>{statusObject.error}</>}>
          <OfflineIcon
            aria-label={`حالة المزامنة: خطأ فادح`}
            color={cssVar("--foreground-negative")}
          />
        </Tooltip>
      </Flex>
    );
  }

  /* exhaustive check */
  statusObject satisfies never;
};

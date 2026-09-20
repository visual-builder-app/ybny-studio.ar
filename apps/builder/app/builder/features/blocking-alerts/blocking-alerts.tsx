import { useEffect, useState } from "react";
import { Alert } from "./alert";
import { useWindowResizeDebounced } from "~/shared/dom-hooks";
import { isFeatureEnabled } from "@webstudio-is/feature-flags";
import {
  PanelContent,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Link,
  Text,
} from "@webstudio-is/design-system";
import { $isPreviewMode } from "~/shared/nano-states";
import { useStore } from "@nanostores/react";
import { $loadingState } from "~/builder/shared/nano-states";
import { minimumEditorViewportWidth } from "~/builder/shared/responsive-layout";

const useTooSmallMessage = () => {
  const [message, setMessage] = useState<string>();
  const check = () => {
    // The compact shell uses overlay panels at the same widths in every build.
    const minWidth = minimumEditorViewportWidth;
    const message =
      window.innerWidth >= minWidth
        ? undefined
        : `نافذة المتصفح صغيرة جدًا. غيّر حجم المتصفح إلى ${minWidth}px عرضًا على الأقل لمواصلة البناء باستخدام Webstudio.`;
    setMessage(message);
  };

  useWindowResizeDebounced(check);
  useEffect(check, []);
  return message;
};

const useIsUnsupportedBrowser = () => {
  const [isUnsupportedBrowser, setIsUnsupportedBrowser] = useState(false);
  useEffect(() => {
    // Embedded Chromium views can omit the non-standard window.chrome global.
    const isChromium =
      "chrome" in window || /(?:Chrome|Chromium)[/][0-9]/.test(navigator.userAgent);
    if (isChromium || isFeatureEnabled("unsupportedBrowsers")) {
      return;
    }

    setIsUnsupportedBrowser(true);
  }, []);
  return isUnsupportedBrowser;
};

export const UnsupportedBrowserDialog = ({
  onDismiss,
}: {
  onDismiss: () => void;
}) => (
  <Dialog
    open
    modal
    onOpenChange={(open) => {
      if (open === false) {
        onDismiss();
      }
    }}
  >
    <DialogContent width={480}>
      <DialogTitle>متصفح غير مدعوم</DialogTitle>
      <DialogDescription asChild>
        <PanelContent as={Text}>
          تدعم واجهة محرر Webstudio حاليًا أي متصفح{" "}
          <Link
            href="https://en.wikipedia.org/wiki/Chromium_(web_browser)"
            target="_blank"
            color="inherit"
            variant="inherit"
          >
            مبني على Chromium
          </Link>{" "}
          مثل{" "}
          <Link
            href="https://www.google.com/chrome"
            target="_blank"
            color="inherit"
            variant="inherit"
          >
            Google Chrome
          </Link>
          ,{" "}
          <Link
            href="https://www.microsoft.com/en-us/edge"
            target="_blank"
            color="inherit"
            variant="inherit"
          >
            Microsoft Edge
          </Link>
          ,{" "}
          <Link
            href="https://brave.com/"
            target="_blank"
            color="inherit"
            variant="inherit"
          >
            Brave
          </Link>
          ,{" "}
          <Link
            href="https://arc.net/"
            target="_blank"
            color="inherit"
            variant="inherit"
          >
            Arc
          </Link>{" "}
          وغيرها الكثير. نخطط لدعم Firefox وSafari في المستقبل القريب.
          <br />
          <br />
          يجب أن يعمل الموقع الذي تبنيه بشكل صحيح في جميع
          المتصفحات!
        </PanelContent>
      </DialogDescription>
      <DialogActions>
        <Button autoFocus onClick={onDismiss}>
          متابعة
        </Button>
      </DialogActions>
    </DialogContent>
  </Dialog>
);

export const BlockingAlerts = () => {
  const isPreviewMode = useStore($isPreviewMode);
  const loadingState = useStore($loadingState);
  const [isUnsupportedBrowserDialogDismissed, setIsDialogDismissed] =
    useState(false);
  const isUnsupportedBrowser = useIsUnsupportedBrowser();
  const tooSmallMessage = useTooSmallMessage();

  if (
    // We want user to be able to test in unsupported browsers in preview mode.
    isPreviewMode ||
    loadingState.state !== "ready"
  ) {
    return;
  }

  if (tooSmallMessage !== undefined) {
    return <Alert message={tooSmallMessage} />;
  }

  if (isUnsupportedBrowser && isUnsupportedBrowserDialogDismissed === false) {
    return (
      <UnsupportedBrowserDialog onDismiss={() => setIsDialogDismissed(true)} />
    );
  }
};

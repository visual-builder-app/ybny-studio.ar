import { Tooltip } from "@webstudio-is/design-system";
import { useState } from "react";

export const CopyToClipboard = ({
  text,
  copyText = "نسخ إلى الحافظة",
  copiedText = "تم النسخ",
  children,
}: {
  text: string;
  copyText?: React.ReactNode;
  copiedText?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const [isCopied, setIsCopied] = useState(false);

  return (
    <div
      style={{ display: "contents" }}
      onClick={(event) => {
        event.preventDefault();
        navigator.clipboard.writeText(text);
        setIsCopied(true);
      }}
    >
      <Tooltip
        // Tooltip sometimes receives onOpenChange with isOpen=false immediately after a click.
        // Changing the key seems like a workaround to address this issue.
        key={isCopied ? "copied" : "copy"}
        disableHoverableContent
        variant="wrapped"
        content={isCopied ? copiedText : copyText}
        open={isCopied === true ? true : undefined}
        onOpenChange={(isOpen) => {
          if (isOpen === false) {
            setIsCopied(false);
          }
        }}
      >
        {children}
      </Tooltip>
    </div>
  );
};

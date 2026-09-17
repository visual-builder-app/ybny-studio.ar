import { useStore } from "@nanostores/react";
import {
  Button,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
  theme,
  Tooltip,
  rawTheme,
  Popover,
} from "@webstudio-is/design-system";
import { ShareProjectContainer } from "~/shared/share-project";
import { $authPermit } from "~/shared/nano-states";
import { $isShareDialogOpen } from "~/builder/shared/nano-states";

export const ShareButton = ({ projectId }: { projectId: string }) => {
  const isShareDialogOpen = useStore($isShareDialogOpen);
  const authPermit = useStore($authPermit);

  const isShareDisabled = authPermit !== "own";
  const tooltipContent = isShareDisabled
    ? "يمكن للمالك فقط مشاركة المشاريع"
    : undefined;

  return (
    <Popover
      modal
      open={isShareDialogOpen}
      onOpenChange={(isOpen) => {
        $isShareDialogOpen.set(isOpen);
      }}
    >
      <Tooltip
        content={tooltipContent ?? "مشاركة رابط المشروع"}
        sideOffset={Number.parseFloat(rawTheme.spacing[5])}
      >
        <PopoverTrigger asChild>
          <Button color="ghost" disabled={isShareDisabled}>
            مشاركة
          </Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent css={{ marginRight: theme.spacing[3] }}>
        <ShareProjectContainer projectId={projectId} />
        <PopoverTitle>مشاركة</PopoverTitle>
      </PopoverContent>
    </Popover>
  );
};

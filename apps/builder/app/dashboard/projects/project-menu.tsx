import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  IconButton,
  theme,
} from "@webstudio-is/design-system";
import { EllipsesIcon } from "@webstudio-is/icons";
import { useStore } from "@nanostores/react";
import type { DialogType } from "./project-dialogs";
import { useDuplicateProject } from "./project-dialogs";
import { builderUrl } from "~/shared/router-utils";
import { $permissions } from "~/shared/nano-states";

type ProjectMenuProps = {
  projectId: string;
  onOpenChange: (dialog: DialogType) => void;
};

export const ProjectMenu = ({ projectId, onOpenChange }: ProjectMenuProps) => {
  const permissions = useStore($permissions);
  const [isOpen, setIsOpen] = useState(false);
  const handleDuplicateProject = useDuplicateProject(projectId);

  const handleOpenInSafeMode = () => {
    window.location.href = builderUrl({
      origin: window.origin,
      projectId,
      safemode: true,
    });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <IconButton
          aria-label="القائمة"
          tabIndex={-1}
          css={{ alignSelf: "center", position: "relative", zIndex: 1 }}
        >
          <EllipsesIcon width={15} height={15} />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={4}
        css={{ width: theme.spacing[24] }}
      >
        {permissions.canDuplicate && (
          <DropdownMenuItem onSelect={handleDuplicateProject}>
            إنشاء نسخة
          </DropdownMenuItem>
        )}
        {permissions.canRename && (
          <DropdownMenuItem onSelect={() => onOpenChange("rename")}>
            إعادة تسمية
          </DropdownMenuItem>
        )}
        {permissions.canShare && (
          <DropdownMenuItem onSelect={() => onOpenChange("share")}>
            مشاركة
          </DropdownMenuItem>
        )}
        {permissions.canDelete && (
          <DropdownMenuItem onSelect={() => onOpenChange("delete")}>
            حذف
          </DropdownMenuItem>
        )}
        {permissions.canTransfer && (
          <DropdownMenuItem onSelect={() => onOpenChange("transfer")}>
            نقل
          </DropdownMenuItem>
        )}
        {permissions.canEditTags && (
          <DropdownMenuItem onSelect={() => onOpenChange("tags")}>
            وسوم
          </DropdownMenuItem>
        )}
        {permissions.canOpenSettings && (
          <DropdownMenuItem onSelect={() => onOpenChange("settings")}>
            الإعدادات
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={handleOpenInSafeMode}>
          فتح في الوضع الآمن
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

import { DropdownMenuTrigger, IconButton } from "@webstudio-is/design-system";
import { MenuIcon } from "@webstudio-is/icons";

export const MenuButton = () => {
  return (
    <DropdownMenuTrigger asChild>
      <IconButton type="button" aria-label="القائمة" size="large">
        <MenuIcon size={22} />
      </IconButton>
    </DropdownMenuTrigger>
  );
};

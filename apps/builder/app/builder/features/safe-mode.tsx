import { useState } from "react";
import { ShieldIcon } from "@webstudio-is/icons";
import {
  PanelContent,
  Popover,
  cssVar,
  PopoverTrigger,
  PopoverContent,
  theme,
  IconButton,
  Button,
  Text,
  Flex,
} from "@webstudio-is/design-system";
import { builderApi } from "~/shared/builder-api";

export const SafeModeButton = () => {
  const [open, setOpen] = useState(false);

  if (!builderApi.isSafeMode()) {
    return;
  }

  const handleExitSafeMode = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("safemode");
    window.location.href = url.href;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <IconButton type="button" aria-label="الوضع الآمن نشط">
          <ShieldIcon stroke={cssVar("--foreground-negative")} />
        </IconButton>
      </PopoverTrigger>
      <PopoverContent>
        <PanelContent
          as={Flex}
          direction="column"
          gap="2"
          css={{
            width: theme.spacing[30],
          }}
        >
          <Text variant="regularBold">الوضع الآمن نشط</Text>
          <Text>
            يمنع الوضع الآمن تنفيذ أي JavaScript خارجي. لن تشغّل تضمينات HTML
            السكربتات حتى لو كان خيار "تشغيل السكربتات على اللوحة" مفعّلًا.
          </Text>
          <Button color="destructive" onClick={handleExitSafeMode}>
            الخروج من الوضع الآمن
          </Button>
        </PanelContent>
      </PopoverContent>
    </Popover>
  );
};

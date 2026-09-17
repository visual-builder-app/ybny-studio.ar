import { useStore } from "@nanostores/react";
import { cssVar, Flex, Tooltip, theme } from "@webstudio-is/design-system";
import { CloudIcon } from "@webstudio-is/icons";
import { $authPermit } from "~/shared/nano-states";

export const ViewMode = () => {
  const authPermit = useStore($authPermit);

  if (authPermit !== "view") {
    return;
  }

  return (
    <Tooltip content={"وضع العرض. لن يتم حفظ تغييراتك"}>
      <Flex
        align="center"
        justify="center"
        css={{ height: theme.spacing["15"] }}
        shrink={false}
      >
        <CloudIcon
          color={cssVar("--foreground-warning")}
          aria-label="وضع العرض. لن يتم حفظ تغييراتك"
        />
      </Flex>
    </Tooltip>
  );
};

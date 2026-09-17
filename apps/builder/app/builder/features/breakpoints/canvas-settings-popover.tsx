import { useStore } from "@nanostores/react";
import {
  PanelContent,
  theme,
  Flex,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  InputField,
  Button,
  Text,
} from "@webstudio-is/design-system";
import { WidthInput } from "./width-input";
import { minCanvasWidth } from "~/shared/breakpoints-utils";
import { $canvasWidth, $scale } from "~/builder/shared/nano-states";
import { $selectedBreakpoint } from "~/shared/nano-states";
import { ChevronDownIcon } from "@webstudio-is/icons";
import { useState } from "react";

export const CanvasSettingsPopover = () => {
  const selectedBreakpoint = useStore($selectedBreakpoint);
  const scale = useStore($scale);
  const canvasWidth = useStore($canvasWidth);
  const [isOpen, setIsOpen] = useState(false);
  if (selectedBreakpoint === undefined || canvasWidth === undefined) {
    return;
  }
  const roundedScale = Math.round(scale);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger aria-label="إعدادات اللوحة" asChild>
        <Button type="button" color="ghost">
          <Text
            css={{
              display: "flex",
              gap: "1ch",
              fontVariantNumeric: "tabular-nums",
            }}
            color={isOpen ? "main" : "subtle"}
          >
            {Math.round(canvasWidth)}px
            {roundedScale !== 100 && <span>{`${roundedScale}%`}</span>}
            <ChevronDownIcon />
          </Text>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        collisionPadding={4}
        align="start"
        css={{ width: theme.spacing[30] }}
      >
        <PanelContent as={Flex} gap="3">
          <WidthInput min={minCanvasWidth} />
          <Flex align="center" gap="2">
            <Label>القياس</Label>
            <InputField
              value={`${Math.round(scale)}%`}
              tabIndex={-1}
              readOnly
            />
          </Flex>
        </PanelContent>
      </PopoverContent>
    </Popover>
  );
};

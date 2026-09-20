/**
 * Will be fully rewritten in next iteration,
 * as of now just implement feature parity with old backgrounds section
 **/

import { type ReactNode, useCallback, useRef, useState } from "react";
import { propertyDescriptions } from "@webstudio-is/css-data";
import {
  RepeatGridIcon,
  RepeatColumnIcon,
  RepeatRowIcon,
  XSmallIcon,
  ImageIcon,
  GradientLinearIcon,
  GradientConicIcon,
  GradientRadialIcon,
} from "@webstudio-is/icons";
import { type StyleValue, toValue } from "@webstudio-is/css-engine";
import {
  PanelContent,
  cssVar,
  theme,
  Flex,
  Grid,
  ToggleGroup,
  ToggleGroupButton,
  Separator,
  styled,
  Box,
  EnhancedTooltip,
  ScrollArea,
} from "@webstudio-is/design-system";
import { SelectControl } from "../../controls";
import { ToggleGroupTooltip } from "../../controls/toggle-group/toggle-group-control";
import { useReadonly } from "../../shared/readonly";
import { BackgroundSize } from "./background-size";
import { BackgroundGradient } from "./background-gradient";
import { BackgroundImage } from "./background-image";
import { BackgroundPosition } from "./background-position";
import {
  PropertyLabel,
  PropertyValueTooltip,
  PropertyInlineLabel,
} from "../../property-label";
import { useComputedStyleDecl } from "../../shared/model";
import {
  getRepeatedStyleItem,
  setRepeatedStyleItem,
} from "../../shared/repeated-style";
import type { ComputedStyleDecl } from "~/shared/style-object-model";
import {
  detectBackgroundType,
  formatGradientForType,
  getBackgroundStyleItem,
  type BackgroundType,
} from "./gradient-utils";
import { CollapsibleSectionRoot } from "~/builder/shared/collapsible-section";
import { useLocale } from "~/i18n/context";

const ColorSwatchIcon = styled("div", {
  width: theme.spacing[7],
  height: theme.spacing[7],
  borderRadius: theme.borderRadius[3],
  backgroundColor: cssVar("--foreground-primary"),
  boxShadow: `inset 0 0 0 1px ${cssVar("--border-default")}`,
});

type BackgroundTypeOption = {
  value: BackgroundType;
  label: string;
  code: string;
  icon: ReactNode;
  autoFocus?: boolean;
};

// looks like now when dialog is open first toggle group buttons need to have autoFocus
// otherwise the following "Choose image" button is focused
// https://github.com/radix-ui/primitives/pull/2027
// https://github.com/radix-ui/primitives/issues/1910
const backgroundTypeOptions: BackgroundTypeOption[] = [
  {
    value: "image",
    code: "background-image: url(...);",
    icon: <ImageIcon />,
    autoFocus: true,
  },
  {
    value: "solid",
    code: "background-image: linear-gradient(color, color);",
    icon: <ColorSwatchIcon />,
  },
  {
    value: "linearGradient",
    code: "background-image: linear-gradient(...);",
    icon: <GradientLinearIcon />,
  },
  {
    value: "radialGradient",
    code: "background-image: radial-gradient(...);",
    icon: <GradientRadialIcon />,
  },
  {
    value: "conicGradient",
    code: "background-image: conic-gradient(...);",
    icon: <GradientConicIcon />,
  },
];

type BackgroundTypeToggleProps = {
  disabled?: boolean;
  value: BackgroundType;
  onChange: (value: BackgroundType) => void;
  backgroundStyleItem: StyleValue | undefined;
  styleDecl: ComputedStyleDecl;
  index: number;
  cachedValues: React.MutableRefObject<
    Partial<Record<BackgroundType, StyleValue>>
  >;
};

const BackgroundTypeToggle = ({
  disabled,
  value,
  onChange,
  backgroundStyleItem,
  styleDecl,
  index,
  cachedValues,
}: BackgroundTypeToggleProps) => {
  const handleValueChange = useCallback(
    (nextValue: BackgroundType) => {
      if (nextValue === value) {
        return;
      }

      // Cache current value before switching
      if (backgroundStyleItem !== undefined) {
        cachedValues.current[value] = backgroundStyleItem;
      }

      onChange(nextValue);

      // Check if we have a cached value for the new type
      const cachedValue = cachedValues.current[nextValue];

      if (nextValue === "image") {
        // For image, restore cached value or set to none
        if (cachedValue !== undefined) {
          setRepeatedStyleItem(styleDecl, index, cachedValue);
        } else {
          setRepeatedStyleItem(styleDecl, index, {
            type: "keyword",
            value: "none",
          });
        }
      } else {
        // For gradients and solid color, restore cached or generate new
        const gradientValue = cachedValue
          ? cachedValue.type === "unparsed"
            ? cachedValue.value
            : formatGradientForType(cachedValue, nextValue)
          : formatGradientForType(backgroundStyleItem, nextValue);

        setRepeatedStyleItem(styleDecl, index, {
          type: "unparsed",
          value: gradientValue,
        });
      }
    },
    [backgroundStyleItem, index, onChange, styleDecl, value, cachedValues]
  );

  const { dict } = useLocale();
  return (
    <ToggleGroup
      type="single"
      disabled={disabled}
      value={value}
      aria-label={dict.stylePanel.backgrounds.typeGroupLabel}
      onValueChange={handleValueChange}
    >
      {backgroundTypeOptions.map((option) => {
        const { value: optionValue, icon, autoFocus } = option;
        const label = dict.stylePanel.backgrounds.types[optionValue].label;
        return (
          <EnhancedTooltip key={optionValue} content={label}>
            <ToggleGroupButton
              value={optionValue}
              aria-label={label}
              autoFocus={autoFocus}
            >
              <Flex css={{ px: theme.spacing[3] }}>{icon}</Flex>
            </ToggleGroupButton>
          </EnhancedTooltip>
        );
      })}
    </ToggleGroup>
  );
};

const BackgroundRepeat = ({
  index,
  disabled,
}: {
  index: number;
  disabled?: boolean;
}) => {
  const styleDecl = useComputedStyleDecl("background-repeat");
  const value = getRepeatedStyleItem(styleDecl, index);
  const { dict } = useLocale();
  const items = [
    {
      child: <XSmallIcon />,
      description: dict.stylePanel.backgrounds.repeatValues["no-repeat"],
      value: "no-repeat" as const,
    },
    {
      child: <RepeatGridIcon />,
      description: dict.stylePanel.backgrounds.repeatValues["repeat"],
      value: "repeat" as const,
    },
    {
      child: <RepeatColumnIcon />,
      description: dict.stylePanel.backgrounds.repeatValues["repeat-y"],
      value: "repeat-y" as const,
    },
    {
      child: <RepeatRowIcon />,
      description: dict.stylePanel.backgrounds.repeatValues["repeat-x"],
      value: "repeat-x" as const,
    },
  ];
  // Issue: The tooltip's grace area is too big and overlaps with nearby buttons,
  // preventing the tooltip from changing when the buttons are hovered over in certain cases.
  // To solve issue and allow tooltips to change on button hover,
  // we close the button tooltip in the ToggleGroupButton.onMouseEnter handler.
  // onMouseEnter used to preserve default hovering behavior on tooltip.
  const [activeTooltip, setActiveTooltip] = useState<undefined | string>();
  return (
    <PropertyValueTooltip
      label={dict.stylePanel.backgrounds.repeat}
      description={propertyDescriptions.backgroundRepeat}
      properties={["background-repeat"]}
    >
      <ToggleGroup
        type="single"
        disabled={disabled}
        value={toValue(value)}
        aria-label={dict.stylePanel.backgrounds.repeatTitle}
        onValueChange={(value) => {
          setRepeatedStyleItem(styleDecl, index, { type: "keyword", value });
        }}
      >
        {items.map((item) => (
          <ToggleGroupTooltip
            key={item.value}
            isOpen={item.value === activeTooltip}
            onOpenChange={(isOpen) =>
              setActiveTooltip(isOpen ? item.value : undefined)
            }
            isSelected={false}
            label={dict.stylePanel.backgrounds.repeatTitle}
            code={`background-repeat: ${item.value};`}
            description={item.description}
            properties={["background-repeat"]}
          >
            <ToggleGroupButton
              value={item.value}
              aria-label={dict.stylePanel.backgrounds.repeatAria[item.value]}
              onMouseEnter={() =>
                // reset only when highlighted is not active
                setActiveTooltip((prevValue) =>
                  prevValue === item.value ? prevValue : undefined
                )
              }
            >
              {item.child}
            </ToggleGroupButton>
          </ToggleGroupTooltip>
        ))}
      </ToggleGroup>
    </PropertyValueTooltip>
  );
};

const BackgroundAttachment = ({
  index,
  disabled,
}: {
  index: number;
  disabled?: boolean;
}) => {
  const styleDecl = useComputedStyleDecl("background-attachment");
  const value = getRepeatedStyleItem(styleDecl, index);
  const { dict } = useLocale();
  return (
    <PropertyValueTooltip
      label={dict.stylePanel.backgrounds.attachment}
      description={propertyDescriptions.backgroundAttachment}
      properties={["background-attachment"]}
    >
      <ToggleGroup
        type="single"
        disabled={disabled}
        value={toValue(value)}
        aria-label={dict.stylePanel.backgrounds.attachmentTitle}
        onValueChange={(value) => {
          setRepeatedStyleItem(styleDecl, index, { type: "keyword", value });
        }}
      >
        <ToggleGroupButton value={"scroll"}>
          <Flex css={{ px: theme.spacing[3] }}>
            {dict.stylePanel.backgrounds.attachmentValues.scroll}
          </Flex>
        </ToggleGroupButton>
        <ToggleGroupButton value={"fixed"}>
          <Flex css={{ px: theme.spacing[3] }}>
            {dict.stylePanel.backgrounds.attachmentValues.fixed}
          </Flex>
        </ToggleGroupButton>
      </ToggleGroup>
    </PropertyValueTooltip>
  );
};

const OtherLayerProperties = ({ index }: { index: number }) => {
  const readonly = useReadonly();
  const { dict } = useLocale();
  return (
    <CollapsibleSectionRoot
      label={dict.stylePanel.backgrounds.otherProperties}
      fullWidth={true}
    >
      <Flex
        gap="2"
        direction="column"
        css={{ paddingInline: theme.panel.paddingInline }}
      >
        <Grid columns={2} gap={2}>
          <PropertyLabel
            label={dict.stylePanel.backgrounds.blendMode}
            description={propertyDescriptions.backgroundBlendMode}
            properties={["background-blend-mode"]}
          />
          <SelectControl
            disabled={readonly}
            property="background-blend-mode"
            index={index}
          />
        </Grid>
        <BackgroundSize disabled={readonly} index={index} />
        <BackgroundPosition disabled={readonly} index={index} />
        <Grid columns={2} align="center" gap={2}>
          <PropertyLabel
            label={dict.stylePanel.backgrounds.repeat}
            description={propertyDescriptions.backgroundRepeat}
            properties={["background-repeat"]}
          />
          <BackgroundRepeat disabled={readonly} index={index} />

          <PropertyLabel
            label={dict.stylePanel.backgrounds.attachment}
            description={propertyDescriptions.backgroundAttachment}
            properties={["background-attachment"]}
          />
          <BackgroundAttachment disabled={readonly} index={index} />
        </Grid>
        <Grid columns={2} align="center" gap={2}>
          <PropertyLabel
            label={dict.stylePanel.backgrounds.clip}
            description={propertyDescriptions.backgroundClip}
            properties={["background-clip"]}
          />
          <SelectControl
            disabled={readonly}
            property="background-clip"
            index={index}
          />

          <PropertyLabel
            label={dict.stylePanel.backgrounds.origin}
            description={propertyDescriptions.backgroundOrigin}
            properties={["background-origin"]}
          />
          <SelectControl
            disabled={readonly}
            property="background-origin"
            index={index}
          />
        </Grid>
      </Flex>
    </CollapsibleSectionRoot>
  );
};

export const BackgroundContent = ({ index }: { index: number }) => {
  const readonly = useReadonly();
  const { dict } = useLocale();
  const backgroundImage = useComputedStyleDecl("background-image");
  const backgroundStyleItem = getBackgroundStyleItem(backgroundImage, index);

  const [backgroundType, setBackgroundType] = useState<BackgroundType>(() =>
    detectBackgroundType(backgroundStyleItem)
  );

  // Cache background values for each type to preserve user's intermediate changes
  const cachedValuesRef = useRef<Partial<Record<BackgroundType, StyleValue>>>(
    {}
  );

  return (
    <>
      <PanelContent
        as={Flex}
        align="center"
        gap="2"
        justify="between"
        shrink={false}
      >
        <PropertyInlineLabel
          label={dict.stylePanel.backgrounds.typeLabel}
          description={propertyDescriptions.backgroundImage}
        />
        <BackgroundTypeToggle
          disabled={readonly}
          value={backgroundType}
          onChange={setBackgroundType}
          backgroundStyleItem={backgroundStyleItem}
          styleDecl={backgroundImage}
          index={index}
          cachedValues={cachedValuesRef}
        />
      </PanelContent>

      <Separator />

      <ScrollArea>
        <Box css={{ maxHeight: 500 }}>
          {(backgroundType === "linearGradient" ||
            backgroundType === "conicGradient" ||
            backgroundType === "radialGradient" ||
            backgroundType === "solid") && (
            <BackgroundGradient
              index={index}
              type={
                backgroundType === "conicGradient"
                  ? "conic"
                  : backgroundType === "radialGradient"
                    ? "radial"
                    : "linear"
              }
              variant={backgroundType === "solid" ? "solid" : "default"}
            />
          )}

          {backgroundType === "image" && (
            <BackgroundImage index={index} disabled={readonly} />
          )}

          <Separator />

          <OtherLayerProperties index={index} />
        </Box>
      </ScrollArea>
    </>
  );
};

import {
  toValue,
  type CssProperty,
  type StyleValue,
} from "@webstudio-is/css-engine";
import { Tooltip, Flex, Text, cssVar } from "@webstudio-is/design-system";
import { InfoCircleIcon } from "@webstudio-is/icons";
import { RepeatedStyleSection } from "../../shared/style-section";
import { FilterSectionContent } from "../../shared/filter-content";
import { parseCssFragment } from "../../shared/css-fragment";
import {
  addRepeatedStyleItem,
  editRepeatedStyleItem,
  RepeatedStyle,
} from "../../shared/repeated-style";
import { useComputedStyleDecl } from "../../shared/model";
import { useLocale } from "~/i18n/context";
import { resolveFilterLabel } from "~/i18n/style-properties";
import type { Dictionary } from "~/i18n/dictionaries";

export const properties = ["backdrop-filter"] satisfies [
  CssProperty,
  ...CssProperty[],
];

const initialBackdropFilter = "blur(0px)";

const getItemProps = (dict: Dictionary, _index: number, value: StyleValue) => {
  const label =
    value.type === "function"
      ? `${resolveFilterLabel(dict, value.name)}: ${toValue(value.args)}`
      : dict.stylePanel.filters.unknown;
  return { label };
};

export const Section = () => {
  const { dict } = useLocale();
  const styleDecl = useComputedStyleDecl("backdrop-filter");

  return (
    <RepeatedStyleSection
      label={dict.stylePanel.filters.backdropLabel}
      description={dict.stylePanel.filters.backdropDescription}
      properties={properties}
      onAdd={() => {
        addRepeatedStyleItem(
          [styleDecl],
          parseCssFragment(initialBackdropFilter, ["backdrop-filter"]).styles
        );
      }}
    >
      <RepeatedStyle
        label={dict.stylePanel.filters.backdropLabel}
        styles={[styleDecl]}
        getItemProps={(index, value) => getItemProps(dict, index, value)}
        renderItemContent={(index, primaryValue) => (
          <FilterSectionContent
            index={index}
            property="backdrop-filter"
            propertyValue={toValue(primaryValue)}
            layer={primaryValue}
            onEditLayer={(index, value, options) => {
              editRepeatedStyleItem(
                [styleDecl],
                index,
                new Map([["backdrop-filter", value]]),
                options
              );
            }}
            tooltip={
              <Tooltip
                variant="wrapped"
                content={
                  <Flex gap="2" direction="column">
                    <Text variant="regularBold">
                      {dict.stylePanel.filters.backdropLabel}
                    </Text>
                    <Text variant="monoBold">backdrop-filter</Text>
                    <Text>
                      {dict.stylePanel.filters.backdropSyntaxHint}
                      <br /> <br />
                      <Text variant="mono">{initialBackdropFilter}</Text>
                    </Text>
                  </Flex>
                }
              >
                <InfoCircleIcon color={cssVar("--foreground-secondary")} />
              </Tooltip>
            }
          />
        )}
      />
    </RepeatedStyleSection>
  );
};

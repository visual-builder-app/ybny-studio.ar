import { Flex, Tooltip, Text, cssVar } from "@webstudio-is/design-system";
import { InfoCircleIcon } from "@webstudio-is/icons";
import {
  toValue,
  type CssProperty,
  type StyleValue,
} from "@webstudio-is/css-engine";
import { RepeatedStyleSection } from "../../shared/style-section";
import { FilterSectionContent } from "../../shared/filter-content";
import {
  addRepeatedStyleItem,
  editRepeatedStyleItem,
  RepeatedStyle,
} from "../../shared/repeated-style";
import { parseCssFragment } from "../../shared/css-fragment";
import { useComputedStyleDecl } from "../../shared/model";
import { useLocale } from "~/i18n/context";
import { resolveFilterLabel } from "~/i18n/style-properties";
import type { Dictionary } from "~/i18n/dictionaries";

export const properties = ["filter"] satisfies [CssProperty, ...CssProperty[]];

const initialFilter = "blur(0px)";

const getItemProps = (dict: Dictionary, _index: number, value: StyleValue) => {
  const label =
    value.type === "function"
      ? `${resolveFilterLabel(dict, value.name)}: ${toValue(value.args)}`
      : dict.stylePanel.filters.unknown;
  return { label };
};

export const Section = () => {
  const { dict } = useLocale();
  const styleDecl = useComputedStyleDecl("filter");

  return (
    <RepeatedStyleSection
      label={dict.stylePanel.filters.label}
      description={dict.stylePanel.filters.description}
      properties={properties}
      onAdd={() => {
        addRepeatedStyleItem(
          [styleDecl],
          parseCssFragment(initialFilter, ["filter"]).styles
        );
      }}
    >
      <RepeatedStyle
        label={dict.stylePanel.filters.label}
        styles={[styleDecl]}
        getItemProps={(index, value) => getItemProps(dict, index, value)}
        renderItemContent={(index, primaryValue) => (
          <FilterSectionContent
            index={index}
            property="filter"
            propertyValue={toValue(primaryValue)}
            layer={primaryValue}
            onEditLayer={(index, value, options) => {
              editRepeatedStyleItem(
                [styleDecl],
                index,
                new Map([["filter", value]]),
                options
              );
            }}
            tooltip={
              <Tooltip
                variant="wrapped"
                content={
                  <Flex gap="2" direction="column">
                    <Text variant="regularBold">
                      {dict.stylePanel.filters.label}
                    </Text>
                    <Text variant="monoBold">filter</Text>
                    <Text>
                      {dict.stylePanel.filters.syntaxHint}
                      <br /> <br />
                      <Text variant="mono">{initialFilter}</Text>
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

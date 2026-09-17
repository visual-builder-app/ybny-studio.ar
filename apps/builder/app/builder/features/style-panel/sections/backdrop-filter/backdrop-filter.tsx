import {
  toValue,
  type CssProperty,
  type StyleValue,
} from "@webstudio-is/css-engine";
import { Tooltip, Flex, Text, cssVar } from "@webstudio-is/design-system";
import { InfoCircleIcon } from "@webstudio-is/icons";
import { humanizeString } from "~/shared/string-utils";
import { RepeatedStyleSection } from "../../shared/style-section";
import { FilterSectionContent } from "../../shared/filter-content";
import { parseCssFragment } from "../../shared/css-fragment";
import {
  addRepeatedStyleItem,
  editRepeatedStyleItem,
  RepeatedStyle,
} from "../../shared/repeated-style";
import { useComputedStyleDecl } from "../../shared/model";

export const properties = ["backdrop-filter"] satisfies [
  CssProperty,
  ...CssProperty[],
];

const label = "مرشحات الخلفية";
const initialBackdropFilter = "blur(0px)";

const getItemProps = (_index: number, value: StyleValue) => {
  const label =
    value.type === "function"
      ? `${humanizeString(value.name)}: ${toValue(value.args)}`
      : "مرشح غير معروف";
  return { label };
};

export const Section = () => {
  const styleDecl = useComputedStyleDecl("backdrop-filter");

  return (
    <RepeatedStyleSection
      label={label}
      description="مرشحات الخلفية مشابهة للمرشحات، لكنها تُطبَّق على المنطقة خلف العنصر. تفيد في إنشاء تأثير الزجاج المصنفر."
      properties={properties}
      onAdd={() => {
        addRepeatedStyleItem(
          [styleDecl],
          parseCssFragment(initialBackdropFilter, ["backdrop-filter"]).styles
        );
      }}
    >
      <RepeatedStyle
        label={label}
        styles={[styleDecl]}
        getItemProps={getItemProps}
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
                    <Text variant="regularBold">{label}</Text>
                    <Text variant="monoBold">backdrop-filter</Text>
                    <Text>
                      يطبّق مؤثرات رسومية مثل التمويه أو تغيير اللون على
                      المنطقة خلف العنصر
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

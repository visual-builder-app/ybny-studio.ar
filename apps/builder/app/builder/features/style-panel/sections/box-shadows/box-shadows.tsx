import {
  toValue,
  type CssProperty,
  type StyleValue,
} from "@webstudio-is/css-engine";
import { RepeatedStyleSection } from "../../shared/style-section";
import { ShadowContent } from "../../shared/shadow-content";
import { useComputedStyleDecl } from "../../shared/model";
import {
  addRepeatedStyleItem,
  editRepeatedStyleItem,
  getComputedRepeatedItem,
  RepeatedStyle,
} from "../../shared/repeated-style";
import { parseCssFragment } from "../../shared/css-fragment";
import { useLocale } from "~/i18n/context";
import { getActiveDictionary } from "~/i18n/context";

export const properties = ["box-shadow"] satisfies [
  CssProperty,
  ...CssProperty[],
];

const initialBoxShadow = "0px 2px 5px 0px rgba(0, 0, 0, 0.2)";

const getItemProps = (layer: StyleValue, computedLayer?: StyleValue) => {
  const shadowValue =
    layer.type === "shadow"
      ? layer
      : computedLayer?.type === "shadow"
        ? computedLayer
        : undefined;
  const labels = [];
  if (shadowValue?.position === "inset") {
    labels.push(getActiveDictionary().stylePanel.boxShadows.inner);
  } else {
    labels.push(getActiveDictionary().stylePanel.boxShadows.outer);
  }
  if (layer.type === "var") {
    labels.push(`--${layer.value}`);
  } else if (shadowValue) {
    labels.push(toValue(shadowValue.offsetX));
    labels.push(toValue(shadowValue.offsetY));
    labels.push(toValue(shadowValue.blur));
    labels.push(toValue(shadowValue.spread));
  } else {
    labels.push(toValue(layer));
  }
  const color = shadowValue?.color ? toValue(shadowValue.color) : undefined;
  return { label: labels.join(" "), color };
};

export const Section = () => {
  const { dict } = useLocale();
  const styleDecl = useComputedStyleDecl("box-shadow");

  return (
    <RepeatedStyleSection
      label={dict.stylePanel.boxShadows.title}
      description={dict.stylePanel.boxShadows.description}
      properties={properties}
      onAdd={() => {
        addRepeatedStyleItem(
          [styleDecl],
          parseCssFragment(initialBoxShadow, ["box-shadow"]).styles
        );
      }}
    >
      <RepeatedStyle
        label={dict.stylePanel.boxShadows.title}
        styles={[styleDecl]}
        getItemProps={(index, layer) =>
          getItemProps(layer, getComputedRepeatedItem(styleDecl, index))
        }
        renderItemContent={(index, value) => (
          <ShadowContent
            index={index}
            layer={value}
            computedLayer={getComputedRepeatedItem(styleDecl, index)}
            property="box-shadow"
            propertyValue={toValue(value)}
            onEditLayer={(index, value, options) => {
              editRepeatedStyleItem(
                [styleDecl],
                index,
                new Map([["box-shadow", value]]),
                options
              );
            }}
          />
        )}
      />
    </RepeatedStyleSection>
  );
};

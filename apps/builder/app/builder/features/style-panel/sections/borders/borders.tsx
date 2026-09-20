import type { CssProperty } from "@webstudio-is/css-engine";
import { StyleSection } from "../../shared/style-section";
import {
  BorderRadius,
  properties as borderRadiusProperties,
} from "./border-radius";
import {
  BorderStyle,
  properties as borderStyleProperties,
} from "./border-style";
import {
  BorderWidth,
  properties as borderWidthProperties,
} from "./border-width";
import {
  BorderColor,
  properties as borderColorProperties,
} from "./border-color";
import { useLocale } from "~/i18n/context";

export const properties = [
  ...borderColorProperties,
  ...borderRadiusProperties,
  ...borderStyleProperties,
  ...borderWidthProperties,
] satisfies CssProperty[];

export const Section = () => {
  const { dict } = useLocale();
  return (
    <StyleSection
      label={dict.stylePanel.bordersSection.label}
      properties={properties}
    >
      <BorderStyle />
      <BorderColor />
      <BorderWidth />
      <BorderRadius />
    </StyleSection>
  );
};

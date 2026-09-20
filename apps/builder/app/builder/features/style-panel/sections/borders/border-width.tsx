import type { CssProperty } from "@webstudio-is/css-engine";
import {
  BorderWidthIndividualIcon,
  BorderWidthTopIcon,
  BorderWidthRightIcon,
  BorderWidthBottomIcon,
  BorderWidthLeftIcon,
} from "@webstudio-is/icons";
import { BorderProperty } from "./border-property";
import { useLocale } from "~/i18n/context";

export const properties = [
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
] satisfies CssProperty[];

const borderPropertyOptions = {
  "border-top-width": {
    icon: <BorderWidthTopIcon />,
  },
  "border-right-width": {
    icon: <BorderWidthRightIcon />,
  },
  "border-left-width": {
    icon: <BorderWidthLeftIcon />,
  },
  "border-bottom-width": {
    icon: <BorderWidthBottomIcon />,
  },
} as const satisfies Partial<{ [property in CssProperty]: unknown }>;

export const BorderWidth = () => {
  const { dict } = useLocale();
  return (
    <BorderProperty
      label={dict.stylePanel.borderWidth.label}
      description={dict.stylePanel.borderWidth.description}
      borderPropertyOptions={borderPropertyOptions}
      individualModeIcon={<BorderWidthIndividualIcon />}
    />
  );
};

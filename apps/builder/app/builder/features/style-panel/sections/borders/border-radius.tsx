import type { CssProperty } from "@webstudio-is/css-engine";
import {
  BorderRadiusIndividualIcon,
  BorderRadiusBottomRightIcon,
  BorderRadiusTopLeftIcon,
  BorderRadiusTopRightIcon,
  BorderRadiusBottomLeftIcon,
} from "@webstudio-is/icons";
import { BorderProperty } from "./border-property";
import { useLocale } from "~/i18n/context";

export const properties = [
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-left-radius",
  "border-bottom-right-radius",
] satisfies Array<CssProperty>;

const borderPropertyOptions = {
  "border-top-left-radius": {
    icon: <BorderRadiusTopLeftIcon />,
  },
  "border-top-right-radius": {
    icon: <BorderRadiusTopRightIcon />,
  },
  "border-bottom-left-radius": {
    icon: <BorderRadiusBottomLeftIcon />,
  },
  "border-bottom-right-radius": {
    icon: <BorderRadiusBottomRightIcon />,
  },
} as const satisfies Partial<{ [property in CssProperty]: unknown }>;

export const BorderRadius = () => {
  const { dict } = useLocale();
  return (
    <BorderProperty
      label={dict.stylePanel.borderRadius.label}
      description={dict.stylePanel.borderRadius.description}
      borderPropertyOptions={borderPropertyOptions}
      individualModeIcon={<BorderRadiusIndividualIcon />}
    />
  );
};

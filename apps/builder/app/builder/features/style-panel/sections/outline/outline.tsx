import { Grid, theme } from "@webstudio-is/design-system";
import {
  MinusIcon,
  DashedBorderIcon,
  DottedBorderIcon,
  XSmallIcon,
} from "@webstudio-is/icons";
import { propertyDescriptions } from "@webstudio-is/css-data";
import { toValue, type CssProperty } from "@webstudio-is/css-engine";
import { ColorControl, TextControl } from "../../controls";
import { StyleSection } from "../../shared/style-section";
import { PropertyLabel } from "../../property-label";
import { useComputedStyleDecl } from "../../shared/model";
import { ToggleGroupControl } from "../../controls/toggle-group/toggle-group-control";
import { useLocale } from "~/i18n/context";

export const properties = [
  "outline-style",
  "outline-color",
  "outline-width",
  "outline-offset",
] satisfies CssProperty[];

export const Section = () => {
  const { dict } = useLocale();
  const outlineStyle = useComputedStyleDecl("outline-style");
  const outlineStyleValue = toValue(outlineStyle.cascadedValue);

  return (
    <StyleSection
      label={dict.stylePanel.outline.sectionLabel}
      properties={properties}
    >
      <Grid
        css={{
          gridTemplateColumns: `1fr ${theme.spacing[22]}`,
        }}
        gap={2}
      >
        <PropertyLabel
          label={dict.stylePanel.outline.style}
          description={propertyDescriptions.outlineStyle}
          properties={["outline-style"]}
        />
        <ToggleGroupControl
          label={dict.stylePanel.outline.style}
          properties={["outline-style"]}
          items={[
            { child: <XSmallIcon />, value: "none" },
            { child: <MinusIcon />, value: "solid" },
            { child: <DashedBorderIcon />, value: "dashed" },
            { child: <DottedBorderIcon />, value: "dotted" },
          ]}
        />

        {outlineStyleValue !== "none" && (
          <>
            <PropertyLabel
              label={dict.stylePanel.outline.color}
              description={propertyDescriptions.outlineColor}
              properties={["outline-color"]}
            />
            <ColorControl property="outline-color" />
            <PropertyLabel
              label={dict.stylePanel.outline.width}
              description={propertyDescriptions.outlineWidth}
              properties={["outline-width"]}
            />
            <TextControl property="outline-width" />
            <PropertyLabel
              label={dict.stylePanel.outline.offset}
              description={propertyDescriptions.outlineOffset}
              properties={["outline-offset"]}
            />
            <TextControl property="outline-offset" />
          </>
        )}
      </Grid>
    </StyleSection>
  );
};

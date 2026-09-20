import { propertyDescriptions } from "@webstudio-is/css-data";
import type { CssProperty } from "@webstudio-is/css-engine";
import { Grid, theme } from "@webstudio-is/design-system";
import { SelectControl } from "../controls";
import { StyleSection } from "../shared/style-section";
import { PropertyLabel } from "../property-label";
import { useLocale } from "~/i18n/context";

export const properties = ["list-style-type"] satisfies CssProperty[];

export const Section = () => {
  const { dict } = useLocale();
  return (
    <StyleSection
      label={dict.stylePanel.listItem.label}
      properties={properties}
    >
      <Grid gap={2} css={{ gridTemplateColumns: `1fr ${theme.spacing[21]}` }}>
        <PropertyLabel
          label={dict.stylePanel.listItem.listStyleType}
          description={propertyDescriptions.listStyleType}
          properties={["list-style-type"]}
        />
        <SelectControl property="list-style-type" />
      </Grid>
    </StyleSection>
  );
};

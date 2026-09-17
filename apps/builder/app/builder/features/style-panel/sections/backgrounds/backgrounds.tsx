import { useStore } from "@nanostores/react";
import type { CssProperty } from "@webstudio-is/css-engine";
import { propertyDescriptions } from "@webstudio-is/css-data";
import { Flex, Grid, theme } from "@webstudio-is/design-system";
import { $assets } from "~/shared/sync/data-stores";
import { ColorControl } from "../../controls/color/color-control";
import { RepeatedStyleSection } from "../../shared/style-section";
import { PropertyLabel } from "../../property-label";
import {
  addRepeatedStyleItem,
  RepeatedStyle,
} from "../../shared/repeated-style";
import { useComputedStyles } from "../../shared/model";
import { parseCssFragment } from "../../shared/css-fragment";
import { BackgroundContent } from "./background-content";
import {
  getBackgroundLabel,
  BackgroundThumbnail,
  repeatedProperties,
} from "./background-thumbnail";

export const properties = [
  ...repeatedProperties,
  "background-color",
] satisfies [CssProperty, ...CssProperty[]];

export const Section = () => {
  const styles = useComputedStyles(repeatedProperties);
  const assets = useStore($assets);

  return (
    <RepeatedStyleSection
      label="الخلفيات"
      description="أضف خلفية واحدة أو أكثر إلى النسخة مثل لون أو صورة أو تدرج."
      properties={properties}
      onAdd={() => {
        addRepeatedStyleItem(
          styles,
          parseCssFragment("none", ["background-image"]).styles
        );
      }}
      collapsible
    >
      <Flex gap={1} direction="column">
        <RepeatedStyle
          label="طبقة الخلفية"
          styles={styles}
          floatingPanelOffset={{ alignmentAxis: -100 }}
          getItemProps={(_index, primaryValue) => ({
            label: getBackgroundLabel(primaryValue, assets),
          })}
          renderThumbnail={(index) => <BackgroundThumbnail index={index} />}
          renderItemContent={(index) => <BackgroundContent index={index} />}
        />
        <Grid
          css={{
            paddingInline: theme.panel.paddingInline,
            gridTemplateColumns: `1fr ${theme.spacing[23]}`,
          }}
        >
          <PropertyLabel
            label="اللون"
            description={propertyDescriptions.backgroundColor}
            properties={["background-color"]}
          />
          <ColorControl property="background-color" />
        </Grid>
      </Flex>
    </RepeatedStyleSection>
  );
};

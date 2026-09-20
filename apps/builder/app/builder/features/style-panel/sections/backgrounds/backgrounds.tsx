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
import { useLocale } from "~/i18n/context";

export const properties = [
  ...repeatedProperties,
  "background-color",
] satisfies [CssProperty, ...CssProperty[]];

export const Section = () => {
  const { dict } = useLocale();
  const styles = useComputedStyles(repeatedProperties);
  const assets = useStore($assets);

  return (
    <RepeatedStyleSection
      label={dict.stylePanel.backgrounds.sectionTitle}
      description={dict.stylePanel.backgrounds.sectionDescription}
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
          label={dict.stylePanel.backgrounds.layerLabel}
          styles={styles}
          floatingPanelOffset={{ alignmentAxis: -100 }}
          getItemProps={(_index, primaryValue) => ({
            label: getBackgroundLabel(dict, primaryValue, assets),
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
            label={dict.stylePanel.backgrounds.solidColorLabel}
            description={propertyDescriptions.backgroundColor}
            properties={["background-color"]}
          />
          <ColorControl property="background-color" />
        </Grid>
      </Flex>
    </RepeatedStyleSection>
  );
};

import { toValue, type CssProperty } from "@webstudio-is/css-engine";
import { Box, Grid } from "@webstudio-is/design-system";
import { rowCss } from "./utils";
import { PropertyLabel, PropertyValueTooltip } from "../../property-label";
import { ColorPickerControl } from "../../shared/color-picker";
import {
  $availableColorVariables,
  useComputedStyles,
} from "../../shared/model";
import { createBatchUpdate } from "../../shared/use-style-data";
import { useReadonly } from "../../shared/readonly";
import { keywordValues } from "@webstudio-is/css-data";
import { useLocale } from "~/i18n/context";

export const properties = [
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
] satisfies [CssProperty, ...CssProperty[]];

export const BorderColor = () => {
  const { dict } = useLocale();
  const readonly = useReadonly();
  const styles = useComputedStyles(properties);
  const serialized = styles.map((styleDecl) =>
    toValue(styleDecl.cascadedValue)
  );
  const isAdvanced = new Set(serialized).size > 1;
  // display first set value and reference it in tooltip
  const local =
    styles.find(
      (styleDecl) =>
        styleDecl.source.name === "local" ||
        styleDecl.source.name === "overwritten"
    ) ?? styles[0];

  const value = local.cascadedValue;
  const currentColor = local.usedValue;

  return (
    <Grid css={rowCss}>
      <PropertyLabel
        label={dict.stylePanel.borderColor.colorLabel}
        description={dict.stylePanel.borderColor.colorDescription}
        properties={properties}
      />
      <Box css={{ gridColumn: `span 2` }}>
        <PropertyValueTooltip
          label={dict.stylePanel.borderColor.colorLabel}
          description={dict.stylePanel.borderColor.colorDescription}
          properties={properties}
          isAdvanced={isAdvanced}
        >
          <div>
            <ColorPickerControl
              disabled={isAdvanced || readonly}
              currentColor={currentColor}
              property={local.property}
              value={value}
              getOptions={() => [
                ...keywordValues["border-top-color"].map((value) => ({
                  type: "keyword" as const,
                  value,
                })),
                ...$availableColorVariables.get(),
              ]}
              onChange={(styleValue) => {
                const batch = createBatchUpdate();
                for (const property of properties) {
                  batch.setProperty(property)(styleValue);
                }
                batch.publish({ isEphemeral: true });
              }}
              onChangeComplete={(styleValue) => {
                const batch = createBatchUpdate();
                for (const property of properties) {
                  batch.setProperty(property)(styleValue);
                }
                batch.publish();
              }}
              onAbort={() => {
                const batch = createBatchUpdate();
                for (const property of properties) {
                  batch.deleteProperty(property);
                }
                batch.publish({ isEphemeral: true });
              }}
              onReset={() => {
                const batch = createBatchUpdate();
                for (const property of properties) {
                  batch.deleteProperty(property);
                }
                batch.publish();
              }}
            />
          </div>
        </PropertyValueTooltip>
      </Box>
    </Grid>
  );
};

import { Grid } from "@webstudio-is/design-system";
import {
  XSmallIcon,
  AlignSelfStartIcon,
  AlignSelfEndIcon,
  AlignSelfCenterIcon,
  AlignSelfBaselineIcon,
  AlignSelfStretchIcon,
} from "@webstudio-is/icons";
import { PropertyLabel } from "../../property-label";
import { ToggleGroupControl } from "../../controls/toggle-group/toggle-group-control";
import { propertyDescriptions } from "@webstudio-is/css-data";
import { useLocale } from "~/i18n/context";
import { interpolate } from "~/i18n";

type AlignSelfControlProps = {
  /**
   * "flex" uses flex-start/flex-end values
   * "grid" uses start/end values
   */
  variant: "flex" | "grid";
};

export const AlignSelfControl = ({ variant }: AlignSelfControlProps) => {
  const { dict } = useLocale();
  const startValue = variant === "flex" ? "flex-start" : "start";
  const endValue = variant === "flex" ? "flex-end" : "end";
  const axisName =
    variant === "flex"
      ? dict.stylePanel.alignSelf.axisInline
      : dict.stylePanel.alignSelf.axisBlock;
  const parentProperty =
    variant === "flex" ? "align-items" : "align-items or align-content";

  return (
    <Grid css={{ gridTemplateColumns: "3fr 8fr" }}>
      <PropertyLabel
        label={dict.stylePanel.alignSelf.label}
        description={propertyDescriptions.alignSelf}
        properties={["align-self"]}
      />
      <ToggleGroupControl
        label={dict.stylePanel.alignSelf.label}
        properties={["align-self"]}
        items={[
          {
            child: <XSmallIcon />,
            description: interpolate(dict.stylePanel.alignSelf.values.auto, {
              parentProperty,
            }),
            value: "auto",
          },
          {
            child: <AlignSelfStartIcon />,
            description: interpolate(dict.stylePanel.alignSelf.values.start, {
              axis: axisName,
            }),
            value: startValue,
          },
          {
            child: <AlignSelfCenterIcon />,
            description: interpolate(dict.stylePanel.alignSelf.values.center, {
              axis: axisName,
            }),
            value: "center",
          },
          {
            child: <AlignSelfEndIcon />,
            description: interpolate(dict.stylePanel.alignSelf.values.end, {
              axis: axisName,
            }),
            value: endValue,
          },
          {
            child: <AlignSelfStretchIcon />,
            description: interpolate(dict.stylePanel.alignSelf.values.stretch, {
              axis: axisName,
            }),
            value: "stretch",
          },
          {
            child: <AlignSelfBaselineIcon />,
            description: interpolate(
              dict.stylePanel.alignSelf.values.baseline,
              {
                axis: axisName,
              }
            ),
            value: "baseline",
          },
        ]}
      />
    </Grid>
  );
};

export const JustifySelfControl = () => {
  const { dict } = useLocale();
  return (
    <Grid css={{ gridTemplateColumns: "3fr 8fr" }}>
      <PropertyLabel
        label={dict.stylePanel.alignSelf.justifyLabel}
        description={propertyDescriptions.justifySelf}
        properties={["justify-self"]}
      />
      <ToggleGroupControl
        label={dict.stylePanel.alignSelf.justifyLabel}
        properties={["justify-self"]}
        items={[
          {
            child: <XSmallIcon />,
            description: dict.stylePanel.alignSelf.justifyValues.auto,
            value: "auto",
          },
          {
            child: (
              <AlignSelfStartIcon style={{ transform: "rotate(-90deg)" }} />
            ),
            description: dict.stylePanel.alignSelf.justifyValues.start,
            value: "start",
          },
          {
            child: (
              <AlignSelfCenterIcon style={{ transform: "rotate(-90deg)" }} />
            ),
            description: dict.stylePanel.alignSelf.justifyValues.center,
            value: "center",
          },
          {
            child: <AlignSelfEndIcon style={{ transform: "rotate(-90deg)" }} />,
            description: dict.stylePanel.alignSelf.justifyValues.end,
            value: "end",
          },
          {
            child: (
              <AlignSelfStretchIcon style={{ transform: "rotate(-90deg)" }} />
            ),
            description: dict.stylePanel.alignSelf.justifyValues.stretch,
            value: "stretch",
          },
          {
            child: (
              <AlignSelfBaselineIcon style={{ transform: "rotate(-90deg)" }} />
            ),
            description: dict.stylePanel.alignSelf.justifyValues.baseline,
            value: "baseline",
          },
        ]}
      />
    </Grid>
  );
};

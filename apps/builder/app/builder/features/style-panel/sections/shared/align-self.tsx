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

type AlignSelfControlProps = {
  /**
   * "flex" uses flex-start/flex-end values
   * "grid" uses start/end values
   */
  variant: "flex" | "grid";
};

export const AlignSelfControl = ({ variant }: AlignSelfControlProps) => {
  const startValue = variant === "flex" ? "flex-start" : "start";
  const endValue = variant === "flex" ? "flex-end" : "end";
  const axisName = variant === "flex" ? "المحور المستعرض" : "المحور الكتلي";
  const parentProperty =
    variant === "flex" ? "align-items" : "align-items or align-content";

  return (
    <Grid css={{ gridTemplateColumns: "3fr 8fr" }}>
      <PropertyLabel
        label="محاذاة"
        description={propertyDescriptions.alignSelf}
        properties={["align-self"]}
      />
      <ToggleGroupControl
        label="محاذاة"
        properties={["align-self"]}
        items={[
          {
            child: <XSmallIcon />,
            description: `تُحدَّد محاذاة العنصر بواسطة خاصية ${parentProperty} في العنصر الأب.`,
            value: "auto",
          },
          {
            child: <AlignSelfStartIcon />,
            description: `تتم محاذأة العنصر عند بداية ${axisName}.`,
            value: startValue,
          },
          {
            child: <AlignSelfCenterIcon />,
            description: `يتم توسيط العنصر على طول ${axisName}.`,
            value: "center",
          },
          {
            child: <AlignSelfEndIcon />,
            description: `تتم محاذأة العنصر عند نهاية ${axisName}.`,
            value: endValue,
          },
          {
            child: <AlignSelfStretchIcon />,
            description: `يتمدد العنصر ليملأ ${axisName} بالكامل.`,
            value: "stretch",
          },
          {
            child: <AlignSelfBaselineIcon />,
            description: `تتم محاذأة العنصر إلى خط الأساس على طول ${axisName}.`,
            value: "baseline",
          },
        ]}
      />
    </Grid>
  );
};

export const JustifySelfControl = () => {
  return (
    <Grid css={{ gridTemplateColumns: "3fr 8fr" }}>
      <PropertyLabel
        label="ضبط"
        description={propertyDescriptions.justifySelf}
        properties={["justify-self"]}
      />
      <ToggleGroupControl
        label="ضبط"
        properties={["justify-self"]}
        items={[
          {
            child: <XSmallIcon />,
            description:
              "يُحدَّد ضبط العنصر بواسطة خاصية justify-items في العنصر الأب.",
            value: "auto",
          },
          {
            child: (
              <AlignSelfStartIcon style={{ transform: "rotate(-90deg)" }} />
            ),
            description:
              "تتم محاذأة العنصر عند بداية المحور السطري.",
            value: "start",
          },
          {
            child: (
              <AlignSelfCenterIcon style={{ transform: "rotate(-90deg)" }} />
            ),
            description: "يتم توسيط العنصر على طول المحور السطري.",
            value: "center",
          },
          {
            child: <AlignSelfEndIcon style={{ transform: "rotate(-90deg)" }} />,
            description:
              "تتم محاذأة العنصر عند نهاية المحور السطري.",
            value: "end",
          },
          {
            child: (
              <AlignSelfStretchIcon style={{ transform: "rotate(-90deg)" }} />
            ),
            description:
              "يتمدد العنصر ليملأ المحور السطري بالكامل.",
            value: "stretch",
          },
          {
            child: (
              <AlignSelfBaselineIcon style={{ transform: "rotate(-90deg)" }} />
            ),
            description:
              "تتم محاذأة العنصر إلى خط الأساس في العنصر الأب.",
            value: "baseline",
          },
        ]}
      />
    </Grid>
  );
};

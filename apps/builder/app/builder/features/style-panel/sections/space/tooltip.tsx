import { useState, type ReactElement } from "react";
import { deleteProperty } from "../../shared/use-style-data";
import { Tooltip } from "@webstudio-is/design-system";
import { PropertyInfo } from "../../property-label";
import { useComputedStyles } from "../../shared/model";
import type { SpaceStyleProperty } from "./properties";
import { useLocale } from "~/i18n/context";

const sides = {
  "padding-top": "top",
  "padding-right": "top",
  "padding-bottom": "bottom",
  "padding-left": "left",
  "margin-top": "top",
  "margin-right": "left",
  "margin-bottom": "bottom",
  "margin-left": "right",
} as const;

type SpaceContentId =
  | "paddingVertical"
  | "paddingHorizontal"
  | "paddingAll"
  | "marginVertical"
  | "marginHorizontal"
  | "marginAll";

const propertyContents: {
  properties: SpaceStyleProperty[];
  id: SpaceContentId;
}[] = [
  { properties: ["padding-top", "padding-bottom"], id: "paddingVertical" },
  { properties: ["padding-left", "padding-right"], id: "paddingHorizontal" },
  {
    properties: [
      "padding-top",
      "padding-bottom",
      "padding-left",
      "padding-right",
    ],
    id: "paddingAll",
  },
  { properties: ["margin-top", "margin-bottom"], id: "marginVertical" },
  { properties: ["margin-left", "margin-right"], id: "marginHorizontal" },
  {
    properties: ["margin-top", "margin-bottom", "margin-left", "margin-right"],
    id: "marginAll",
  },
];

const isSameUnorderedArrays = (
  arrA: readonly string[],
  arrB: readonly string[]
) => {
  if (arrA.length !== arrB.length) {
    return false;
  }

  const union = new Set([...arrA, ...arrB]);
  return union.size === arrA.length;
};

export const SpaceTooltip = ({
  property,
  children,
  preventOpen,
}: {
  property: SpaceStyleProperty;
  children: ReactElement;
  preventOpen: boolean;
}) => {
  const { dict } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const properties = [property];
  const styles = useComputedStyles(properties);

  const propertyContent = propertyContents.find((propertyContent) =>
    isSameUnorderedArrays(propertyContent.properties, properties)
  );

  const handleOpenChange = (value: boolean) => {
    if (preventOpen && value === true) {
      return;
    }
    setIsOpen(value);
  };

  return (
    <Tooltip
      open={isOpen}
      onOpenChange={handleOpenChange}
      side={sides[property]}
      // prevent closing tooltip on content click
      onPointerDown={(event) => event.preventDefault()}
      triggerProps={{
        onClick: (event) => {
          if (event.altKey) {
            event.preventDefault();
            deleteProperty(property);
            return;
          }
        },
      }}
      content={
        <PropertyInfo
          title={
            propertyContent === undefined
              ? ""
              : dict.stylePanel.space.labels[propertyContent.id]
          }
          description={
            propertyContent === undefined
              ? undefined
              : dict.stylePanel.space.descriptions[propertyContent.id]
          }
          styles={styles}
          onReset={() => {
            deleteProperty(property);
            handleOpenChange(false);
          }}
        />
      }
    >
      {/* @todo show tooltip on focus */}
      <div>{children}</div>
    </Tooltip>
  );
};

import { useState, type ReactElement } from "react";
import { Tooltip } from "@webstudio-is/design-system";
import type { CssProperty } from "@webstudio-is/css-engine";
import { useModifierKeys } from "../../shared/modifier-keys";
import { createBatchUpdate } from "../../shared/use-style-data";
import type { InsetProperty } from "./inset-layout";
import { PropertyInfo } from "../../property-label";
import { useComputedStyles } from "../../shared/model";
import { useLocale } from "~/i18n/context";

const opposingInsetGroups = [
  ["top", "bottom"],
  ["left", "right"],
] satisfies CssProperty[][];

const circleInsetGroups = [
  ["top", "right", "bottom", "left"],
] satisfies CssProperty[][];

export const getInsetModifiersGroup = (
  property: CssProperty,
  modifiers: { shiftKey: boolean; altKey: boolean }
) => {
  let groups: CssProperty[][] = [];

  if (modifiers.shiftKey) {
    groups = circleInsetGroups;
  } else if (modifiers.altKey) {
    groups = opposingInsetGroups;
  }

  return groups.find((group) => group.includes(property)) ?? [property];
};

const sides = {
  top: "top",
  right: "left",
  bottom: "bottom",
  left: "left",
} as const;

type InsetContentId = "vertical" | "horizontal" | "all";

const propertyContents: {
  properties: CssProperty[];
  id: InsetContentId;
}[] = [
  { properties: ["top", "bottom"], id: "vertical" },
  { properties: ["left", "right"], id: "horizontal" },
  { properties: ["top", "right", "bottom", "left"], id: "all" },
];

const isSameUnorderedArrays = <Item,>(
  arrA: readonly Item[],
  arrB: readonly Item[]
) => {
  if (arrA.length !== arrB.length) {
    return false;
  }

  const union = new Set([...arrA, ...arrB]);
  return union.size === arrA.length;
};

export const InsetTooltip = ({
  property,
  children,
  preventOpen,
}: {
  property: InsetProperty;
  children: ReactElement;
  preventOpen: boolean;
}) => {
  const { dict } = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const modifiers = useModifierKeys();

  const properties = [...getInsetModifiersGroup(property, modifiers)];
  const styles = useComputedStyles(properties);

  const resetProperties = () => {
    const batch = createBatchUpdate();
    for (const property of properties) {
      batch.deleteProperty(property);
    }
    batch.publish();
  };

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
            resetProperties();
            return;
          }
        },
      }}
      content={
        <PropertyInfo
          title={
            propertyContent === undefined
              ? ""
              : dict.stylePanel.inset.labels[propertyContent.id]
          }
          description={
            propertyContent === undefined
              ? undefined
              : dict.stylePanel.inset.descriptions[propertyContent.id]
          }
          styles={styles}
          onReset={() => {
            resetProperties();
            handleOpenChange(false);
          }}
        />
      }
    >
      {/* @todo show tooltip on focus */}
      <div style={{ maxWidth: "100%" }}>{children}</div>
    </Tooltip>
  );
};

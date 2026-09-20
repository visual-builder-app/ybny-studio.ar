import { AlertIcon } from "@webstudio-is/icons";
import { propertiesData, propertyStatuses } from "@webstudio-is/css-data";
import { cssVar, Flex, Link, Text, Tooltip } from "@webstudio-is/design-system";
import { useLocale } from "~/i18n/context";
import { interpolate } from "~/i18n";

export const getPropertyStatusDetails = (property: string) => {
  const status = propertyStatuses[property as keyof typeof propertyStatuses];
  if (status === undefined || status === "standard") {
    return;
  }

  return {
    status,
    mdnUrl:
      propertiesData[property as keyof typeof propertiesData]?.mdnUrl ??
      `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(property)}`,
  };
};

export const PropertyStatusDescription = ({
  property,
}: {
  property: string;
}) => {
  const { dict } = useLocale();
  const details = getPropertyStatusDetails(property);
  if (details === undefined) {
    return;
  }

  return (
    <Flex direction="column" gap="1">
      <Text>{dict.stylePanel.propertyStatus[details.status]}</Text>
      <Link
        href={details.mdnUrl}
        target="_blank"
        rel="noreferrer"
        color="inherit"
      >
        {dict.stylePanel.propertyStatus.learnMore}
      </Link>
    </Flex>
  );
};

export const PropertyStatusIcon = ({ property }: { property: string }) => {
  const { dict } = useLocale();
  const details = getPropertyStatusDetails(property);
  if (details === undefined) {
    return;
  }

  return (
    <Flex
      as="span"
      align="center"
      aria-label={interpolate(dict.stylePanel.propertyStatus.statusAria, {
        property,
        status: dict.stylePanel.propertyStatus.statusLabels[details.status],
      })}
      css={{ color: cssVar("--foreground-warning") }}
    >
      <AlertIcon size={12} />
    </Flex>
  );
};

export const PropertyStatusIndicator = ({ property }: { property: string }) => {
  if (getPropertyStatusDetails(property) === undefined) {
    return;
  }

  return (
    <Tooltip
      variant="wrapped"
      content={<PropertyStatusDescription property={property} />}
    >
      <Flex as="span" css={{ marginLeft: "3px" }}>
        <PropertyStatusIcon property={property} />
      </Flex>
    </Tooltip>
  );
};

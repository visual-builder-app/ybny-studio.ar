import { AlertIcon } from "@webstudio-is/icons";
import { propertiesData, propertyStatuses } from "@webstudio-is/css-data";
import { cssVar, Flex, Link, Text, Tooltip } from "@webstudio-is/design-system";

type PropertyStatus = (typeof propertyStatuses)[keyof typeof propertyStatuses];

const statusDescriptions = {
  experimental:
    "خاصية CSS هذه تجريبية. قد يكون دعم المتصفحات محدودًا، وقد يتغير سلوكها.",
  nonstandard:
    "خاصية CSS هذه غير قياسية. قد تعمل فقط في متصفحات محددة، ويمكن أن تتغير أو تُزال دون إشعار.",
  obsolete:
    "خاصية CSS هذه قديمة. قد لا تدعمها المتصفحات بعد الآن، ولا ينبغي استخدامها في المشاريع الجديدة.",
} satisfies Record<Exclude<PropertyStatus, "standard">, string>;

export const getPropertyStatusDetails = (property: string) => {
  const status = propertyStatuses[property as keyof typeof propertyStatuses];
  if (status === undefined || status === "standard") {
    return;
  }

  return {
    status,
    description: statusDescriptions[status],
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
  const details = getPropertyStatusDetails(property);
  if (details === undefined) {
    return;
  }

  return (
    <Flex direction="column" gap="1">
      <Text>{details.description}</Text>
      <Link
        href={details.mdnUrl}
        target="_blank"
        rel="noreferrer"
        color="inherit"
      >
        اعرف المزيد على MDN
      </Link>
    </Flex>
  );
};

export const PropertyStatusIcon = ({ property }: { property: string }) => {
  const details = getPropertyStatusDetails(property);
  if (details === undefined) {
    return;
  }

  return (
    <Flex
      as="span"
      align="center"
      aria-label={`${property} حالته ${details.status}`}
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

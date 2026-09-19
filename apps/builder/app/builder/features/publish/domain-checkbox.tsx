import { useStore } from "@nanostores/react";
import {
  Flex,
  Tooltip,
  Text,
  theme,
  Checkbox,
} from "@webstudio-is/design-system";

import { $project } from "~/shared/sync/data-stores";
import { $permissions } from "~/shared/nano-states";

export const domainToPublishName = "domainToPublish[]";

/**
 * Pure function: returns true when a custom domain checkbox should be disabled
 * because the user's permissions restrict them to staging-only publishing.
 *
 * Two cases disable custom domains:
 *  - Free plan users (`!allowStagingPublish`): publishing is staging-only by plan.
 *  - Builder role (`canPublishToStagingOnly`): role-based staging restriction.
 *
 * Staging domains are always unrestricted — this function returns false for them.
 */
const isCustomDomainPublishRestricted = ({
  allowStagingPublish,
  canPublishToStagingOnly,
  isCustomDomain,
}: {
  allowStagingPublish: boolean;
  canPublishToStagingOnly: boolean;
  isCustomDomain: boolean | undefined;
}) =>
  (!allowStagingPublish || canPublishToStagingOnly) && isCustomDomain === true;

export const __testing__ = { isCustomDomainPublishRestricted };

interface DomainCheckboxProps {
  defaultChecked?: boolean;
  domain: string;
  buildId: string | undefined;
  disabled?: boolean;
  isCustomDomain?: boolean;
}

export const DomainCheckbox = (props: DomainCheckboxProps) => {
  const { allowStagingPublish, canPublishToStagingOnly } =
    useStore($permissions);
  const project = useStore($project);

  if (project === undefined) {
    return;
  }

  const tooltipContentForFreeUsers = allowStagingPublish ? undefined : (
    <Flex direction="column" gap="2" css={{ maxWidth: theme.spacing[28] }}>
      <Text variant="titles">النشر على بيئة التجربة</Text>
      <Text>
        <Flex direction="column">
          تتيح لك بيئة التجربة معاينة النسخة الإنتاجية من موقعك دون تعريض ما يراه
          زوار الموقع الإنتاجي للخطر.
          <>
            <br />
            <br />
            قم بالترقية إلى حساب Pro للنشر على كل نطاق بشكل منفصل.
          </>
        </Flex>
      </Text>
    </Flex>
  );

  const tooltipContentForBuilders =
    canPublishToStagingOnly && props.isCustomDomain ? (
      <Text>
        يمكن للمحررين النشر على بيئة التجربة فقط. تواصل مع مالك المشروع أو أحد
        المديرين للنشر على نطاقات مخصصة.
      </Text>
    ) : undefined;

  const tooltipContent =
    tooltipContentForBuilders ?? tooltipContentForFreeUsers;

  // On free plan: custom domains are disabled+unchecked (can't publish to them).
  // For builders: custom domains are disabled (staging-only permission).
  // Staging domain behaves normally — user can still check/uncheck it.
  const isRestricted = isCustomDomainPublishRestricted({
    allowStagingPublish,
    canPublishToStagingOnly,
    isCustomDomain: props.isCustomDomain,
  });
  const defaultChecked = isRestricted ? false : props.defaultChecked;
  const disabled = isRestricted ? true : props.disabled;

  const hideDomainCheckbox =
    project.domainsVirtual.filter(
      (domain) => domain.status === "ACTIVE" && domain.verified
    ).length === 0 && allowStagingPublish;

  return (
    <div style={{ display: hideDomainCheckbox ? "none" : "contents" }}>
      <Tooltip content={tooltipContent} variant="wrapped">
        <Checkbox
          disabled={disabled}
          key={props.buildId ?? "-"}
          defaultChecked={hideDomainCheckbox || defaultChecked}
          css={{ pointerEvents: "all" }}
          name={domainToPublishName}
          value={props.domain}
        />
      </Tooltip>
    </div>
  );
};

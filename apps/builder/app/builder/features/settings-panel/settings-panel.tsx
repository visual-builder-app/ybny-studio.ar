import type { Instance } from "@webstudio-is/sdk";
import { SettingsSection } from "./settings-section";
import { PropsSectionContainer } from "./props-section/props-section";
import { VariablesSection } from "./variables-section";
import {
  Box,
  Flex,
  Link,
  PanelBanner,
  Text,
  rawTheme,
  theme,
} from "@webstudio-is/design-system";
import { UpgradeIcon } from "@webstudio-is/icons";
import { useStore } from "@nanostores/react";
import cmsUpgradeBanner from "~/shared/cms-upgrade-banner.svg?url";
import { $isDesignMode, $permissions } from "~/shared/nano-states";

export const SettingsPanel = ({
  selectedInstance,
  selectedInstanceKey,
}: {
  selectedInstance: Instance;
  selectedInstanceKey: string;
}) => {
  const { allowDynamicData } = useStore($permissions);
  const isDesignMode = useStore($isDesignMode);

  return (
    <Box css={{ pt: theme.spacing[5] }}>
      <SettingsSection />

      <PropsSectionContainer
        selectedInstance={selectedInstance}
        selectedInstanceKey={selectedInstanceKey}
      />

      {isDesignMode && <VariablesSection />}

      {allowDynamicData === false && (
        <PanelBanner>
          <img
            src={cmsUpgradeBanner}
            alt="الترقية لأجل CMS"
            width={rawTheme.spacing[28]}
            style={{ aspectRatio: "4.1" }}
          />
          <Text variant="regularBold">قم بالترقية لأجل CMS على النطاقات المخصصة</Text>
          <Text>
            ادمج المحتوى من أدوات أخرى لإنشاء المدونات والأدلة وأي
            محتوى منظم آخر. يمكنك معاينة CMS على بيئة التجربة دون
            ترقية.
          </Text>
          <Flex align="center" gap={1}>
            <UpgradeIcon />
            <Link
              color="inherit"
              target="_blank"
              href="https://webstudio.is/pricing"
            >
              الترقية إلى Pro
            </Link>
          </Flex>
        </PanelBanner>
      )}
    </Box>
  );
};

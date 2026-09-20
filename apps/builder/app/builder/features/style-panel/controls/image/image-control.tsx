import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import {
  Button,
  InputField,
  Flex,
  FloatingPanel,
} from "@webstudio-is/design-system";
import type { CssProperty, InvalidValue } from "@webstudio-is/css-engine";
import { $assets } from "~/shared/sync/data-stores";
import { AssetManager } from "~/builder/shared/asset-manager";
import { useComputedStyleDecl } from "../../shared/model";
import {
  getRepeatedStyleItem,
  setRepeatedStyleItem,
} from "../../shared/repeated-style";
import { formatAssetName } from "@webstudio-is/project-build/runtime";
import { AssetUpload } from "~/builder/shared/assets";
import { useLocale } from "~/i18n/context";

const isValidURL = (value: string) => {
  try {
    return Boolean(new URL(value));
  } catch {
    return false;
  }
};

type IntermediateValue = {
  type: "intermediate";
  value: string;
};

export const ImageControl = ({
  property,
  index,
  disabled = false,
}: {
  property: CssProperty;
  index: number;
  disabled?: boolean;
}) => {
  const { dict } = useLocale();
  const assets = useStore($assets);
  const styleDecl = useComputedStyleDecl(property);
  const styleValue = getRepeatedStyleItem(styleDecl, index);
  const [remoteImageURL, setRemoteImageURL] = useState<
    IntermediateValue | InvalidValue | undefined
  >(undefined);

  useEffect(() => {
    if (styleValue?.type === "image" && styleValue.value.type === "url") {
      setRemoteImageURL({ type: "intermediate", value: styleValue.value.url });
    }

    if (styleValue?.type === "image" && styleValue.value.type === "asset") {
      setRemoteImageURL(undefined);
    }
  }, [styleValue]);

  if (styleValue === undefined) {
    return;
  }

  const asset =
    styleValue.type === "image" && styleValue.value.type === "asset"
      ? assets.get(styleValue.value.value)
      : undefined;

  const handleImageURLInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }
    const value = event.target.value;
    if (isValidURL(value) === true) {
      setRemoteImageURL({ type: "intermediate", value });
    } else {
      setRemoteImageURL({ type: "invalid", value });
    }
  };

  const handleImageURLComplete = () => {
    if (disabled) {
      return;
    }
    if (
      remoteImageURL?.type === "intermediate" &&
      isValidURL(remoteImageURL.value) === true
    ) {
      setRepeatedStyleItem(styleDecl, index, {
        type: "image",
        value: { type: "url", url: remoteImageURL.value },
      });
      setRemoteImageURL(undefined);
    }
  };

  return (
    <Flex direction="column" gap="2">
      <InputField
        type="text"
        disabled={disabled}
        color={remoteImageURL?.type === "invalid" ? "error" : undefined}
        placeholder={dict.stylePanel.imageControl.placeholder}
        value={remoteImageURL?.value ?? ""}
        onChange={handleImageURLInput}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            handleImageURLComplete();
          }
        }}
        onBlur={handleImageURLComplete}
      />
      <FloatingPanel
        title={dict.stylePanel.imageControl.title}
        titleSuffix={disabled ? undefined : <AssetUpload type="image" />}
        content={
          <AssetManager
            accept="image/*"
            onChange={(assetId) => {
              setRepeatedStyleItem(styleDecl, index, {
                type: "image",
                value: { type: "asset", value: assetId },
              });
            }}
          />
        }
      >
        <Button
          disabled={disabled}
          css={{ maxWidth: "100%", justifySelf: "right" }}
        >
          {asset
            ? formatAssetName(asset)
            : dict.stylePanel.imageControl.chooseImage}
        </Button>
      </FloatingPanel>
    </Flex>
  );
};

undefined;

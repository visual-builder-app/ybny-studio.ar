import { useId } from "react";
import { useStore } from "@nanostores/react";
import {
  Button,
  Grid,
  InputErrorsTooltip,
  InputField,
  Text,
} from "@webstudio-is/design-system";
import { BindableExpressionControl } from "~/builder/shared/bindable-expression";
import type {
  PageSettingsErrors,
  PageSettingsValues,
} from "@webstudio-is/project-build/runtime";
import { ImageControl } from "~/shared/project-settings";
import { $assets } from "~/shared/sync/data-stores";
import { isLiteralExpression } from "@webstudio-is/expression";
import { $pageRootScope } from "../page-utils";
import { ImageInfo } from "../image-info";
import { SocialPreview } from "../social-preview";
import { computePageSettingsText, usePageUrl, type OnChange } from "./shared";

export const SocialImageSection = ({
  values,
  errors,
  disabled = false,
  showBindingControls = true,
  onChange,
}: {
  values: PageSettingsValues;
  errors: PageSettingsErrors;
  disabled?: boolean;
  showBindingControls?: boolean;
  onChange: OnChange;
}) => {
  const socialImageAssetButtonId = useId();
  const assets = useStore($assets);
  const socialImageAsset = assets.get(values.socialImageAssetId);
  const { variableValues, scope, aliases } = useStore($pageRootScope);
  const socialImageUrl = computePageSettingsText(
    values.socialImageUrl,
    variableValues
  );
  const pageUrl = usePageUrl(values);
  const title = computePageSettingsText(values.title, variableValues);
  const description = computePageSettingsText(
    values.description,
    variableValues
  );
  return (
    <Grid gap={2}>
      <Text color="subtle">
        تظهر هذه الصورة عند مشاركة رابط هذه الصفحة على مواقع التواصل
        الاجتماعي. إذا لم تُحدد صورة هنا، فستُستخدم صورة التواصل المحددة في إعدادات
        المشروع. الأبعاد المثالية للصورة هي 1200x630
        بكسل أو أكبر بنسبة أبعاد 1.91:1.
      </Text>
      <BindableExpressionControl
        expression={values.socialImageUrl}
        value={socialImageUrl}
        bound={isLiteralExpression(values.socialImageUrl) === false}
        showBinding={showBindingControls}
        scope={scope}
        aliases={aliases}
        onChangeValue={(value) => {
          onChange({ field: "socialImageUrl", value: JSON.stringify(value) });
          onChange({ field: "socialImageAssetId", value: "" });
        }}
        onChangeExpression={(value) =>
          onChange({ field: "socialImageUrl", value })
        }
        onRemove={(value) =>
          onChange({
            field: "socialImageUrl",
            value: JSON.stringify(value ?? ""),
          })
        }
        renderControl={({ value, readOnly, onChangeValue }) => (
          <InputErrorsTooltip errors={errors.socialImageUrl}>
            <InputField
              placeholder="https://www.url.com"
              disabled={disabled || readOnly}
              color={errors.socialImageUrl && "error"}
              value={value}
              onChange={(event) => onChangeValue(event.target.value)}
            />
          </InputErrorsTooltip>
        )}
      />
      <Grid gap={1} flow={"column"}>
        <ImageControl
          onAssetIdChange={(socialImageAssetId) => {
            onChange({
              field: "socialImageAssetId",
              value: socialImageAssetId,
            });
            onChange({ field: "socialImageUrl", value: "" });
          }}
        >
          <Button
            id={socialImageAssetButtonId}
            css={{ justifySelf: "start" }}
            disabled={disabled}
          >
            اختيار صورة من الوسائط
          </Button>
        </ImageControl>
      </Grid>

      {socialImageAsset?.type === "image" && (
        <ImageInfo
          asset={socialImageAsset}
          disabled={disabled}
          onDelete={() => {
            onChange({
              field: "socialImageAssetId",
              value: "",
            });
          }}
        />
      )}
      <div />
      <SocialPreview
        ogImageUrl={
          socialImageAsset?.type === "image"
            ? socialImageAsset.name
            : socialImageUrl
        }
        ogUrl={pageUrl}
        ogTitle={title}
        ogDescription={description}
      />
    </Grid>
  );
};

undefined;

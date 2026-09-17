import { useStore } from "@nanostores/react";
import {
  Grid,
  InputField,
  Label,
  theme,
  Text,
  TextArea,
  Button,
  css,
  Flex,
  CheckboxAndLabel,
  Checkbox,
  InputErrorsTooltip,
  PanelBanner,
  Select,
  Box,
  cssVar,
} from "@webstudio-is/design-system";
import { getImageAttributes, wsImageLoader } from "@webstudio-is/image";
import { useState } from "react";
import {
  type MarketplaceProduct,
  marketplaceCategories,
} from "@webstudio-is/project-build";
import { marketplaceProductUpdateInput } from "@webstudio-is/project-build/runtime";
import { ImageControl } from "./image-control";
import {
  $assets,
  $marketplaceProduct,
  $project,
} from "~/shared/sync/data-stores";
import { useIds } from "~/shared/form-utils";
import type { MarketplaceApprovalStatus } from "@webstudio-is/project";
import { trpcClient } from "~/shared/trpc/trpc-client";
import { rightPanelWidth, sectionSpacing } from "./utils";
import { executeRuntimeMutation } from "../instance-utils/data";

const thumbnailStyle = css({
  borderRadius: theme.borderRadius[4],
  outlineWidth: 1,
  outlineStyle: "solid",
  outlineColor: cssVar("--border-default"),
  width: theme.spacing[28],
  aspectRatio: "1.91",
  background: cssVar("--background-secondary"),
});

const thumbnailImageStyle = css({
  display: "block",
  width: "100%",
  height: "100%",
  variants: {
    hasAsset: {
      true: {
        objectFit: "cover",
      },
    },
  },
});

const defaultMarketplaceProduct: Partial<MarketplaceProduct> = {
  category: "sectionTemplates",
};

const validate = (data: Partial<MarketplaceProduct>) => {
  const parsedResult = marketplaceProductUpdateInput.safeParse(data);
  if (parsedResult.success === false) {
    return parsedResult.error.flatten().fieldErrors;
  }
};

const useMarketplaceApprovalStatus = () => {
  const { send, data, state } =
    trpcClient.project.setMarketplaceApprovalStatus.useMutation();
  const project = useStore($project);

  const status =
    data?.marketplaceApprovalStatus ??
    project?.marketplaceApprovalStatus ??
    "UNLISTED";

  const handleSuccess = ({
    marketplaceApprovalStatus,
  }: {
    marketplaceApprovalStatus: MarketplaceApprovalStatus;
  }) => {
    const project = $project.get();
    if (project) {
      $project.set({
        ...project,
        marketplaceApprovalStatus,
      });
    }
  };

  return {
    status,
    state,
    submit() {
      if (project) {
        send(
          {
            projectId: project.id,
            marketplaceApprovalStatus: "PENDING",
          },
          handleSuccess
        );
      }
    },
    unlist() {
      if (project) {
        send(
          {
            projectId: project.id,
            marketplaceApprovalStatus: "UNLISTED",
          },
          handleSuccess
        );
      }
    },
  };
};

export const SectionMarketplace = () => {
  const project = useStore($project);
  const approval = useMarketplaceApprovalStatus();
  const [data, setData] = useState<Partial<MarketplaceProduct>>(() => ({
    ...defaultMarketplaceProduct,
    ...$marketplaceProduct.get(),
  }));
  const ids = useIds([
    "name",
    "category",
    "author",
    "email",
    "website",
    "issues",
    "description",
    "isConfirmed",
  ]);
  const assets = useStore($assets);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [errors, setErrors] = useState<ReturnType<typeof validate>>();

  if (project === undefined) {
    return;
  }
  const asset = assets.get(data.thumbnailAssetId ?? "");
  const isValid = marketplaceProductUpdateInput.safeParse(data).success;

  const handleSave = <Setting extends keyof MarketplaceProduct>(
    setting: Setting
  ) => {
    return (value: MarketplaceProduct[Setting]) => {
      const nextData = {
        ...defaultMarketplaceProduct,
        ...data,
        [setting]: value,
      };
      const errors = validate(nextData);
      setErrors(errors);
      setData(nextData);

      if (errors) {
        return;
      }
      const result = marketplaceProductUpdateInput.safeParse(nextData);
      if (result.success === false) {
        return;
      }
      executeRuntimeMutation({
        id: "projectSettings.updateMarketplaceProduct",
        input: result.data,
      });
    };
  };

  return (
    <Grid gap={2}>
      <Text variant="titles" css={sectionSpacing}>
        السوق
      </Text>
      <Grid gap={1} css={sectionSpacing}>
        <Label htmlFor={ids.name}>اسم المنتج</Label>
        <InputErrorsTooltip errors={errors?.name}>
          <InputField
            id={ids.name}
            value={data.name ?? ""}
            autoFocus
            color={errors?.name && "error"}
            onChange={(event) => {
              handleSave("name")(event.target.value);
            }}
          />
        </InputErrorsTooltip>
      </Grid>

      <Grid gap={1} css={sectionSpacing}>
        <Label htmlFor={ids.category}>الفئة</Label>
        <Select
          options={Array.from(marketplaceCategories.keys())}
          getLabel={(category: MarketplaceProduct["category"]) =>
            marketplaceCategories.get(category)?.label
          }
          getDescription={(category: MarketplaceProduct["category"]) => (
            <Box css={{ width: rightPanelWidth }}>
              {marketplaceCategories.get(category)?.description}
            </Box>
          )}
          onChange={handleSave("category")}
          value={data.category}
          defaultValue={defaultMarketplaceProduct.category}
        />
      </Grid>

      <Grid gap={2} css={sectionSpacing}>
        <Label>الصورة المصغرة</Label>
        <InputErrorsTooltip errors={errors?.thumbnailAssetId}>
          <Grid flow="column" gap={3}>
            <Box className={thumbnailStyle()}>
              <img
                className={thumbnailImageStyle({
                  hasAsset: asset !== undefined,
                })}
                {...getImageAttributes({
                  src: asset ? `${asset.name}` : undefined,
                  loader: wsImageLoader,
                })}
              />
            </Box>

            <Grid gap={2}>
              <Text color="subtle">
                الأبعاد المثالية في السوق هي 600×315 بكسل أو أكبر
                بنسبة أبعاد 1.91:1.
              </Text>
              <ImageControl onAssetIdChange={handleSave("thumbnailAssetId")}>
                <Button color="primary" css={{ justifySelf: "start" }}>
                  رفع
                </Button>
              </ImageControl>
            </Grid>
          </Grid>
        </InputErrorsTooltip>
      </Grid>

      <Grid gap={1} css={sectionSpacing}>
        <Label htmlFor={ids.author}>المؤلف</Label>
        <InputErrorsTooltip errors={errors?.author}>
          <InputField
            id={ids.author}
            value={data.author ?? ""}
            color={errors?.author && "error"}
            onChange={(event) => {
              handleSave("author")(event.target.value);
            }}
          />
        </InputErrorsTooltip>
      </Grid>

      <Grid gap={1} css={sectionSpacing}>
        <Label htmlFor={ids.email}>البريد الإلكتروني</Label>
        <InputErrorsTooltip errors={errors?.email}>
          <InputField
            id={ids.email}
            value={data.email ?? ""}
            color={errors?.email && "error"}
            onChange={(event) => {
              handleSave("email")(event.target.value);
            }}
          />
        </InputErrorsTooltip>
      </Grid>

      <Grid gap={1} css={sectionSpacing}>
        <Label htmlFor={ids.website}>الموقع الإلكتروني</Label>
        <InputErrorsTooltip errors={errors?.website}>
          <InputField
            id={ids.website}
            value={data.website ?? ""}
            color={errors?.website && "error"}
            onChange={(event) => {
              handleSave("website")(event.target.value);
            }}
          />
        </InputErrorsTooltip>
      </Grid>

      <Grid gap={1} css={sectionSpacing}>
        <Label htmlFor={ids.issues}>متتبع المشكلات</Label>
        <InputErrorsTooltip errors={errors?.issues}>
          <InputField
            id={ids.issues}
            value={data.issues ?? ""}
            color={errors?.issues && "error"}
            onChange={(event) => {
              handleSave("issues")(event.target.value);
            }}
          />
        </InputErrorsTooltip>
      </Grid>

      <Grid gap={2} css={sectionSpacing}>
        <Label htmlFor={ids.description}>الوصف</Label>
        <InputErrorsTooltip errors={errors?.description}>
          <TextArea
            id={ids.description}
            rows={5}
            autoGrow
            maxRows={10}
            value={data.description ?? ""}
            color={errors?.description && "error"}
            onChange={handleSave("description")}
          />
        </InputErrorsTooltip>
      </Grid>

      <Grid gap={2} css={sectionSpacing}>
        <PanelBanner>
          <Text color="destructive">
            {`لا تنسَ نشر مشروعك بعد كل تغيير لكي تصبح تعديلاتك
            متاحة في السوق!`}
          </Text>
        </PanelBanner>
      </Grid>

      {approval.status === "UNLISTED" && (
        <Grid gap={2} css={sectionSpacing}>
          <CheckboxAndLabel>
            <Checkbox
              checked={isConfirmed}
              id={ids.isConfirmed}
              onCheckedChange={(value) => {
                if (typeof value === "boolean") {
                  setIsConfirmed(value);
                }
              }}
            />
            <Label htmlFor={ids.isConfirmed} css={{ flexShrink: 1 }}>
              أفهم أنه بمجرد الإرسال، سيصبح هذا المشروع متاحًا
              في سوق عام.
            </Label>
          </CheckboxAndLabel>
        </Grid>
      )}

      <Flex align="center" justify="between" gap={2} css={sectionSpacing}>
        <Text>الحالة: {approval.status.toLocaleLowerCase()}</Text>
        {approval.status === "UNLISTED" ? (
          <Button
            color="primary"
            disabled={isConfirmed === false || isValid === false}
            state={approval.state === "idle" ? undefined : "pending"}
            onClick={approval.submit}
          >
            بدء المراجعة
          </Button>
        ) : (
          <Button
            state={approval.state === "idle" ? undefined : "pending"}
            color="destructive"
            onClick={approval.unlist}
          >
            إزالة من السوق
          </Button>
        )}
      </Flex>
    </Grid>
  );
};

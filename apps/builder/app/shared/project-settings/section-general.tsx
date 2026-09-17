import { useId, useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import {
  Grid,
  InputField,
  Label,
  theme,
  Text,
  Separator,
  Button,
  css,
  Flex,
  Tooltip,
  InputErrorsTooltip,
  ProChip,
  TextArea,
  IconButton,
  cssVar,
} from "@webstudio-is/design-system";
import { CopyIcon, InfoCircleIcon } from "@webstudio-is/icons";
import { getImageAttributes, wsImageLoader } from "@webstudio-is/image";
import type { ProjectMeta } from "@webstudio-is/sdk";
import { validateContactEmail } from "@webstudio-is/project-build/contracts";
import { ImageControl } from "./image-control";
import { $assets, $project } from "~/shared/sync/data-stores";
import { $permissions } from "~/shared/nano-states";
import { $projectSettings } from "~/shared/sync/data-stores";
import { sectionSpacing } from "./utils";
import { CodeEditor } from "~/shared/code-editor";
import { CopyToClipboard } from "~/shared/copy-to-clipboard";
import { executeRuntimeMutation } from "~/shared/instance-utils/data";

const imgStyle = css({
  objectFit: "contain",
  width: 72,
  height: 72,
  borderRadius: theme.borderRadius[4],
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: cssVar("--border-default"),
});

const defaultMetaSettings: ProjectMeta = {
  siteName: "",
  contactEmail: "",
  faviconAssetId: "",
  code: "",
};

const saveSetting = <Name extends keyof ProjectMeta>(
  name: keyof ProjectMeta,
  value: ProjectMeta[Name]
) => {
  executeRuntimeMutation({
    id: "projectSettings.update",
    input: { meta: { [name]: value } },
  });
};

export const SectionGeneral = ({ projectId }: { projectId?: string }) => {
  const { maxContactEmailsPerProject } = useStore($permissions);
  const allowContactEmail = maxContactEmailsPerProject > 0;
  const projectSettings = useStore($projectSettings);
  const project = useStore($project);
  const assets = useStore($assets);
  const [meta, setMeta] = useState(
    () => projectSettings?.meta ?? defaultMetaSettings
  );
  const siteNameId = useId();
  const contactEmailId = useId();

  // Update meta when project settings load (important for dashboard mode)
  useEffect(() => {
    if (projectSettings?.meta) {
      setMeta(projectSettings.meta);
    }
  }, [projectSettings?.meta]);

  const contactEmailError = validateContactEmail(
    meta.contactEmail ?? "",
    maxContactEmailsPerProject
  );
  const asset = assets.get(meta.faviconAssetId ?? "");
  const favIconUrl = asset ? `${asset.name}` : undefined;

  // Use projectId prop if available (dashboard mode), otherwise use project from store (builder mode)
  const effectiveProjectId = projectId ?? project?.id ?? "";

  const handleSave = <Name extends keyof ProjectMeta>(
    name: keyof ProjectMeta
  ) => {
    return (value: ProjectMeta[Name]) => {
      setMeta({ ...meta, [name]: value });
      saveSetting(name, value);
    };
  };

  return (
    <Grid gap={2}>
      <Text variant="titles" css={sectionSpacing}>
        عام
      </Text>

      <Grid gap={1} css={sectionSpacing}>
        <Flex gap={1} align="center">
          <Text variant="labels">معرّف المشروع:</Text>
          <Text userSelect="text">{effectiveProjectId}</Text>
          <CopyToClipboard text={effectiveProjectId} copyText="نسخ المعرّف">
            <IconButton aria-label="نسخ المعرّف">
              <CopyIcon aria-hidden />
            </IconButton>
          </CopyToClipboard>
        </Flex>
      </Grid>

      <Grid gap={1} css={sectionSpacing}>
        <Flex gap={1} align="center">
          <Label htmlFor={siteNameId}>اسم الموقع</Label>
          <Tooltip
            variant="wrapped"
            content="يُستخدم في نتائج البحث ومعاينات وسائل التواصل."
          >
            <InfoCircleIcon
              color={cssVar("--foreground-secondary")}
              tabIndex={0}
            />
          </Tooltip>
        </Flex>
        <InputField
          id={siteNameId}
          placeholder="اسم الموقع الحالي"
          autoFocus={true}
          value={meta.siteName ?? ""}
          onChange={(event) => {
            handleSave("siteName")(event.target.value);
          }}
        />
      </Grid>

      <Grid gap={1} css={sectionSpacing}>
        <Flex gap={1} align="center">
          <Label htmlFor={contactEmailId}>البريد الإلكتروني للتواصل</Label>
          <Tooltip
            variant="wrapped"
            content="يُستخدم كجهة استلام البريد عند إرسال نموذج webhook بدون إجراء."
          >
            <InfoCircleIcon
              color={cssVar("--foreground-secondary")}
              tabIndex={0}
            />
          </Tooltip>
          {allowContactEmail === false && <ProChip>Pro</ProChip>}
        </Flex>
        <InputErrorsTooltip
          errors={contactEmailError ? [contactEmailError] : undefined}
        >
          <TextArea
            id={contactEmailId}
            color={contactEmailError ? "error" : undefined}
            placeholder="john@company.com, jane@company.com"
            autoGrow={true}
            rows={1}
            value={meta.contactEmail ?? ""}
            onChange={(value) => {
              setMeta({ ...meta, contactEmail: value });
              if (
                validateContactEmail(value, maxContactEmailsPerProject) ===
                undefined
              ) {
                saveSetting("contactEmail", value);
              }
            }}
          />
        </InputErrorsTooltip>
      </Grid>

      <Separator />

      <Grid gap={2} css={sectionSpacing} justify={"start"}>
        <Label>أيقونة الموقع</Label>
        <Grid flow="column" gap={3}>
          <img
            className={imgStyle()}
            {...getImageAttributes({
              width: 72,
              height: 72,
              src: favIconUrl,
              loader: wsImageLoader,
            })}
          />

          <Grid gap={2}>
            <Text color="subtle">
              ارفع صورة مربعة لعرضها في تبويبات المتصفح.
            </Text>
            <ImageControl onAssetIdChange={handleSave("faviconAssetId")}>
              <Button color="primary" css={{ justifySelf: "start" }}>
                رفع
              </Button>
            </ImageControl>
          </Grid>
        </Grid>
      </Grid>

      <Separator />

      <Grid gap={2} css={sectionSpacing}>
        <Label>كود مخصص</Label>
        <Text color="subtle">
          ستُضاف الأكواد والسكربتات المخصصة في نهاية وسم &lt;head&gt;
          في كل صفحة عبر المشروع المنشور وستعمل{" "}
          <strong>فقط</strong> على الموقع المنشور.
        </Text>
        <CodeEditor
          title="كود مخصص"
          lang="html"
          value={meta.code ?? ""}
          onChange={handleSave("code")}
          onChangeComplete={handleSave("code")}
        />
      </Grid>
    </Grid>
  );
};

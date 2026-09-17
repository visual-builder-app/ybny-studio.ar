import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import {
  PanelContent,
  Grid,
  Text,
  Button,
  Select,
  Dialog,
  DialogTitle,
  DialogTrigger,
  DialogContent,
  DialogClose,
  Flex,
  toast,
  PanelBanner,
  Link,
  rawTheme,
} from "@webstudio-is/design-system";
import { UpgradeIcon } from "@webstudio-is/icons";
import { nativeClient, trpcClient } from "~/shared/trpc/trpc-client";
import { $project } from "~/shared/sync/data-stores";
import { $permissions } from "~/shared/nano-states";
import { sectionSpacing } from "./utils";
import cmsUpgradeBanner from "../cms-upgrade-banner.svg?url";

const formatPublishDate = (date: string) => {
  try {
    const formatter = new Intl.DateTimeFormat("en", {
      dateStyle: "long",
      timeStyle: "short",
    });
    return formatter.format(new Date(date));
  } catch {
    return date;
  }
};

export const SectionBackups = ({
  projectId: projectIdProp,
}: {
  projectId?: string;
}) => {
  const { canRestoreBackups } = useStore($permissions);
  const { data, load } = trpcClient.project.publishedBuilds.useQuery();
  const project = useStore($project);
  const projectId = projectIdProp ?? project?.id ?? "";

  useEffect(() => {
    load({ projectId });
  }, [load, projectId]);
  const options = data?.success ? data.data : [];
  const [backupBuild = options.at(0), setBackupBuild] = useState<
    undefined | (typeof options)[number]
  >();
  const restore = async () => {
    if (!backupBuild?.buildId) {
      return;
    }
    const result = await nativeClient.project.restoreDevelopmentBuild.mutate({
      projectId,
      fromBuildId: backupBuild.buildId,
    });
    if (result.success) {
      location.reload();
      return;
    }
    toast.error(result.error);
  };

  return (
    <Grid gap={2} css={sectionSpacing}>
      <Text variant="titles">النسخ الاحتياطية</Text>
      <Select
        placeholder="لا توجد نسخ احتياطية"
        options={options}
        getValue={(option) => option.buildId ?? ""}
        getLabel={(option) => {
          if (!option.createdAt) {
            return;
          }
          let label = formatPublishDate(option.createdAt);
          if (option.domains) {
            label += ` (${option.domains})`;
          }
          return label;
        }}
        value={backupBuild}
        onChange={setBackupBuild}
      />
      <Dialog>
        <DialogTrigger asChild>
          <Button
            color="primary"
            css={{ justifySelf: "start" }}
            disabled={canRestoreBackups === false || options.length === 0}
          >
            استعادة
          </Button>
        </DialogTrigger>
        <DialogContent width={320}>
          <DialogTitle>استعادة الإصدار المنشور</DialogTitle>
          <PanelContent as={Flex} direction="column" gap={2}>
            <Text>
              هل أنت متأكد أنك تريد استعادة المشروع إلى إصداره
              المنشور؟
            </Text>
            {backupBuild?.createdAt && (
              <Text color="destructive">
                ستُفقد جميع التغييرات التي أُجريت بعد{" "}
                {formatPublishDate(backupBuild.createdAt)}.
              </Text>
            )}
            <Flex gap="2" justify="end">
              <DialogClose>
                <Button color="ghost">إلغاء</Button>
              </DialogClose>
              <DialogClose>
                <Button color="destructive" onClick={restore}>
                  استعادة
                </Button>
              </DialogClose>
            </Flex>
          </PanelContent>
        </DialogContent>
      </Dialog>
      {canRestoreBackups === false && (
        <PanelBanner>
          <img
            src={cmsUpgradeBanner}
            alt="قم بالترقية للحصول على النسخ الاحتياطية"
            width={rawTheme.spacing[28]}
            style={{ aspectRatio: "4.1" }}
          />
          <Text variant="regularBold">قم بالترقية للاستعادة من النسخ الاحتياطية</Text>
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
    </Grid>
  );
};

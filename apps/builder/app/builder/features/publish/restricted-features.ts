import type { ReactNode } from "react";
import {
  getPublishablePages,
  isAssetsResource,
  isPathnamePattern,
  type DataSource,
  type Instance,
  type Pages,
  type Resources,
} from "@webstudio-is/sdk";
import { findPageAndSelectorByInstanceId } from "@webstudio-is/project-build/runtime";
import type { ProjectSettings } from "@webstudio-is/project-build";

export type RestrictedFeature =
  | undefined
  | {
      navigate?: { pageId: string; instanceSelector: string[] };
      view?: "pageSettings";
      info?: ReactNode;
    };

export type RestrictedFeaturesPermissions = {
  maxContactEmailsPerProject: number;
  allowAuth: boolean;
  allowDynamicData: boolean;
};

export const getRestrictedFeatures = ({
  pages,
  projectSettings,
  dataSources,
  resources,
  instances,
  permissions,
}: {
  pages: Pages | undefined;
  projectSettings?: ProjectSettings;
  dataSources: Map<string, DataSource>;
  resources: Resources;
  instances: Map<string, Instance>;
  permissions: RestrictedFeaturesPermissions;
}) => {
  const features = new Map<string, RestrictedFeature>();
  if (pages === undefined) {
    return features;
  }
  const publishablePages = getPublishablePages(pages);
  const publishablePageIds = new Set(publishablePages.map((page) => page.id));
  const projectMeta = projectSettings?.meta;
  if (
    permissions.maxContactEmailsPerProject === 0 &&
    (projectMeta?.contactEmail ?? "").trim()
  ) {
    features.set("بريد تواصل مخصص", undefined);
  }
  if (permissions.allowAuth === false) {
    if ((projectMeta?.auth ?? "").trim()) {
      features.set("مصادقة المشروع", undefined);
    }
    for (const page of publishablePages) {
      if (page.meta.auth !== undefined) {
        features.set("مصادقة الصفحة", {
          navigate: {
            pageId: page.id,
            instanceSelector: [page.rootInstanceId],
          },
          view: "pageSettings",
        });
      }
    }
  }
  if (permissions.allowDynamicData === false) {
    for (const page of publishablePages) {
      const navigate = {
        pageId: page.id,
        instanceSelector: [page.rootInstanceId],
      };
      if (isPathnamePattern(page.path) && page.path !== "/*") {
        features.set("مسار ديناميكي", { navigate, view: "pageSettings" });
      }
      if (page.meta.redirect && page.meta.redirect !== `""`) {
        features.set("إعادة توجيه", { navigate, view: "pageSettings" });
      }
    }
    for (const dataSource of dataSources.values()) {
      if (dataSource.type === "resource") {
        const instanceId = dataSource.scopeInstanceId ?? "";
        const navigate = findPageAndSelectorByInstanceId(
          pages,
          instances,
          instanceId
        );
        if (publishablePageIds.has(navigate.pageId) === false) {
          continue;
        }
        const resource = resources.get(dataSource.resourceId);
        features.set(
          resource !== undefined && isAssetsResource(resource)
            ? "مورد الوسائط"
            : "متغير مورد",
          {
            navigate,
          }
        );
      }
    }
  }
  return features;
};

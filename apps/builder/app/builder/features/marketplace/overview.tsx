import { useMemo, useState } from "react";
import {
  Flex,
  IconButton,
  List,
  ListItem,
  PanelTabs,
  PanelTabsContent,
  PanelTabsList,
  PanelTabsTrigger,
  ScrollArea,
  Tooltip,
  Text,
  theme,
} from "@webstudio-is/design-system";
import { EllipsesIcon } from "@webstudio-is/icons";
import type { Project } from "@webstudio-is/project";
import { usePress } from "@react-aria/interactions";
import { marketplaceCategories } from "@webstudio-is/project-build";
import { mapGroupBy } from "~/shared/shim";
import type { MarketplaceOverviewItem } from "~/shared/marketplace/types";
import { Card } from "./card";

const marketplaceCategoryArabicLabels: Record<
  string,
  { label: string; description: string }
> = {
  sectionTemplates: {
    label: "الأقسام الجاهزة",
    description:
      "قوالب أقسام مصممة مسبقاً لإضافتها مباشرة وبسرعة داخل صفحاتك.",
  },
  pageTemplates: {
    label: "الصفحات والثيمات",
    description:
      "قوالب صفحات وثيمات كاملة جاهزة لإنشاء موقع متكامل بنقرة واحدة.",
  },
  integrationTemplates: {
    label: "التكاملات",
    description:
      "نماذج ربط وتكامل جاهزة للخدمات والمنصات الخارجية.",
  },
};

const GalleryOverviewItem = ({
  item,
  isLoading,
  isOpen,
  onOpenStateChange,
  ...props
}: {
  item: MarketplaceOverviewItem;
  isLoading: boolean;
  isOpen: boolean;
  onOpenStateChange: (isOpen: boolean) => void;
}) => {
  const { pressProps } = usePress({
    onPress() {
      onOpenStateChange(isOpen ? false : true);
    },
  });

  return (
    <Card
      {...props}
      title={item.name}
      image={
        item.thumbnailAssetName ? { name: item.thumbnailAssetName } : undefined
      }
      state={isOpen ? "selected" : isLoading ? "loading" : undefined}
      suffix={
        <Flex shrink={false} align="center">
          <IconButton
            {...pressProps}
            state={isOpen ? "open" : undefined}
            aria-label={`المزيد من الإجراءات لـ ${item.name}`}
          >
            <EllipsesIcon />
          </IconButton>
        </Flex>
      }
    />
  );
};

export const Overview = ({
  activeProjectId,
  hidden,
  items,
  onSelect,
  openAbout,
  onOpenAbout,
}: {
  hidden?: boolean;
  activeProjectId?: Project["id"];
  items?: Array<MarketplaceOverviewItem>;
  onSelect: (item: MarketplaceOverviewItem) => void;
  openAbout?: Project["id"];
  onOpenAbout: (projectId?: string) => void;
}) => {
  const itemsByCategory = useMemo(
    () => mapGroupBy(items ?? [], (item) => item.category),
    [items]
  );
  const [selectedCategory, setSelectedCategory] =
    useState<MarketplaceOverviewItem["category"]>("sectionTemplates");

  const categoryItems = itemsByCategory.get(selectedCategory);

  return (
    <PanelTabs
      value={selectedCategory}
      onValueChange={(category) => {
        setSelectedCategory(category as MarketplaceOverviewItem["category"]);
      }}
      asChild
      hidden={hidden}
    >
      <Flex direction="column">
        <PanelTabsList>
          {Array.from(marketplaceCategories.keys()).map((category) => {
            const localized =
              marketplaceCategoryArabicLabels[category] ??
              marketplaceCategories.get(category);
            return (
              <Tooltip
                key={category}
                variant="wrapped"
                content={localized?.description}
              >
                <div>
                  <PanelTabsTrigger value={category}>
                    {localized?.label}
                  </PanelTabsTrigger>
                </div>
              </Tooltip>
            );
          })}
        </PanelTabsList>
        <PanelTabsContent value={selectedCategory} tabIndex={-1}>
          <ScrollArea>
            {!categoryItems || categoryItems.length === 0 ? (
              <Flex
                direction="column"
                align="center"
                justify="center"
                gap="3"
                css={{
                  padding: theme.spacing[9],
                  textAlign: "center",
                  marginTop: theme.spacing[12],
                }}
              >
                <Text color="subtle">
                  لا توجد ثيمات أو قوالب معتمدة في هذا القسم حالياً
                </Text>
                <Text
                  color="moreSubtle"
                  css={{ maxWidth: 220, fontSize: 12, lineHeight: 1.5 }}
                >
                  ستظهر هنا قوالب باني العربية فور تصميمها واعتمادها في النظام.
                </Text>
              </Flex>
            ) : (
              <List asChild>
                <Flex direction="column">
                  {categoryItems.map((item, index) => {
                  return (
                    <ListItem
                      asChild
                      key={item.projectId}
                      index={index}
                      onSelect={() => {
                        onSelect(item);
                        onOpenAbout(undefined);
                      }}
                    >
                      <GalleryOverviewItem
                        item={item}
                        isLoading={item.projectId === activeProjectId}
                        isOpen={openAbout === item.projectId}
                        onOpenStateChange={(isOpen) => {
                          onOpenAbout(isOpen ? item.projectId : undefined);
                        }}
                      />
                    </ListItem>
                  );
                })}
              </Flex>
            </List>
            )}
          </ScrollArea>
        </PanelTabsContent>
      </Flex>
    </PanelTabs>
  );
};

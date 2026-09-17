import { forwardRef, type ComponentProps } from "react";
import {
  PanelContent,
  Flex,
  Grid,
  EnhancedTooltip,
  theme,
  IconButton,
  Box,
  FloatingPanel,
} from "@webstudio-is/design-system";
import { propertyDescriptions } from "@webstudio-is/css-data";
import type { CssProperty } from "@webstudio-is/css-engine";
import {
  XSmallIcon,
  EllipsesIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  TextAlignCenterIcon,
  TextAlignJustifyIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextCapitalizeIcon,
  MinusIcon,
  TextItalicIcon,
  TextLowercaseIcon,
  TextStrikethroughIcon,
  TextTruncateIcon,
  TextUnderlineIcon,
  TextUppercaseIcon,
} from "@webstudio-is/icons";
import { ToggleGroupControl } from "../../controls/toggle-group/toggle-group-control";
import {
  ColorControl,
  FontFamilyControl,
  FontWeightControl,
  SelectControl,
  TextControl,
} from "../../controls";
import { StyleSection } from "../../shared/style-section";
import {
  getPriorityStyleValueSource,
  PropertyLabel,
} from "../../property-label";
import { useComputedStyles } from "../../shared/model";
import { createBatchUpdate } from "../../shared/use-style-data";
import { useReadonly } from "../../shared/readonly";

const advancedProperties: CssProperty[] = [
  "white-space-collapse",
  "text-wrap-mode",
  "text-wrap-style",
  "direction",
  "hyphens",
  "text-overflow",
];

export const properties = [
  "font-family",
  "font-weight",
  "font-size",
  "line-height",
  "color",
  "text-align",
  "font-style",
  "text-decoration-line",
  "letter-spacing",
  "text-transform",
  ...advancedProperties,
] satisfies CssProperty[];

export const Section = () => {
  return (
    <StyleSection label="النص" properties={properties}>
      <Flex gap="2" direction="column">
        <TypographySectionFont />
        <TypographySectionSizing />
        <TypographySectionAdvanced />
      </Flex>
    </StyleSection>
  );
};

const TypographySectionFont = () => {
  return (
    <Grid css={{ gridTemplateColumns: "4fr 6fr" }} gap={2}>
      <PropertyLabel
        label="الخط"
        description={propertyDescriptions.fontFamily}
        properties={["font-family"]}
      />
      <FontFamilyControl />
      <PropertyLabel
        label="السُمك"
        description={propertyDescriptions.fontWeight}
        properties={["font-weight"]}
      />
      <FontWeightControl />
      <PropertyLabel
        label="اللون"
        description={propertyDescriptions.color}
        properties={["color"]}
      />
      <ColorControl property="color" />
    </Grid>
  );
};

const TypographySectionSizing = () => {
  return (
    <Grid gap="2" css={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
      <Grid gap="1">
        <PropertyLabel
          label="الحجم"
          description={propertyDescriptions.fontSize}
          properties={["font-size"]}
        />
        <TextControl property="font-size" />
      </Grid>
      <Grid gap="1">
        <PropertyLabel
          label="الارتفاع"
          description={propertyDescriptions.lineHeight}
          properties={["line-height"]}
        />
        <TextControl property="line-height" />
      </Grid>
      <Grid gap="1">
        <PropertyLabel
          label="التباعد"
          description={propertyDescriptions.letterSpacing}
          properties={["letter-spacing"]}
        />
        <TextControl property="letter-spacing" />
      </Grid>
    </Grid>
  );
};

const TypographySectionAdvanced = () => {
  return (
    <Grid gap="2" columns="2">
      <ToggleGroupControl
        properties={["text-align"]}
        items={[
          {
            child: <TextAlignLeftIcon />,
            description: "يحاذي النص بناءً على اتجاه الكتابة.",
            value: "start",
          },
          {
            child: <TextAlignCenterIcon />,
            description: "يوسّط النص أفقيًا داخل حاويته.",
            value: "center",
          },
          {
            child: <TextAlignRightIcon />,
            description: "يحاذي النص بناءً على اتجاه الكتابة.",
            value: "end",
          },
          {
            child: <TextAlignJustifyIcon />,
            description:
              "يضبط تباعد الكلمات لمحاذاة النص إلى الحافتين اليمنى واليسرى للحاوية",
            value: "justify",
          },
        ]}
      />
      <ToggleGroupControl
        properties={["text-decoration-line"]}
        items={[
          {
            child: <XSmallIcon />,
            description: "لا يتم تطبيق أي تنسيق على النص.",
            value: "none",
          },
          {
            child: <TextUnderlineIcon />,
            description: "يضيف خطًا أفقيًا أسفل النص.",
            value: "underline",
          },
          {
            child: <TextStrikethroughIcon />,
            description:
              "يرسم خطًا أفقيًا عبر منتصف النص.",
            value: "line-through",
          },
        ]}
      />
      <ToggleGroupControl
        properties={["text-transform"]}
        items={[
          {
            child: <XSmallIcon />,
            description:
              "لا يتم تطبيق أي تحويل على النص. يظهر النص كما هو.",
            value: "none",
          },
          {
            child: <TextUppercaseIcon />,
            description:
              "يحوّل النص ليظهر بأحرف كبيرة كلها.",
            value: "uppercase",
          },
          {
            child: <TextCapitalizeIcon />,
            description:
              "يحوّل الحرف الأول من كل كلمة إلى حرف كبير، وتبقى بقية الأحرف صغيرة.",
            value: "capitalize",
          },
          {
            child: <TextLowercaseIcon />,
            description:
              "يحوّل النص ليظهر بأحرف صغيرة كلها.",
            value: "lowercase",
          },
        ]}
      />
      <Grid align="end" gap="1" css={{ gridTemplateColumns: "3fr 1fr" }}>
        <ToggleGroupControl
          properties={["font-style"]}
          items={[
            {
              child: <XSmallIcon />,
              description:
                "القيمة الافتراضية. يظهر النص بالنمط العادي المعتدل.",
              value: "normal",
            },
            {
              child: <TextItalicIcon />,
              description:
                "يظهر النص بالنمط المائل، حيث يميل إلى اليمين.",
              value: "italic",
            },
          ]}
        />
        <TypographySectionAdvancedPopover />
      </Grid>
    </Grid>
  );
};

const AdvancedOptionsButton = forwardRef<
  HTMLButtonElement,
  ComponentProps<typeof IconButton> & {
    /** https://www.radix-ui.com/docs/primitives/components/collapsible#trigger */
    "data-state"?: "open" | "closed";
  }
>(({ onClick, ...rest }, ref) => {
  const readonly = useReadonly();
  const styles = useComputedStyles(advancedProperties);
  const styleValueSourceColor = getPriorityStyleValueSource(styles);
  return (
    <Flex>
      <EnhancedTooltip content="خيارات نصية متقدمة">
        <IconButton
          {...rest}
          disabled={readonly}
          onClick={(event) => {
            if (event.altKey) {
              const batch = createBatchUpdate();
              for (const property of advancedProperties) {
                batch.deleteProperty(property);
              }
              batch.publish();
              return;
            }
            onClick?.(event);
          }}
          variant={styleValueSourceColor}
          ref={ref}
        >
          <EllipsesIcon />
        </IconButton>
      </EnhancedTooltip>
    </Flex>
  );
});
AdvancedOptionsButton.displayName = "AdvancedOptionsButton";

const TypographySectionAdvancedPopover = () => {
  return (
    <FloatingPanel
      title="خيارات النص المتقدمة"
      placement="bottom-within"
      content={
        <PanelContent
          as={Grid}
          css={{
            gap: theme.spacing[9],
            width: theme.spacing[30],
          }}
        >
          <Grid css={{ gridTemplateColumns: "5fr 5fr" }} gap={2}>
            <PropertyLabel
              label="طي المسافات البيضاء"
              description={propertyDescriptions.whiteSpaceCollapse}
              properties={["white-space-collapse"]}
            />
            <SelectControl property="white-space-collapse" />
            <PropertyLabel
              label="نمط التفاف النص"
              description={propertyDescriptions.textWrapMode}
              properties={["text-wrap-mode"]}
            />
            <SelectControl property="text-wrap-mode" />
            <PropertyLabel
              label="أسلوب التفاف النص"
              description={propertyDescriptions.textWrapStyle}
              properties={["text-wrap-style"]}
            />
            <SelectControl property="text-wrap-style" />
            <PropertyLabel
              label="الاتجاه"
              description={propertyDescriptions.direction}
              properties={["direction"]}
            />
            <Box css={{ justifySelf: "end" }}>
              <ToggleGroupControl
                properties={["direction"]}
                items={[
                  {
                    child: <ArrowRightIcon />,
                    description:
                      "يضبط اتجاه النص من اليسار إلى اليمين، وهو الافتراضي لمعظم اللغات.",
                    value: "ltr",
                  },
                  {
                    child: <ArrowLeftIcon />,
                    description:
                      "يضبط اتجاه النص من اليمين إلى اليسار، ويُستخدم عادةً للغات مثل العربية والعبرية.",
                    value: "rtl",
                  },
                ]}
              />
            </Box>
            <PropertyLabel
              label="الواصلات"
              description={propertyDescriptions.hyphens}
              properties={["hyphens"]}
            />
            <Box css={{ justifySelf: "end" }}>
              <ToggleGroupControl
                properties={["hyphens"]}
                items={[
                  {
                    child: <XSmallIcon />,
                    description:
                      "يعطّل وصل الكلمات. لن تُوصل الكلمات حتى إذا تجاوزت عرض حاويتها.",
                    value: "manual",
                  },
                  {
                    child: <MinusIcon />,
                    description:
                      "يفعّل وصل الكلمات تلقائيًا. سيصل المتصفح الكلمات الطويلة عند نقاط مناسبة لتتسع داخل عرض حاويتها.",
                    value: "auto",
                  },
                ]}
              />
            </Box>
            <PropertyLabel
              label="فيضان النص"
              description={propertyDescriptions.textOverflow}
              properties={["text-overflow"]}
            />
            <Box css={{ justifySelf: "end" }}>
              <ToggleGroupControl
                properties={["text-overflow"]}
                items={[
                  {
                    child: <XSmallIcon />,
                    description:
                      "يُقص النص الفائض ويُخفى دون أي إشارة.",
                    value: "clip",
                  },
                  {
                    child: <TextTruncateIcon />,
                    description:
                      "يُقتطع النص الفائض مع علامة حذف (...) للإشارة إلى وجود المزيد من المحتوى. لجعل الخاصية text-overflow: ellipsis تعمل، تحتاج إلى ضبط خصائص CSS التالية: text-wrap-mode: nowrap; overflow: hidden;",
                    value: "ellipsis",
                  },
                ]}
              />
            </Box>
          </Grid>
        </PanelContent>
      }
    >
      <AdvancedOptionsButton />
    </FloatingPanel>
  );
};

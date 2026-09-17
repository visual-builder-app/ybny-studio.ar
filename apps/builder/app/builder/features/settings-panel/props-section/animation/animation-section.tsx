import isEqual from "fast-deep-equal";
import { forwardRef, useState, type ComponentProps } from "react";
import {
  PanelContent,
  Grid,
  theme,
  Select,
  Separator,
  Box,
  toast,
  ToggleGroup,
  Tooltip,
  ToggleGroupButton,
  Text,
  Switch,
  FloatingPanel,
  IconButton,
} from "@webstudio-is/design-system";
import {
  type AnimationAction,
  type AnimationActionScroll,
  createAnimationActionInput,
  type InsetUnitValue,
  insetUnitValue,
  RANGE_UNITS,
} from "@webstudio-is/sdk";
import { parseCssValue } from "@webstudio-is/css-data";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  EllipsesIcon,
} from "@webstudio-is/icons";
import { toValue, type StyleValue } from "@webstudio-is/css-engine";
import {
  CssValueInput,
  type IntermediateStyleValue,
} from "~/builder/features/style-panel/shared/css-value-input";
import { humanizeString } from "~/shared/string-utils";
import { FieldLabel } from "../../property-label";
import type { PropAndMeta } from "../use-props-logic";
import { AnimationsSelect } from "./animations-select";
import { SubjectSelect } from "./subject-select";

const animationTypeDescription: Record<AnimationAction["type"], string> = {
  scroll:
    "الحركات القائمة على التمرير تُشغَّل وتُتحكم بها حسب موضع تمرير المستخدم.",
  view: "الحركات القائمة على العرض تحدث عند دخول العنصر إلى الإطار المرئي أو خروجه منه. وهي تعتمد على ظهور العنصر وليس على موضع التمرير.",
};

const insetDescription =
  "يضبط موضع بدء/انتهاء الحركة نسبةً إلى منفذ التمرير. القيم الموجبة تحرّكه للداخل (تؤخر البدء أو تعجّل النهاية)، بينما القيم السالبة تحرّكه للخارج (تبدأ الحركة قبل الظهور أو تستمر بعد الاختفاء).";

const animationTypes = Object.keys(
  animationTypeDescription
) as AnimationAction["type"][];

const defaultActionValue: AnimationAction = {
  type: "view",
  animations: [],
};

const animationActionInput = createAnimationActionInput({ parseCssValue });

const animationAxisDescription: Record<
  Exclude<NonNullable<AnimationAction["axis"]>, "block" | "inline">,
  { icon: React.ReactNode; label: string; description: React.ReactNode }
> = {
  /*
  // We decided to not support block and inline axis, as mostly not used
  block: {
    icon: <ArrowDownIcon />,
    label: "Block axis",
    description:
      "Uses the scroll progress along the block axis (depends on writing mode, usually vertical in English).",
  },
  inline: {
    icon: <ArrowRightIcon />,
    label: "Inline axis",
    description:
      "Uses the scroll progress along the inline axis (depends on writing mode, usually horizontal in English).",
  },
  */

  y: {
    label: "المحور Y",
    icon: <ArrowDownIcon />,
    description: "شريط التمرير على المحور الرأسي لعنصر التمرير.",
  },
  x: {
    label: "المحور X",
    icon: <ArrowRightIcon />,
    description:
      "شريط التمرير على المحور الأفقي لعنصر التمرير.",
  },
};

/**
 * Support for block and inline axis is removed, as it is not widely used.
 */
const convertAxisToXY = (axis: NonNullable<AnimationAction["axis"]>) => {
  switch (axis) {
    case "block":
      return "y";
    case "inline":
      return "x";
    default:
      return axis;
  }
};

const animationSourceDescriptions: Record<
  NonNullable<AnimationActionScroll["source"]>,
  string
> = {
  nearest: "يحدد حاوية التمرير التي تؤثر على العنصر الحالي.",
  root: "يحدد عنصر التمرير الخاص بالمستند.",
  closest: "يحدد أقرب عنصر أصل قابل للتمرير.",
};

const unitOptions = RANGE_UNITS.map((unit) => ({
  id: unit,
  label: unit,
  type: "unit" as const,
}));

const InsetValueInput = ({
  value,
  onChange,
}: {
  value: InsetUnitValue;
  onChange: ((value: undefined, isEphemeral: true) => void) &
    ((value: InsetUnitValue, isEphemeral: boolean) => void);
}) => {
  const [intermediateValue, setIntermediateValue] = useState<
    StyleValue | IntermediateStyleValue
  >();

  const handleEphemeralChange = (styleValue: unknown | undefined) => {
    if (styleValue === undefined) {
      onChange(undefined, true);
      return;
    }

    const parsedResult = insetUnitValue.safeParse(styleValue);

    if (parsedResult.success) {
      onChange(parsedResult.data, true);
      return;
    }

    onChange(undefined, true);
  };

  return (
    <CssValueInput
      styleSource="default"
      value={value}
      /* marginLeft to allow negative values  */
      property="margin-left"
      unitOptions={unitOptions}
      intermediateValue={intermediateValue}
      onChange={(styleValue) => {
        setIntermediateValue(styleValue);

        if (styleValue?.type !== "intermediate") {
          handleEphemeralChange(styleValue);
        }
      }}
      getOptions={() => [
        {
          value: "auto",
          type: "keyword",
          description:
            "يختار خاصية viewTimelineInset للعنصر الفرعي أو يستخدم scroll-padding لعنصر التمرير، حسب المحور المحدد.",
        },
      ]}
      onHighlight={(value) => {
        handleEphemeralChange(value);
      }}
      onChangeComplete={(event) => {
        const parsedValue = insetUnitValue.safeParse(event.value);
        if (parsedValue.success) {
          onChange(parsedValue.data, false);
          setIntermediateValue(undefined);
          return;
        }

        setIntermediateValue({
          type: "invalid",
          value: toValue(event.value),
        });
      }}
      onAbort={() => {
        handleEphemeralChange(undefined);
      }}
      onReset={() => {
        handleEphemeralChange(undefined);
        setIntermediateValue(undefined);
      }}
    />
  );
};

const animationSources = Object.keys(
  animationSourceDescriptions
) as NonNullable<AnimationActionScroll["source"]>[];

const AnimationConfig = ({
  value,
  onChange,
}: {
  value: AnimationAction;
  onChange: ((value: AnimationAction, isEphemeral: boolean) => void) &
    ((value: undefined, isEphemeral: true) => void);
}) => {
  return (
    <PanelContent as={Grid} gap={2}>
      <Grid gap={1} align="center" columns={2}>
        <FieldLabel description="نوع الخط الزمني يحدد كيفية تشغيل الحركة.">
          النوع
        </FieldLabel>
        <Select
          options={animationTypes}
          getLabel={humanizeString}
          value={value.type}
          getDescription={(animationType) => (
            <Box css={{ width: theme.spacing[28] }}>
              {animationTypeDescription[animationType]}
            </Box>
          )}
          onChange={(typeValue) =>
            onChange({ ...value, type: typeValue, animations: [] }, false)
          }
        />
      </Grid>

      <Grid gap={1} align="center" columns={2}>
        <FieldLabel description="يحدد المحور ما إذا كانت الحركة تتقدم بناءً على ظهور العنصر في الاتجاه الأفقي أو الرأسي.">
          المحور
        </FieldLabel>
        <ToggleGroup
          css={{ justifySelf: "end" }}
          type="single"
          value={convertAxisToXY(value.axis ?? ("y" as const))}
          onValueChange={(axis: keyof typeof animationAxisDescription) =>
            onChange({ ...value, axis: convertAxisToXY(axis) }, false)
          }
        >
          {Object.entries(animationAxisDescription).map(
            ([key, { icon, label, description }]) => (
              <Tooltip
                key={key}
                variant="wrapped"
                content={
                  <Grid gap={1}>
                    <Text variant={"titles"}>{label}</Text>
                    <Text>{description}</Text>
                  </Grid>
                }
              >
                <ToggleGroupButton value={key}>{icon}</ToggleGroupButton>
              </Tooltip>
            )
          )}
        </ToggleGroup>
      </Grid>

      {value.type === "scroll" && (
        <Grid gap={1} align="center" columns={2}>
          <FieldLabel description="مصدر التمرير هو العنصر الذي يقود سلوك تمريره تقدم الحركة.">
            مصدر التمرير
          </FieldLabel>
          <Select
            options={animationSources}
            getLabel={humanizeString}
            value={value.source ?? "nearest"}
            getDescription={(animationSource) => (
              <Box css={{ width: theme.spacing[28] }}>
                {animationSourceDescriptions[animationSource]}
              </Box>
            )}
            onChange={(source) => onChange({ ...value, source }, false)}
          />
        </Grid>
      )}

      {value.type === "view" && (
        <Grid gap={1} align="center" columns={2}>
          <FieldLabel description="العنصر الهدف هو العنصر الذي يحدد ظهوره تقدم الحركة.">
            العنصر الهدف
          </FieldLabel>
          <SubjectSelect value={value} onChange={onChange} />
        </Grid>
      )}

      {value.type === "view" && (
        <Grid gap={1} align={"center"} css={{ gridTemplateColumns: "1fr 1fr" }}>
          <FieldLabel description={insetDescription}>
            {value.axis === "inline" || value.axis === "x"
              ? "إزاحة يسرى"
              : "إزاحة عليا"}
          </FieldLabel>
          <FieldLabel description={insetDescription}>
            {value.axis === "inline" || value.axis === "x"
              ? "إزاحة يمنى"
              : "إزاحة سفلى"}
          </FieldLabel>
          <InsetValueInput
            value={value.insetStart ?? { type: "keyword", value: "auto" }}
            onChange={(insetStart, isEphemeral) => {
              if (insetStart === undefined) {
                onChange(undefined, true);
                return;
              }
              onChange({ ...value, insetStart }, isEphemeral);
            }}
          />
          <InsetValueInput
            value={value.insetEnd ?? { type: "keyword", value: "auto" }}
            onChange={(insetEnd, isEphemeral) => {
              if (insetEnd === undefined) {
                onChange(undefined, true);
                return;
              }
              onChange({ ...value, insetEnd }, isEphemeral);
            }}
          />
        </Grid>
      )}
    </PanelContent>
  );
};

const AnimationConfigButton = forwardRef<
  HTMLButtonElement,
  Omit<ComponentProps<typeof IconButton>, "value" | "onChange"> & {
    value: AnimationAction;
    onChange: ((value: AnimationAction, isEphemeral: boolean) => void) &
      ((value: undefined, isEphemeral: true) => void);
  }
>(({ value, onChange, ...props }, ref) => {
  const { animations: defaultAnimations, ...defaultValue } = defaultActionValue;
  const { animations, ...newValue } = value;
  return (
    <Tooltip content="خيارات التحويل المتقدمة">
      <IconButton
        {...props}
        ref={ref}
        variant={isEqual(defaultValue, newValue) ? "default" : "local"}
        onClick={(event) => {
          if (event.altKey) {
            onChange(defaultActionValue, false);
            return;
          }
          props.onClick?.(event);
        }}
      >
        <EllipsesIcon />
      </IconButton>
    </Tooltip>
  );
});

export const AnimationSection = ({
  animationAction: animationActionProp,
  onChange,
  isAnimationEnabled,
  selectedBreakpointId,
}: {
  animationAction: PropAndMeta;
  onChange: ((value: undefined, isEphemeral: true) => void) &
    ((value: AnimationAction, isEphemeral: boolean) => void);
  isAnimationEnabled: (
    enabled: [breakpointId: string, enabled: boolean][] | undefined
  ) => boolean | undefined;
  selectedBreakpointId: string;
}) => {
  const { prop } = animationActionProp;

  const value: AnimationAction =
    prop?.type === "animationAction" ? prop.value : defaultActionValue;

  const handleChange = (value: unknown, isEphemeral: boolean) => {
    if (value === undefined && isEphemeral) {
      onChange(undefined, isEphemeral);
      return;
    }

    const parsedValue = animationActionInput.safeParse(value);
    if (parsedValue.success) {
      onChange(parsedValue.data, isEphemeral);
      return;
    }

    toast.error("مخطط الحركة غير صالح.");
  };

  return (
    <Grid css={{ paddingBottom: theme.panel.paddingBlock }}>
      <Grid gap={2} css={{ padding: theme.panel.paddingInline }}>
        <Grid gap={2} align="center" css={{ gridTemplateColumns: "1fr auto" }}>
          <FieldLabel description="حتى إذا كان متوقفًا، يمكنك معاينة الحركة بتحديد العنصر في شجرة العناصر.">
            التشغيل على اللوحة
          </FieldLabel>
          <Tooltip content={value.isPinned ? "إيقاف" : "تشغيل"}>
            <Switch
              checked={value.isPinned ?? false}
              onCheckedChange={(isPinned) => {
                handleChange({ ...value, isPinned }, false);
              }}
            />
          </Tooltip>
        </Grid>

        <Grid gap={2} align="center" css={{ gridTemplateColumns: "1fr auto" }}>
          <FieldLabel description="يعرض وضع التصحيح تقدم الحركة على اللوحة في وضع التصميم فقط.">
            التصحيح
          </FieldLabel>
          <Switch
            css={{ justifySelf: "end" }}
            checked={value.debug ?? false}
            onCheckedChange={(debug) => {
              handleChange({ ...value, debug }, false);
            }}
          />
        </Grid>
      </Grid>

      <Separator />

      <Grid gap={2}>
        <AnimationsSelect
          action={
            <FloatingPanel
              title="حركة متقدمة"
              placement="bottom-within"
              content={
                <AnimationConfig value={value} onChange={handleChange} />
              }
            >
              <AnimationConfigButton value={value} onChange={handleChange} />
            </FloatingPanel>
          }
          value={value}
          onChange={handleChange}
          isAnimationEnabled={isAnimationEnabled}
          selectedBreakpointId={selectedBreakpointId}
        />
      </Grid>
    </Grid>
  );
};

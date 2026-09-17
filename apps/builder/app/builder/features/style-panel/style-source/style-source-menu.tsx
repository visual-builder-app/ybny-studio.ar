import { Fragment, useState } from "react";
import {
  Box,
  Combobox,
  cssVar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Flex,
  InputErrorsTooltip,
  styled,
  Text,
  theme,
} from "@webstudio-is/design-system";
import { CheckMarkIcon, ChevronDownIcon, DotIcon } from "@webstudio-is/icons";
import {
  pseudoClassDescriptions,
  pseudoElementDescriptions,
  validateSelector,
} from "@webstudio-is/css-data";
import {
  menuTriggerGradientVar,
  menuTriggerVisibilityOverrideVar,
  menuTriggerVisibilityVar,
  menuCssVars,
  type ItemSource,
  type ItemSelector,
} from "./style-source-control";

export type SelectorConfig = {
  type: "state" | "pseudoElement";
  selector: string;
  label: string;
  description?: string;
  source?: "native" | "component" | "custom";
};

type IntermediateItem = {
  id: string;
  label: string;
  disabled: boolean;
  source: ItemSource;
  locked: boolean;
  isAdded?: boolean;
  states: string[];
};

const visibility = cssVar(
  menuTriggerVisibilityOverrideVar,
  cssVar(menuTriggerVisibilityVar)
);

const MenuTrigger = styled("button", {
  display: "inline-flex",
  border: "none",
  boxSizing: "border-box",
  minWidth: 0,
  alignItems: "center",
  position: "absolute",
  right: 0,
  top: 0,
  height: "100%",
  padding: 0,
  borderTopRightRadius: theme.borderRadius[4],
  borderBottomRightRadius: theme.borderRadius[4],
  color: "inherit",
  visibility,
  "&:hover, &[data-state=open]": {
    ...menuCssVars({ show: true }),
    "&::after": {
      content: '""',
      display: "block",
      position: "absolute",
      top: 0,
      right: 0,
      width: "100%",
      height: "100%",
      visibility,
      backgroundColor: cssVar("--overlay-interaction-hover"),
      borderTopRightRadius: theme.borderRadius[4],
      borderBottomRightRadius: theme.borderRadius[4],
      pointerEvents: "none",
    },
  },
});

const MenuTriggerGradient = styled(Box, {
  position: "absolute",
  top: 0,
  right: 0,
  width: theme.sizes.controlHeight,
  height: "100%",
  visibility,
  background: cssVar(menuTriggerGradientVar),
  borderTopRightRadius: theme.borderRadius[4],
  borderBottomRightRadius: theme.borderRadius[4],
  pointerEvents: "none",
});

const selectorLabels = [
  "state",
  "pseudoElement",
] satisfies SelectorConfig["type"][];

const categoryLabels: Record<SelectorConfig["type"], string> = {
  state: "الحالات",
  pseudoElement: "العناصر الزائفة",
};

const menuActionDescriptions = {
  rename: "غيّر اسم هذا الرمز ليصف غرضه بشكل أفضل.",
  duplicate: "أنشئ نسخة من هذا الرمز بجميع أنماطه.",
  convertToToken:
    "حوّل الأنماط المحلية إلى رمز قابل لإعادة الاستخدام يمكنك تطبيقه على عناصر أخرى.",
  clearStyles: "أزل جميع الأنماط من مصدر النمط المحلي هذا.",
  lock: "احمِ هذا الرمز من تغييرات الأنماط العرضية حتى تلغي قفله.",
  unlock: "اسمح بتغيير الأنماط على هذا الرمز مجددًا.",
  detach: "أزل هذا الرمز من العنصر دون حذفه.",
  delete: "احذف هذا الرمز وجميع أنماطه نهائيًا من المشروع.",
} as const;

type MenuAction = keyof typeof menuActionDescriptions;

const canEditStyleSourceStyles = (item: IntermediateItem) =>
  item.source === "local" || item.locked === false;

// All available CSS selectors for autocomplete
const allSelectors = [
  ...Object.keys(pseudoClassDescriptions),
  ...Object.keys(pseudoElementDescriptions),
];

const getDescription = (selector: string, type: "state" | "pseudoElement") => {
  // Normalize the selector to match the description keys
  const normalized = selector.startsWith(":") ? selector : `:${selector}`;
  const doubleColon = selector.startsWith("::")
    ? selector
    : `::${selector.replace(/^:/, "")}`;

  if (type === "pseudoElement") {
    return (
      pseudoElementDescriptions[doubleColon] ??
      pseudoElementDescriptions[selector]
    );
  }
  return (
    pseudoClassDescriptions[normalized] ?? pseudoClassDescriptions[selector]
  );
};

const getSelectorDescription = (selector: string | null | undefined) => {
  if (selector === undefined || selector === null) {
    return;
  }
  // Determine type based on which description object contains the selector
  const type =
    selector in pseudoElementDescriptions ? "pseudoElement" : "state";
  const description = getDescription(selector, type);
  if (description === undefined) {
    return;
  }
  return <Box css={{ maxWidth: theme.spacing[26] }}>{description}</Box>;
};

const SelectorCombobox = ({
  existingSelectors,
  onSelect,
}: {
  existingSelectors: string[];
  onSelect: (selector: string) => void;
}) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();

  const handleSubmit = (selector: string) => {
    const validation = validateSelector(selector);
    if (validation.success === false) {
      setError(validation.error);
      return;
    }
    setError(undefined);
    onSelect(selector);
    setValue("");
  };

  const availableItems = allSelectors.filter((selector) =>
    existingSelectors.every((s) => s !== selector)
  );

  return (
    <form
      onKeyDown={(event) => event.stopPropagation()}
      onSubmit={(event) => {
        event.preventDefault();
        if (value.trim()) {
          handleSubmit(value.trim());
        }
      }}
    >
      <InputErrorsTooltip
        variant="wrapped"
        errors={error ? [error] : undefined}
      >
        <Combobox<string>
          autoFocus={false}
          placeholder="::before"
          suffix={<span />}
          color={error ? "error" : undefined}
          getItems={() => availableItems}
          value={value}
          itemToString={(item) => item ?? ""}
          getDescription={getSelectorDescription}
          onItemSelect={(item) => {
            if (item) {
              handleSubmit(item);
            }
          }}
          onChange={(newValue) => {
            setValue(newValue ?? "");
            if (error) {
              setError(undefined);
            }
          }}
        />
      </InputErrorsTooltip>
    </form>
  );
};

type StyleSourceMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItemSelector: undefined | ItemSelector;
  item: IntermediateItem;
  hasStyles: boolean;
  states: SelectorConfig[];
  onAddSelector?: (itemId: IntermediateItem["id"], selector: string) => void;
  onSelect?: (itemSelector: ItemSelector) => void;
  onEdit?: (itemId: IntermediateItem["id"]) => void;
  onDuplicate?: (itemId: IntermediateItem["id"]) => void;
  onToggleLock?: (itemId: IntermediateItem["id"], locked: boolean) => void;
  onConvertToToken?: (itemId: IntermediateItem["id"]) => void;
  onDisable?: (itemId: IntermediateItem["id"]) => void;
  onEnable?: (itemId: IntermediateItem["id"]) => void;
  onDetach?: (itemId: IntermediateItem["id"]) => void;
  onDelete?: (itemId: IntermediateItem["id"]) => void;
  onClearStyles?: (itemId: IntermediateItem["id"]) => void;
};

export const StyleSourceMenu = (props: StyleSourceMenuProps) => {
  const [highlightedSelector, setHighlightedSelector] = useState<{
    selector: string;
    type: "state" | "pseudoElement";
    description?: string;
  }>();
  const [highlightedAction, setHighlightedAction] = useState<MenuAction>();
  const canEditStyles = canEditStyleSourceStyles(props.item);

  // Get description for highlighted or selected item
  const selectedState = props.selectedItemSelector?.state;
  const selectedConfig = selectedState
    ? props.states.find((s) => s.selector === selectedState)
    : undefined;
  const descriptionSelector =
    highlightedSelector ??
    (selectedConfig
      ? {
          selector: selectedConfig.selector,
          type: selectedConfig.type,
          description: selectedConfig.description,
        }
      : undefined);

  // Priority: action description > selector description > source description
  const actionDescription = highlightedAction
    ? menuActionDescriptions[highlightedAction]
    : undefined;

  const selectorDescription = descriptionSelector
    ? (descriptionSelector.description ??
      getDescription(descriptionSelector.selector, descriptionSelector.type))
    : undefined;

  // Get source description based on item source
  const sourceDescription =
    props.item.source === "local"
      ? "أنمط النسخ دون إنشاء رمز، أو تجاوز رمزًا محليًا."
      : props.item.source === "token"
        ? "أعد استخدام الأنماط عبر عدة نسخ بإنشاء رمز."
        : undefined;

  const description =
    actionDescription ?? selectorDescription ?? sourceDescription;

  return (
    <DropdownMenu modal open={props.open} onOpenChange={props.onOpenChange}>
      <DropdownMenuTrigger asChild>
        <MenuTrigger aria-label={`قائمة مصدر النمط ${props.item.label}`}>
          <MenuTriggerGradient />
          <ChevronDownIcon style={{ position: "relative" }} />
        </MenuTrigger>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        onCloseAutoFocus={(event) => event.preventDefault()}
        autoFocus
        css={{ maxWidth: theme.spacing[26] }}
      >
        <DropdownMenuLabel>
          <Flex gap="1" justify="between" align="center">
            <Text css={{ fontWeight: "bold" }} truncate>
              {props.item.label}
            </Text>
            {props.hasStyles && (
              <DotIcon size="12" color={cssVar("--foreground-accent")} />
            )}
          </Flex>
        </DropdownMenuLabel>
        {props.item.source !== "local" && (
          <DropdownMenuItem
            onFocus={() => {
              setHighlightedSelector(undefined);
              setHighlightedAction("rename");
            }}
            onSelect={() => props.onEdit?.(props.item.id)}
          >
            إعادة تسمية
          </DropdownMenuItem>
        )}
        {props.item.source !== "local" && (
          <DropdownMenuItem
            onFocus={() => {
              setHighlightedSelector(undefined);
              setHighlightedAction("duplicate");
            }}
            onSelect={() => props.onDuplicate?.(props.item.id)}
          >
            إنشاء نسخة
          </DropdownMenuItem>
        )}
        {props.item.source === "token" && (
          <DropdownMenuItem
            onFocus={() => {
              setHighlightedSelector(undefined);
              setHighlightedAction(props.item.locked ? "unlock" : "lock");
            }}
            onSelect={() =>
              props.onToggleLock?.(props.item.id, props.item.locked === false)
            }
          >
            {props.item.locked ? "إلغاء القفل" : "قفل"}
          </DropdownMenuItem>
        )}
        {props.item.source === "local" && (
          <DropdownMenuItem
            onFocus={() => {
              setHighlightedSelector(undefined);
              setHighlightedAction("convertToToken");
            }}
            onSelect={() => props.onConvertToToken?.(props.item.id)}
          >
            تحويل إلى رمز
          </DropdownMenuItem>
        )}
        {props.item.source === "local" && (
          <DropdownMenuItem
            destructive={true}
            onFocus={() => {
              setHighlightedSelector(undefined);
              setHighlightedAction("clearStyles");
            }}
            onSelect={() => props.onClearStyles?.(props.item.id)}
          >
            مسح الأنماط
          </DropdownMenuItem>
        )}
        {props.item.source !== "local" && (
          <DropdownMenuItem
            onFocus={() => {
              setHighlightedSelector(undefined);
              setHighlightedAction("detach");
            }}
            onSelect={() => props.onDetach?.(props.item.id)}
          >
            فصل
          </DropdownMenuItem>
        )}
        {props.item.source !== "local" && (
          <DropdownMenuItem
            destructive={true}
            onFocus={() => {
              setHighlightedSelector(undefined);
              setHighlightedAction("delete");
            }}
            onSelect={() => props.onDelete?.(props.item.id)}
          >
            حذف
          </DropdownMenuItem>
        )}
        {canEditStyles &&
          selectorLabels.map((currentCategory) => {
            const categoryStates = props.states.filter(
              ({ type }) => type === currentCategory
            );
            if (categoryStates.length === 0) {
              return;
            }
            return (
              <Fragment key={currentCategory}>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>
                  {categoryLabels[currentCategory]}
                </DropdownMenuLabel>
                {categoryStates.map(
                  ({ label, selector, source, type, description }, index) => {
                    const previousItem = categoryStates[index - 1];
                    const showSeparator =
                      index > 0 &&
                      ((source === "component" &&
                        previousItem?.source !== "component") ||
                        (source === "custom" &&
                          previousItem?.source !== "custom"));

                    return (
                      <Fragment key={selector}>
                        {showSeparator && <DropdownMenuSeparator />}
                        <DropdownMenuItem
                          withIndicator={true}
                          onFocus={() => {
                            setHighlightedAction(undefined);
                            setHighlightedSelector({
                              selector,
                              type,
                              description,
                            });
                          }}
                          icon={
                            props.item.id ===
                              props.selectedItemSelector?.styleSourceId &&
                            selector === props.selectedItemSelector.state && (
                              <CheckMarkIcon
                                color={
                                  props.item.states.includes(selector)
                                    ? cssVar("--foreground-accent")
                                    : cssVar("--foreground-primary")
                                }
                                size={12}
                              />
                            )
                          }
                          onSelect={() =>
                            props.onSelect?.({
                              styleSourceId: props.item.id,
                              state:
                                props.selectedItemSelector?.state === selector
                                  ? undefined
                                  : selector,
                            })
                          }
                        >
                          <Flex justify="between" align="center" grow>
                            <Text variant="labels" truncate>
                              {label}
                            </Text>
                            {props.item.states.includes(selector) && (
                              <DotIcon
                                size="12"
                                color={cssVar("--foreground-accent")}
                              />
                            )}
                          </Flex>
                        </DropdownMenuItem>
                      </Fragment>
                    );
                  }
                )}
              </Fragment>
            );
          })}
        {canEditStyles && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>إضافة المزيد</DropdownMenuLabel>
            <Box css={{ padding: theme.spacing[4] }}>
              <SelectorCombobox
                existingSelectors={props.states.map((state) => state.selector)}
                onSelect={(selector) =>
                  props.onAddSelector?.(props.item.id, selector)
                }
              />
            </Box>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem hint>{description}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const __testing__ = { canEditStyleSourceStyles };

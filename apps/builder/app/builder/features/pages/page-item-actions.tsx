import {
  Button,
  ContextMenuItem,
  ContextMenuItemRightSlot,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemRightSlot,
  DropdownMenuTrigger,
  Kbd,
  Tooltip,
  theme,
} from "@webstudio-is/design-system";
import { EllipsesIcon } from "@webstudio-is/icons";
import type { ReactNode } from "react";

export type PageItemActions = {
  paste?: () => void;
  copy?: () => void;
  duplicate?: () => void;
  delete?: () => void;
};

type PageItemActionsMenuItemsProps = {
  actions: PageItemActions;
};

const items = [
  { name: "paste", label: "لصق", shortcut: ["meta", "v"] },
  { name: "copy", label: "نسخ", shortcut: ["meta", "c"] },
  {
    name: "duplicate",
    label: "إنشاء نسخة",
    shortcut: ["meta", "d"],
  },
  {
    name: "delete",
    label: "حذف",
    shortcut: ["backspace"],
  },
] as const;

type ActionItem = (typeof items)[number];

const isDestructive = (name: ActionItem["name"]) => name === "delete";

const shortcutSlotStyle = { paddingLeft: theme.spacing[5] };

const ActionContextMenuItem = ({
  item,
  actions,
}: { item: ActionItem } & PageItemActionsMenuItemsProps) => {
  const action = actions[item.name];
  return (
    <ContextMenuItem
      onSelect={action}
      destructive={isDestructive(item.name)}
      disabled={action == null}
    >
      {item.label}
      {action && (
        <ContextMenuItemRightSlot css={shortcutSlotStyle}>
          <Kbd value={item.shortcut} />
        </ContextMenuItemRightSlot>
      )}
    </ContextMenuItem>
  );
};

export const PageItemContextMenuActions = ({
  actions,
}: PageItemActionsMenuItemsProps) => {
  return (
    <>
      {items.map((item) =>
        item.name === "paste" && actions.paste === undefined ? null : (
          <ActionContextMenuItem
            key={item.name}
            item={item}
            actions={actions}
          />
        )
      )}
    </>
  );
};

export const PageItemActionsDropdown = ({
  actions,
  label = "إجراءات",
  additionalItems,
}: PageItemActionsMenuItemsProps & {
  label?: string;
  additionalItems?: ReactNode;
}) => {
  return (
    <DropdownMenu>
      <Tooltip content={label} side="bottom">
        <DropdownMenuTrigger asChild>
          <Button
            color="ghost"
            prefix={<EllipsesIcon />}
            aria-label={label}
            tabIndex={2}
          />
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="end">
        {additionalItems}
        {items
          .filter((item) => item.name !== "paste")
          .map((item) => {
            const action = actions[item.name];
            return (
              <DropdownMenuItem
                key={item.name}
                onSelect={action}
                destructive={isDestructive(item.name)}
                disabled={action == null}
              >
                {item.label}
                {action && (
                  <DropdownMenuItemRightSlot css={shortcutSlotStyle}>
                    <Kbd value={item.shortcut} />
                  </DropdownMenuItemRightSlot>
                )}
              </DropdownMenuItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  Button,
  MenuCheckedIcon,
} from "@webstudio-is/design-system";
import {
  ChevronDownIcon,
  CalendarIcon,
  ArrowDownAZIcon,
  ArrowDownZAIcon,
  ArrowDownWideNarrowIcon,
  ArrowDownNarrowWideIcon,
} from "@webstudio-is/icons";
import type { SortState, SortField, SortOrder } from "./utils";

type AssetSortSelectProps = {
  value: SortState;
  onValueChange: (value: SortState) => void;
};

export const AssetSortSelect = ({
  value,
  onValueChange,
}: AssetSortSelectProps) => {
  const { sortBy, order } = value;

  const sortLabel =
    sortBy === "name"
      ? "Alphabetical"
      : sortBy === "size"
        ? "حجم الملف"
        : "تاريخ الإنشاء";

  const sortIcon =
    sortBy === "name" ? (
      order === "asc" ? (
        <ArrowDownAZIcon />
      ) : (
        <ArrowDownZAIcon />
      )
    ) : sortBy === "size" ? (
      order === "desc" ? (
        <ArrowDownWideNarrowIcon />
      ) : (
        <ArrowDownNarrowWideIcon />
      )
    ) : (
      <CalendarIcon />
    );

  const handleSortChange = (newSortBy: SortField, newOrder: SortOrder) => {
    // When switching to alphabetical sorting, default to A→Z (asc)
    // When switching to date/size sorting, default to newest/largest first (desc)
    if (newSortBy !== sortBy) {
      onValueChange({
        sortBy: newSortBy,
        order: newSortBy === "name" ? "asc" : "desc",
      });
    } else {
      onValueChange({ sortBy: newSortBy, order: newOrder });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button color="ghost" prefix={sortIcon} suffix={<ChevronDownIcon />}>
          {sortLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>ترتيب</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={sortBy}
          onValueChange={(value) => handleSortChange(value as SortField, order)}
        >
          <DropdownMenuRadioItem value="name" icon={<MenuCheckedIcon />}>
            أبجدي
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="createdAt" icon={<MenuCheckedIcon />}>
            تاريخ الإنشاء
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="size" icon={<MenuCheckedIcon />}>
            حجم الملف
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>الترتيب</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={order}
          onValueChange={(value) =>
            handleSortChange(sortBy, value as SortOrder)
          }
        >
          {sortBy === "name" ? (
            <>
              <DropdownMenuRadioItem value="asc" icon={<MenuCheckedIcon />}>
                أ→ي
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="desc" icon={<MenuCheckedIcon />}>
                ي→أ
              </DropdownMenuRadioItem>
            </>
          ) : sortBy === "size" ? (
            <>
              <DropdownMenuRadioItem value="desc" icon={<MenuCheckedIcon />}>
                الأكبر أولًا
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="asc" icon={<MenuCheckedIcon />}>
                الأصغر أولًا
              </DropdownMenuRadioItem>
            </>
          ) : (
            <>
              <DropdownMenuRadioItem value="desc" icon={<MenuCheckedIcon />}>
                الأحدث أولًا
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="asc" icon={<MenuCheckedIcon />}>
                الأقدم أولًا
              </DropdownMenuRadioItem>
            </>
          )}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

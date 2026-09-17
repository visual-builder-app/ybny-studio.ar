import { useMemo } from "react";
import { Combobox } from "@webstudio-is/design-system";

const PREDEFINED_CONDITIONS = [
  {
    value: "orientation:portrait",
    label: "الاتجاه: عمودي",
    description: "الجهاز في الوضع العمودي (الارتفاع > العرض)",
  },
  {
    value: "orientation:landscape",
    label: "الاتجاه: أفقي",
    description: "الجهاز في الوضع الأفقي (العرض > الارتفاع)",
  },
  {
    value: "hover:hover",
    label: "التحويم: متاح",
    description: "يمكن لأداة الإدخال الأساسية التحويم فوق العناصر",
  },
  {
    value: "hover:none",
    label: "التحويم: غير متاح",
    description: "لا يمكن لأداة الإدخال الأساسية التحويم (مثل شاشات اللمس)",
  },
  {
    value: "prefers-color-scheme:dark",
    label: "نظام الألوان: داكن",
    description: "يفضّل المستخدم نظام الألوان الداكن",
  },
  {
    value: "prefers-color-scheme:light",
    label: "نظام الألوان: فاتح",
    description: "يفضّل المستخدم نظام الألوان الفاتح",
  },
  {
    value: "prefers-reduced-motion:reduce",
    label: "تقليل الحركة: تقليل",
    description: "يفضّل المستخدم تقليل الحركة/الرسوم المتحركة",
  },
  {
    value: "prefers-reduced-motion:no-preference",
    label: "تقليل الحركة: بلا تفضيل",
    description: "لا يملك المستخدم تفضيلًا بشأن تقليل الحركة",
  },
  {
    value: "pointer:coarse",
    label: "المؤشر: تقريبي",
    description: "دقة أداة الإدخال الأساسية محدودة (مثل اللمس)",
  },
  {
    value: "pointer:fine",
    label: "المؤشر: دقيق",
    description: "دقة أداة الإدخال الأساسية عالية (مثل الفأرة)",
  },
  {
    value: "pointer:none",
    label: "المؤشر: بلا",
    description: "لا تتوفر أداة تأشير",
  },
  {
    value: "any-hover:hover",
    label: "أي تحويم: متاح",
    description: "يمكن لأداة إدخال واحدة على الأقل التحويم",
  },
  {
    value: "any-hover:none",
    label: "أي تحويم: غير متاح",
    description: "لا يمكن لأي أداة إدخال التحويم",
  },
  {
    value: "any-pointer:coarse",
    label: "أي مؤشر: تقريبي",
    description: "دقة أداة إدخال واحدة على الأقل محدودة",
  },
  {
    value: "any-pointer:fine",
    label: "أي مؤشر: دقيق",
    description: "دقة أداة إدخال واحدة على الأقل عالية",
  },
  {
    value: "any-pointer:none",
    label: "أي مؤشر: بلا",
    description: "لا تتوفر أدوات تأشير",
  },
  {
    value: "prefers-contrast:more",
    label: "التباين: أعلى",
    description: "يفضّل المستخدم تباينًا أعلى",
  },
  {
    value: "prefers-contrast:less",
    label: "التباين: أقل",
    description: "يفضّل المستخدم تباينًا أقل",
  },
  {
    value: "prefers-contrast:no-preference",
    label: "التباين: بلا تفضيل",
    description: "لا يملك المستخدم تفضيلًا بشأن التباين",
  },
  {
    value: "display-mode:fullscreen",
    label: "وضع العرض: ملء الشاشة",
    description: "التطبيق في وضع ملء الشاشة",
  },
  {
    value: "display-mode:standalone",
    label: "وضع العرض: مستقل",
    description: "التطبيق في الوضع المستقل (PWA)",
  },
  {
    value: "display-mode:minimal-ui",
    label: "وضع العرض: واجهة مصغّرة",
    description: "تطبيق بواجهة متصفح مصغّرة (PWA)",
  },
  {
    value: "display-mode:browser",
    label: "وضع العرض: متصفح",
    description: "تطبيق في تبويب متصفح عادي",
  },
];

type Condition = { value: string; label: string; description?: string };

type ConditionInputProps = {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
};

export const ConditionInput = ({
  name,
  value,
  onChange,
  onBlur,
  placeholder = "مثال: orientation:portrait",
}: ConditionInputProps) => {
  // Find the matching condition item or create a custom one
  const selectedItem: Condition | null = useMemo(() => {
    const found = PREDEFINED_CONDITIONS.find((c) => c.value === value);
    if (found) {
      return found;
    }
    // If value doesn't match any predefined condition, create a custom item
    if (value) {
      return { value, label: value };
    }
    return null;
  }, [value]);

  return (
    <Combobox<Condition>
      value={selectedItem}
      itemToString={(item) => item?.value ?? ""}
      getItems={() => PREDEFINED_CONDITIONS}
      match={(search, items, itemToString) => {
        if (!search) {
          return items;
        }
        const searchLower = search.toLowerCase();
        return items.filter(
          (item) =>
            item.label.toLowerCase().includes(searchLower) ||
            itemToString(item).toLowerCase().includes(searchLower)
        );
      }}
      getItemProps={(item) => ({
        children: item.label,
      })}
      getDescription={(item) => item?.description}
      onItemSelect={(item) => {
        if (item) {
          onChange(item.value);
        }
      }}
      onChange={(value) => {
        onChange(value ?? "");
      }}
      name={name}
      onBlur={onBlur}
      placeholder={placeholder}
    />
  );
};

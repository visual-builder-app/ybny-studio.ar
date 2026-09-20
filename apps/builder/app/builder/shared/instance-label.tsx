import type { HtmlTags } from "@webstudio-is/html-data";
import { useStore } from "@nanostores/react";
import {
  BlockquoteIcon,
  BodyIcon,
  BoldIcon,
  BoxIcon,
  BracesIcon,
  ButtonElementIcon,
  CalendarIcon,
  FormIcon,
  FormTextAreaIcon,
  FormTextFieldIcon,
  HeadingIcon,
  ImageIcon,
  ItemIcon,
  LabelIcon,
  LinkIcon,
  ListIcon,
  ListItemIcon,
  MinusIcon,
  SelectIcon,
  SubscriptIcon,
  SuperscriptIcon,
  TextAlignLeftIcon,
  TextItalicIcon,
} from "@webstudio-is/icons/svg";
import {
  elementComponent,
  parseComponentName,
  ROOT_INSTANCE_ID,
  type Instance,
} from "@webstudio-is/sdk";
import { $instances } from "~/shared/sync/data-stores";
import { $registeredComponentMetas } from "~/shared/nano-states";
import { humanizeString } from "~/shared/string-utils";

const htmlIcons: Record<string, undefined | string> = {
  // typography
  h1: HeadingIcon,
  h2: HeadingIcon,
  h3: HeadingIcon,
  h4: HeadingIcon,
  h5: HeadingIcon,
  h6: HeadingIcon,
  p: TextAlignLeftIcon,
  blockquote: BlockquoteIcon,
  code: BracesIcon,
  ul: ListIcon,
  ol: ListIcon,
  li: ListItemIcon,
  hr: MinusIcon,
  // rich text
  b: BoldIcon,
  strong: BoldIcon,
  i: TextItalicIcon,
  em: TextItalicIcon,
  sub: SubscriptIcon,
  sup: SuperscriptIcon,
  a: LinkIcon,
  // form
  form: FormIcon,
  textarea: FormTextAreaIcon,
  button: ButtonElementIcon,
  input: FormTextFieldIcon,
  label: LabelIcon,
  select: SelectIcon,
  option: ItemIcon,
  // misc
  body: BodyIcon,
  time: CalendarIcon,
  img: ImageIcon,
} satisfies Partial<Record<HtmlTags, undefined | string>>;

type InstanceLike = {
  component: string;
  label?: string;
  name?: string;
  tag?: string;
};

type Props = {
  size?: number | string;
  instance: InstanceLike;
  icon?: string;
};

export const InstanceIcon = ({ size = 16, instance, icon }: Props) => {
  const metas = useStore($registeredComponentMetas);
  const meta = metas.get(instance.component);
  // element component should be treated as div when no tag specified
  const elementTag =
    instance.component === elementComponent ? "div" : undefined;
  const tag =
    instance.tag ?? elementTag ?? Object.keys(meta?.presetStyle ?? {})[0];
  const computedIcon = icon ?? meta?.icon ?? htmlIcons[tag] ?? BoxIcon;
  return (
    <div
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: computedIcon }}
    />
  );
};

export const componentArabicLabels: Record<string, string> = {
  // الهيكل والتخطيط
  Box: "صندوق",
  Section: "قسم",
  Container: "حاوية",
  Body: "جسم الصفحة",
  Root: "الجذر",
  Slot: "فتحة مكوّن",
  Element: "عنصر",
  Fragment: "مجموعة",
  Separator: "فاصل",

  // النصوص والخطوط
  Heading: "عنوان",
  Paragraph: "فقرة",
  Text: "نص",
  InlineText: "نص مدمج",
  Blockquote: "اقتباس",
  Bold: "عريض",
  Italic: "مائل",
  Link: "رابط",
  CodeText: "نص برمجي",
  HtmlEmbed: "تضمين كود HTML",

  // الوسائط
  Image: "صورة",
  Video: "فيديو",
  Audio: "ملف صوتي",
  Icon: "أيقونة",
  Svg: "رسم SVG",

  // النماذج
  Form: "نموذج",
  Input: "حقل إدخال",
  TextArea: "مربع نص",
  Button: "زر",
  Label: "تسمية",
  Select: "قائمة اختيار",
  Option: "خيار",
  Checkbox: "مربع اختيار",
  Radio: "زر اختيار",
  RadioButton: "زر اختيار",

  // القوائم والمجموعات
  List: "قائمة",
  ListItem: "عنصر قائمة",
  Collection: "مجموعة بيانات",

  // المكونات التفاعلية
  Tabs: "تبويبات",
  Accordion: "قائمة مطوية",
  Dialog: "نافذة منبثقة",
  Sheet: "لوحة جانبية منبثقة",
  Collapsible: "لوحة قابلة للطي",
  Popover: "تلميح منبثق",
  Tooltip: "تلميح",
  DropdownMenu: "قائمة منسدلة",
  Switch: "مفتاح تبديل",
  RadioGroup: "مجموعة خيارات",
  NavigationMenu: "قائمة تنقل",

  // الوقت والبيانات
  Time: "وقت وتاريخ",
  ContentBlock: "كتلة محتوى",

  // Namespaced identifiers must be matched exactly, never by a short name.
  "ws:element": "عنصر",
  "ws:collection": "مجموعة بيانات",
  "@webstudio-is/sdk-components-react-radix:Tabs": "تبويبات",
  "@webstudio-is/sdk-components-react-radix:Accordion": "قائمة مطوية",
  "@webstudio-is/sdk-components-react-radix:Dialog": "نافذة منبثقة",
  "@webstudio-is/sdk-components-react-radix:Sheet": "لوحة جانبية منبثقة",
  "@webstudio-is/sdk-components-react-radix:Collapsible": "لوحة قابلة للطي",
  "@webstudio-is/sdk-components-react-radix:Popover": "تلميح منبثق",
  "@webstudio-is/sdk-components-react-radix:Tooltip": "تلميح",
  "@webstudio-is/sdk-components-react-radix:Select": "قائمة اختيار",
  "@webstudio-is/sdk-components-react-radix:Checkbox": "مربع اختيار",
  "@webstudio-is/sdk-components-react-radix:Switch": "مفتاح تبديل",
  "@webstudio-is/sdk-components-react-radix:RadioGroup": "مجموعة خيارات",
  "@webstudio-is/sdk-components-react-radix:NavigationMenu": "قائمة تنقل",
  "@webstudio-is/sdk-components-react-radix:DropdownMenu": "قائمة منسدلة",
  "@webstudio-is/sdk-components-react-radix:Label": "تسمية",
};

const getLabelFromComponentName = (
  component: Instance["component"],
  fallback?: string
) => {
  const [namespace, componentName] = parseComponentName(component);
  const humanized = humanizeString(componentName);
  if (Object.hasOwn(componentArabicLabels, component)) {
    return componentArabicLabels[component];
  }
  if (
    namespace === undefined &&
    Object.hasOwn(componentArabicLabels, humanized)
  ) {
    return componentArabicLabels[humanized];
  }
  return fallback || humanized;
};

export const getInstanceLabel = (
  instanceOrInstanceId: InstanceLike | string
): string => {
  if (typeof instanceOrInstanceId === "string") {
    if (instanceOrInstanceId === ROOT_INSTANCE_ID) {
      return "الجذر";
    }
    const instance = $instances.get().get(instanceOrInstanceId);
    if (instance) {
      return getInstanceLabel(instance);
    }
    return "غير معروف";
  }

  if (instanceOrInstanceId.label) {
    return instanceOrInstanceId.label;
  }
  if (instanceOrInstanceId.name) {
    return humanizeString(instanceOrInstanceId.name);
  }
  if (
    instanceOrInstanceId.component === elementComponent &&
    instanceOrInstanceId.tag
  ) {
    return `<${instanceOrInstanceId.tag}>`;
  }
  const meta = $registeredComponentMetas
    .get()
    .get(instanceOrInstanceId.component);
  return getLabelFromComponentName(instanceOrInstanceId.component, meta?.label);
};

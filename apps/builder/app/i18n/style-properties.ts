import { humanizeString } from "~/shared/string-utils";
import type { Dictionary } from "./dictionaries";

/**
 * اسم CSS معروض للمستخدم: القاموس أولاً (تسمية عربية/إنجليزية مقصودة)،
 * ثم تسمية إنجليزية مولّدة كاحتياط لخاصية غير مدرجة بعد.
 * مفتاح القاموس هو اسم الخاصية كما في CSS — لا يُترجم أبداً.
 */
export const resolvePropertyLabel = (
  dict: Dictionary,
  property: string
): string => {
  const labels = dict.stylePanel.properties as Record<
    string,
    string | undefined
  >;
  return labels[property] ?? humanizeString(property);
};

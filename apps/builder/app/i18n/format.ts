/**
 * Minimal `{placeholder}` interpolation for dictionary strings that need a
 * value (a count, a name). Not a full ICU MessageFormat — kept dependency-free
 * to match the granularity the translated strings actually need.
 */
export function interpolate(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match
  );
}

/**
 * Two-form pluralization (`one` / `other`). `{n}` in either form is replaced
 * with `count`.
 */
export function pluralize(
  count: number,
  forms: { one: string; other: string }
): string {
  return interpolate(count === 1 ? forms.one : forms.other, { n: count });
}

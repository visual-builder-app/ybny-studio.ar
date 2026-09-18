import { en } from "./en";
import { ar } from "./ar";

/** The shape every dictionary must satisfy, derived from English. */
export type Dictionary = typeof en;

/**
 * This product only ever renders Arabic (see the hardcoded
 * `lang="ar" dir="rtl"` in routes/_ui.tsx) — there is no runtime locale
 * switch, so the dictionary is a fixed export rather than something looked
 * up per-request.
 */
export const dict: Dictionary = ar;

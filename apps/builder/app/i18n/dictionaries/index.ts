import { en } from "./en";
import { ar } from "./ar";
import { defaultLocale, type Locale } from "../locale";

/** The shape every dictionary must satisfy, derived from English. */
export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { ar, en };

/**
 * Resolve the dictionary for the active interface locale. Arabic is the
 * default (see `i18n/locale.ts`); the initial value and `<html lang dir>` both
 * come from the locale cookie, read server-side in `routes/_ui.tsx`.
 */
export const getDictionary = (locale: Locale): Dictionary =>
  dictionaries[locale] ?? dictionaries[defaultLocale];

/**
 * The default-locale dictionary, exported for components rendered outside the
 * provider (stories, unit tests, canvas). Editor code should read the active
 * dictionary from `useLocale()` so it follows the language switcher.
 */
export const dict: Dictionary = ar;

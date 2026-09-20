/**
 * Locale primitives shared by the server (routes/_ui.tsx) and the client
 * (i18n/context.tsx). Kept dependency-light (`cookie` only) so both sides can
 * import it without pulling in React or server-only code.
 *
 * Mirrors the OSW studio (`ybnyai.com`): a first-time visitor gets the full
 * Arabic RTL interface with no switcher interaction, and the persisted cookie
 * is what keeps a later choice sticky. The default is a product decision — do
 * not change it to make a translation visible; change the translation.
 */
import { parse, serialize } from "cookie";

export const supportedLocales = ["ar", "en"] as const;
export type Locale = (typeof supportedLocales)[number];

/** Arabic is the default interface locale for YBNY products. */
export const defaultLocale: Locale = "ar";

export const localeCookieName = "__ybny_locale__";

export const localeLabels: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
};

const rtlLocales = new Set<Locale>(["ar"]);

export const dirFor = (locale: Locale): "rtl" | "ltr" =>
  rtlLocales.has(locale) ? "rtl" : "ltr";

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" &&
  (supportedLocales as readonly string[]).includes(value);

export const resolveLocale = (value: unknown): Locale =>
  isLocale(value) ? value : defaultLocale;

export const parseLocaleCookie = (
  cookie: string | null | undefined
): Locale | undefined => {
  if (cookie === null || cookie === undefined) {
    return undefined;
  }
  const value = parse(cookie)[localeCookieName];
  return isLocale(value) ? value : undefined;
};

export const serializeLocaleCookie = ({
  locale,
  domain,
  secure,
}: {
  locale: Locale;
  domain: string;
  secure: boolean;
}) =>
  serialize(localeCookieName, locale, {
    domain,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure,
  });

/**
 * Client-side locale context. The server (`routes/_ui.tsx`) reads the cookie
 * and renders `<html lang dir>` plus the initial value of this provider, so the
 * first paint is already in the right language and direction.
 *
 * `useLocale` deliberately falls back to the default context instead of
 * throwing when no provider is mounted: the editor is being converted to the
 * dictionary area by area, and a component rendered standalone (stories, unit
 * tests, canvas) must keep working.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getDictionary, type Dictionary } from "./dictionaries";
import { defaultLocale, dirFor, localeCookieName, type Locale } from "./locale";

export type LocaleContextValue = {
  locale: Locale;
  dir: "rtl" | "ltr";
  dict: Dictionary;
  setLocale: (locale: Locale) => void;
};

const fallbackContext: LocaleContextValue = {
  locale: defaultLocale,
  dir: dirFor(defaultLocale),
  dict: getDictionary(defaultLocale),
  setLocale: () => {},
};

const LocaleContext = createContext<LocaleContextValue>(fallbackContext);

const oneYearInSeconds = 60 * 60 * 24 * 365;

export const LocaleProvider = ({
  initialLocale,
  children,
}: {
  initialLocale?: Locale;
  children: ReactNode;
}) => {
  const [locale, setLocaleState] = useState<Locale>(
    initialLocale ?? defaultLocale
  );

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof document === "undefined") {
      return;
    }
    const root = document.documentElement;
    root.lang = next;
    root.dir = dirFor(next);
    document.cookie = `${localeCookieName}=${next}; path=/; max-age=${oneYearInSeconds}; samesite=lax`;
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir: dirFor(locale),
      dict: getDictionary(locale),
      setLocale,
    }),
    [locale, setLocale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
};

export const useLocale = (): LocaleContextValue => useContext(LocaleContext);

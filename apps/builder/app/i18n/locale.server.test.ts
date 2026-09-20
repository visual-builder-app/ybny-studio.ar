import { describe, expect, test } from "vitest";
import {
  defaultLocale,
  dirFor,
  isLocale,
  localeCookieName,
  parseLocaleCookie,
  resolveLocale,
  serializeLocaleCookie,
  supportedLocales,
} from "./locale";
import { getDictionary } from "./dictionaries";

describe("locale primitives", () => {
  test("Arabic is the default interface locale", () => {
    expect(defaultLocale).toBe("ar");
    expect(supportedLocales).toEqual(["ar", "en"]);
    expect(dirFor("ar")).toBe("rtl");
    expect(dirFor("en")).toBe("ltr");
  });

  test("recognises only supported locales", () => {
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(resolveLocale("de")).toBe(defaultLocale);
    expect(resolveLocale("en")).toBe("en");
  });

  test("reads the locale cookie and falls back when absent or unknown", () => {
    expect(parseLocaleCookie(`${localeCookieName}=en`)).toBe("en");
    expect(parseLocaleCookie(`foo=1; ${localeCookieName}=ar; bar=2`)).toBe(
      "ar"
    );
    expect(parseLocaleCookie(`${localeCookieName}=de`)).toBeUndefined();
    expect(parseLocaleCookie("")).toBeUndefined();
    expect(parseLocaleCookie(null)).toBeUndefined();
    expect(parseLocaleCookie(undefined)).toBeUndefined();
  });

  test("serialises a long-lived, site-wide locale cookie", () => {
    const cookie = serializeLocaleCookie({
      locale: "en",
      domain: "ybny.net",
      secure: true,
    });
    expect(cookie).toContain(`${localeCookieName}=en`);
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Secure");
  });
});

describe("dictionary lookup", () => {
  test("resolves the dictionary that matches the active locale", () => {
    expect(getDictionary("en").auth.login.welcome).toBe(
      "Welcome to YBNY Studio"
    );
    expect(getDictionary("ar").auth.login.welcome).toBe(
      "مرحبًا بك في استوديو يبني"
    );
    expect(getDictionary("ar").locale.switchLabel).toBe("تغيير اللغة");
    expect(getDictionary("en").locale.switchLabel).toBe("Switch language");
  });

  test("both dictionaries expose the same keys (compile-time and runtime parity)", () => {
    const ar = getDictionary("ar");
    const en = getDictionary("en");
    const flatten = (value: Record<string, unknown>, prefix = ""): string[] =>
      Object.entries(value).flatMap(([key, child]) =>
        typeof child === "object" && child !== null
          ? flatten(child as Record<string, unknown>, `${prefix}${key}.`)
          : [`${prefix}${key}`]
      );
    expect(flatten(ar).sort()).toEqual(flatten(en).sort());
  });
});

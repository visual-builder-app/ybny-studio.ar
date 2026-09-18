import type { Dictionary } from "./index";

/**
 * Arabic dictionary — the only one actually rendered. Typed as `Dictionary`
 * (derived from en.ts) so a key missing here, or present here but not in
 * English, is a compile error.
 */
export const ar: Dictionary = {
  auth: {
    login: {
      welcome: "مرحبًا بك في Webstudio",
      continueWithGoogle: "تسجيل الدخول عبر Google",
      continueWithGithub: "تسجيل الدخول عبر GitHub",
    },
    secretLogin: {
      toggleButton: "الدخول بالسر",
      secretPlaceholder: "سر الدخول",
      emailPlaceholder: "البريد الإلكتروني (اختياري)",
      defaultPlanOption: "الخطة الافتراضية",
      submit: "دخول",
    },
  },
};

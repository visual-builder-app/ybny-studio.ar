/**
 * Canonical dictionary shape and English reference strings. This build only
 * ever renders `ar` (see ../dictionaries/index.ts) — English exists here so
 * `Dictionary = typeof en` gives every other dictionary compile-time key
 * parity, and so translators have a source string to work from.
 */
// Deliberately no `as const`: that would freeze every leaf to its own string
// literal type, so ar.ts (a different string per key, same shape) would fail
// to type-check against `Dictionary = typeof en`. Plain `string` keeps the
// key-shape check without pinning the values.
export const en = {
  auth: {
    login: {
      welcome: "Welcome to Webstudio",
      continueWithGoogle: "Log in with Google",
      continueWithGithub: "Log in with GitHub",
    },
    secretLogin: {
      toggleButton: "Log in with a secret",
      secretPlaceholder: "Login secret",
      emailPlaceholder: "Email (optional)",
      defaultPlanOption: "Default plan",
      submit: "Log in",
    },
  },
};

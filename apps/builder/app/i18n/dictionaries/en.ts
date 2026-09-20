/**
 * Canonical dictionary shape and English reference strings.
 * Every other dictionary must satisfy `Dictionary = typeof en`.
 */
export const en = {
  auth: {
    login: {
      welcome: "Welcome to YBNY Studio",
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
  common: {
    save: "Save",
    saved: "Saved",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    back: "Back",
    loading: "Loading...",
    close: "Close",
    publish: "Publish",
    share: "Share",
    preview: "Preview",
  },
  sidebar: {
    components: "Components",
    pages: "Pages",
    navigator: "Navigator",
    assets: "Assets",
    marketplace: "Marketplace",
    help: "Learn or get help",
  },
  components: {
    title: "Components",
    searchPlaceholder: "Search components",
    noResults: "No matching components",
    categories: {
      general: "Structure & General",
      typography: "Typography & Text",
      media: "Media & Images",
      forms: "Forms & Inputs",
      radix: "Interactive Components",
      data: "Data & Collections",
      animations: "Animations",
      localization: "Languages & Localization",
      found: "Search Results",
      other: "Other Components",
    },
  },
  marketplace: {
    title: "Marketplace",
    categories: {
      sectionTemplates: "Sections",
      pageTemplates: "Pages & Themes",
      integrationTemplates: "Integrations",
    },
    emptyState: {
      title: "No approved themes or templates in this section yet",
      description: "Approved YBNY Arabic templates will appear here once authored and published.",
    },
  },
};

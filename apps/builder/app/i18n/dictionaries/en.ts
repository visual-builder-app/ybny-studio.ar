/**
 * Canonical dictionary shape and English reference strings.
 * Every other dictionary must satisfy `Dictionary = typeof en`.
 */
export const en = {
  stylePanel: {
    layout: {
      sectionTitle: "Layout",
      displayLabel: "Display",
      linkGapValues: "Link gap values",
      unlinkGapValues: "Unlink gap values",
      align: {
        start: "Start",
        center: "Center",
        end: "End",
        stretch: "Stretch",
        baseline: "Baseline",
        spaceBetween: "Space Between",
        spaceAround: "Space Around",
      },
      axis: { row: "Row", column: "Column" },
      direction: { rowReverse: "Row Reverse", columnReverse: "Column Reverse" },
      wrap: { nowrap: "No Wrap", wrap: "Wrap" },
      gridAutoFlow: { rowDense: "Row Dense", columnDense: "Column Dense" },
      gridGeneratorTitle: "Grid generator",
      fillGrid: "Fill grid",
      gridLayoutAria: "Grid layout: {columns} columns and {rows} rows",
      gridPresets: {
        fluidSidebar: "Fluid sidebar",
        pageStack: "Page stack",
        holyGrail: "Holy grail",
        responsiveCards: "Responsive cards",
        featureSection: "Feature section",
        footerColumns: "Footer columns",
      },
    },
    order: {
      label: "Order",
      values: {
        default: "Leave unchanged",
        first: "Make it first",
        last: "Make it last",
        custom: "Custom order",
      },
    },
    backgrounds: {
      typeLabel: "Type",
      typeGroupLabel: "Background type",
      otherProperties: "Additional properties",
      blendMode: "Blend mode",
      repeat: "Repeat",
      attachment: "Attachment",
      clip: "Clip",
      origin: "Origin",
      repeatTitle: "Background repeat",
      repeatAria: {
        "no-repeat": "No repeat",
        repeat: "Repeat",
        "repeat-y": "Repeat vertically",
        "repeat-x": "Repeat horizontally",
      },
      repeatValues: {
        "no-repeat":
          "This value means the background image is not repeated; it appears once.",
        repeat:
          "This value means the background image repeats horizontally and vertically to fill the whole background area.",
        "repeat-y":
          "This value means the background image repeats vertically only.",
        "repeat-x":
          "This value means the background image repeats horizontally only.",
      },
      attachmentTitle: "Background attachment",
      attachmentValues: { scroll: "Scroll", fixed: "Fixed" },
      types: {
        image: {
          label: "Image",
          description:
            "Use an image asset, a remote URL or a data URI as the layer's background.",
        },
        solid: {
          label: "Solid color",
          description:
            "Use a single-colour layer while keeping control over stacking order.",
        },
        linearGradient: {
          label: "Linear gradient",
          description:
            "Blend several colours along a line for smooth transitions.",
        },
        radialGradient: {
          label: "Radial gradient",
          description:
            "Blend several colours in a circular pattern for smooth transitions.",
        },
        conicGradient: {
          label: "Conic gradient",
          description:
            "Wrap colours around a centre point for charts, dials and spotlight effects.",
        },
      },
    },
  },
  locale: {
    switchLabel: "Switch language",
  },
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
      description:
        "Approved YBNY Arabic templates will appear here once authored and published.",
    },
  },
};

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
    size: {
      title: "Size",
      aspectRatio: "Aspect ratio",
      overflow: "Overflow",
      objectFit: "Object fit",
      objectPosition: "Object position",
    },
    alignSelf: {
      label: "Align",
      justifyLabel: "Justify",
      axisInline: "cross axis",
      axisBlock: "block axis",
      values: {
        auto: "Alignment is determined by the {parentProperty} property of the parent element.",
        start: "The item is aligned to the start of the {axis}.",
        center: "The item is centered along the {axis}.",
        end: "The item is aligned to the end of the {axis}.",
        stretch: "The item stretches to fill the {axis}.",
        baseline: "The item is aligned to the baseline along the {axis}.",
      },
      justifyValues: {
        auto: "The item's justification is determined by the justify-items property of the parent.",
        start: "The item is aligned to the start of the inline axis.",
        center: "The item is centered along the inline axis.",
        end: "The item is aligned to the end of the inline axis.",
        stretch: "The item stretches to fill the inline axis.",
        baseline: "The item is aligned to the baseline in the parent.",
      },
    },
    flexChild: {
      title: "Flex child",
      selectParentTooltip: "Select flex container",
      sizingLabel: "Sizing",
      sizingDescription:
        "Sets how the flex item grows, shrinks, or sets its initial size inside the flex container.",
      groupLabel: "Flex",
      sizing: {
        none: "No grow or shrink",
        grow: "The item grows to fill available space in the flex container when needed, but does not shrink when space is limited.",
        shrink:
          "The item does not grow to fill available space in the flex container, but shrinks when space is limited.",
        custom:
          "Additional sizing options: set flex-basis, flex-grow and flex-shrink individually.",
      },
      growLabel: "Grow",
      shrinkLabel: "Shrink",
      basisLabel: "Basis",
    },
    gridChild: {
      title: "Grid child",
      selectParentTooltip: "Select grid container",
      positionLabel: "Position",
      positionDescription: "How the grid item is placed inside the grid",
      modes: { auto: "Auto", area: "Area", manual: "Manual" },
      modeDescriptions: {
        auto: "Let the grid place this item automatically.",
        area: "Place the item in a named grid area.",
        manual: "Place the item manually using grid lines.",
      },
      columnSpan: "Column span",
      rowSpan: "Row span",
      noAreas: "No named areas. Add areas to the parent grid template.",
      selectArea: "Select area",
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

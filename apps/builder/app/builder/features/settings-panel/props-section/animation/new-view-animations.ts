import { parseCssValue } from "@webstudio-is/css-data";
import type { ViewAnimation } from "@webstudio-is/sdk";

const newViewAnimation: ViewAnimation = {
  name: "حركة جديدة",
  description: "أنشئ حركة جديدة.",

  timing: {
    rangeStart: ["cover", { type: "unit", value: 0, unit: "%" }],
    rangeEnd: ["cover", { type: "unit", value: 100, unit: "%" }],
    fill: "both",
    easing: "linear",
  },
  keyframes: [
    {
      offset: 0,
      styles: {},
    },
  ],
};

// @todo: visit https://github.com/argyleink/open-props/blob/main/src/props.animations.css
const newFadeInViewAnimation: ViewAnimation = {
  name: "ظهور تدريجي",
  description: "أظهر العنصر تدريجيًا أثناء تمريره إلى العرض.",

  timing: {
    rangeStart: ["entry", { type: "unit", value: 0, unit: "%" }],
    rangeEnd: ["entry", { type: "unit", value: 100, unit: "%" }],
    fill: "backwards",
    easing: "linear",
  },
  keyframes: [
    {
      offset: 0,
      styles: {
        opacity: parseCssValue("opacity", "0"),
      },
    },
  ],
};

const newFadeOutViewAnimation: ViewAnimation = {
  name: "اختفاء تدريجي",
  description: "أخفِ العنصر تدريجيًا أثناء تمريره خارج العرض.",

  timing: {
    rangeStart: ["exit", { type: "unit", value: 0, unit: "%" }],
    rangeEnd: ["exit", { type: "unit", value: 100, unit: "%" }],
    fill: "forwards",
    easing: "linear",
  },
  keyframes: [
    {
      offset: 1,
      styles: {
        opacity: parseCssValue("opacity", "0"),
      },
    },
  ],
};

const newFlyInViewAnimation: ViewAnimation = {
  name: "دخول بانسياب",
  description: "حركة الدخول بانسياب تحرّك العنصر أثناء تمريره إلى العرض.",

  timing: {
    rangeStart: ["entry", { type: "unit", value: 0, unit: "%" }],
    rangeEnd: ["entry", { type: "unit", value: 100, unit: "%" }],
    fill: "backwards",
    easing: "linear",
  },
  keyframes: [
    {
      offset: 0,
      styles: {
        translate: parseCssValue("translate", "0 100px"),
      },
    },
  ],
};

const newFlyOutViewAnimation: ViewAnimation = {
  name: "خروج بانسياب",
  description:
    "حركة الخروج بانسياب تحرّك العنصر أثناء تمريره خارج العرض.",

  timing: {
    rangeStart: ["exit", { type: "unit", value: 0, unit: "%" }],
    rangeEnd: ["exit", { type: "unit", value: 100, unit: "%" }],
    fill: "forwards",
    easing: "linear",
  },
  keyframes: [
    {
      offset: 1,
      styles: {
        translate: parseCssValue("translate", "0 -100px"),
      },
    },
  ],
};

const newWipeInViewAnimation: ViewAnimation = {
  name: "مسح للداخل",
  description:
    "المسح للداخل حركة يستبدل فيها مشهدٌ مشهدًا آخر تدريجيًا أثناء التمرير إلى العرض.",

  timing: {
    rangeStart: ["contain", { type: "unit", value: 0, unit: "%" }],
    rangeEnd: ["contain", { type: "unit", value: 50, unit: "%" }],
    fill: "backwards",
    easing: "linear",
  },
  keyframes: [
    {
      offset: 0,
      styles: {
        "clip-path": parseCssValue("clip-path", "inset(0 100% 0 0)"),
      },
    },
    {
      offset: 1,
      styles: {
        "clip-path": parseCssValue("clip-path", "inset(0 0 0 0)"),
      },
    },
  ],
};

const newWipeOutViewAnimation: ViewAnimation = {
  name: "مسح للخارج",
  description:
    "المسح للخارج حركة يستبدل فيها مشهدٌ مشهدًا آخر تدريجيًا أثناء التمرير خارج العرض.",

  timing: {
    rangeStart: ["contain", { type: "unit", value: 50, unit: "%" }],
    rangeEnd: ["contain", { type: "unit", value: 100, unit: "%" }],
    fill: "forwards",
    easing: "linear",
  },
  keyframes: [
    {
      offset: 0,
      styles: {
        "clip-path": parseCssValue("clip-path", "inset(0 0 0 0)"),
      },
    },

    {
      offset: 1,
      styles: {
        "clip-path": parseCssValue("clip-path", "inset(0 0 0 100%)"),
      },
    },
  ],
};

const newParallaxInAnimation: ViewAnimation = {
  name: "Parallax للداخل",
  description: "طبق تأثير Parallax على العنصر أثناء تمريره إلى العرض.",

  timing: {
    rangeStart: ["cover", { type: "unit", value: 0, unit: "%" }],
    rangeEnd: ["cover", { type: "unit", value: 50, unit: "%" }],
    fill: "backwards",
    easing: "linear",
  },
  keyframes: [
    {
      offset: 0,
      styles: {
        translate: parseCssValue("translate", "0 100px"),
      },
    },
  ],
};

const newParallaxOutAnimation: ViewAnimation = {
  name: "Parallax للخارج",
  description: "طبق تأثير Parallax على العنصر أثناء تمريره خارج العرض.",

  timing: {
    rangeStart: ["cover", { type: "unit", value: 50, unit: "%" }],
    rangeEnd: ["cover", { type: "unit", value: 100, unit: "%" }],
    fill: "forwards",
    easing: "linear",
  },
  keyframes: [
    {
      offset: 1,
      styles: {
        translate: parseCssValue("translate", "0 -100px"),
      },
    },
  ],
};

export const newViewAnimations = [
  newViewAnimation,
  newFadeInViewAnimation,
  newFadeOutViewAnimation,
  newFlyInViewAnimation,
  newFlyOutViewAnimation,
  newWipeInViewAnimation,
  newWipeOutViewAnimation,
  newParallaxInAnimation,
  newParallaxOutAnimation,
];

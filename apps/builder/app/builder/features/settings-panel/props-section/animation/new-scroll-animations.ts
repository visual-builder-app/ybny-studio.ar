import { parseCssValue } from "@webstudio-is/css-data";
import type { ScrollAnimation } from "@webstudio-is/sdk";

const newScrollAnimation: ScrollAnimation = {
  name: "حركة جديدة",
  description: "أنشئ حركة جديدة.",

  timing: {
    rangeStart: ["start", { type: "unit", value: 0, unit: "px" }],
    rangeEnd: ["end", { type: "unit", value: 0, unit: "px" }],
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
const newFadeInScrollAnimation: ScrollAnimation = {
  name: "ظهور تدريجي",
  description: "أظهر العنصر تدريجيًا أثناء تمريره إلى العرض.",

  timing: {
    rangeStart: ["start", { type: "unit", value: 0, unit: "%" }],
    rangeEnd: ["start", { type: "unit", value: 50, unit: "dvh" }],
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

const newFadeOutScrollAnimation: ScrollAnimation = {
  name: "اختفاء تدريجي",
  description: "أخفِ العنصر تدريجيًا أثناء تمريره خارج العرض.",

  timing: {
    rangeStart: ["end", { type: "unit", value: 50, unit: "dvh" }],
    rangeEnd: ["end", { type: "unit", value: 0, unit: "%" }],
    fill: "backwards",
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

export const newScrollAnimations = [
  newScrollAnimation,
  newFadeInScrollAnimation,
  newFadeOutScrollAnimation,
];

import { expect, test } from "vitest";
import { getInstanceLabel } from "./instance-label";

test("preserves an authored label even when it matches a built-in English name", () => {
  expect(getInstanceLabel({ component: "Heading", label: "Heading" })).toBe(
    "Heading"
  );
});

test("does not translate an explicitly named component", () => {
  expect(getInstanceLabel({ component: "Box", name: "Heading" })).toBe(
    "Heading"
  );
});

test("does not confuse a custom namespace with a built-in component", () => {
  expect(getInstanceLabel({ component: "@ybny/widgets:Button" })).toBe(
    "Button"
  );
});

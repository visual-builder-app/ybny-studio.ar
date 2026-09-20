import { act } from "react-dom/test-utils";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test } from "vitest";
import { page } from "@vitest/browser/context";
import { TooltipProvider } from "@webstudio-is/design-system";
import { canvasComponentLibraries } from "@webstudio-is/sdk-components-registry/canvas";
import {
  $registeredComponents,
  $registeredComponentHooks,
  $registeredComponentMetas,
  $registeredTemplates,
  registerComponentLibrary,
} from "~/shared/nano-states";
import { ComponentsPanel } from "./components";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const initialComponents = $registeredComponents.get();
const initialHooks = $registeredComponentHooks.get();
const initialMetas = $registeredComponentMetas.get();
const initialTemplates = $registeredTemplates.get();
let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  await page.viewport(480, 720);
  for (const library of canvasComponentLibraries) {
    registerComponentLibrary(library);
  }
  container = document.createElement("div");
  container.dir = "rtl";
  container.style.cssText =
    "width:260px;height:600px;display:flex;flex-direction:column";
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      <TooltipProvider>
        <ComponentsPanel publish={() => {}} onClose={() => {}} />
      </TooltipProvider>
    );
  });
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  $registeredComponents.set(initialComponents);
  $registeredComponentHooks.set(initialHooks);
  $registeredComponentMetas.set(initialMetas);
  $registeredTemplates.set(initialTemplates);
});

test("finds the real Tabs widget template by its Arabic name", async () => {
  const component = "@webstudio-is/sdk-components-react-radix:Tabs";
  expect($registeredTemplates.get().has(component)).toBe(true);
  const selector = `[data-drag-component="${component}"]`;
  expect(container.querySelector(selector)).not.toBeNull();
  await act(async () => {
    await page.getByPlaceholder("البحث عن المكوّنات").fill("تبويبات");
  });
  expect(container.querySelector(selector)).not.toBeNull();
  expect(container.querySelector(selector)?.textContent).toContain("تبويبات");
});

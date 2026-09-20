import { act } from "react-dom/test-utils";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { page } from "@vitest/browser/context";
import { TooltipProvider } from "@webstudio-is/design-system";
import { componentMetas } from "@webstudio-is/sdk-components-registry/metas";
import {
  $registeredComponentMetas,
  $registeredTemplates,
} from "~/shared/nano-states";
import { ComponentsPanel } from "./components";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
const onClose = vi.fn();
const initialMetas = $registeredComponentMetas.get();
const initialTemplates = $registeredTemplates.get();

beforeEach(async () => {
  const image = componentMetas.get("Image");
  const htmlEmbed = componentMetas.get("HtmlEmbed");
  if (image === undefined || htmlEmbed === undefined) {
    throw new Error("Expected real Image and HTML Embed component metadata");
  }
  $registeredComponentMetas.set(
    new Map([
      ["Image", image],
      ["HtmlEmbed", htmlEmbed],
    ])
  );
  $registeredTemplates.set(new Map());
  onClose.mockClear();
  container = document.createElement("div");
  container.style.cssText =
    "width:260px;height:600px;display:flex;flex-direction:column";
  container.dir = "rtl";
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      <TooltipProvider>
        <ComponentsPanel publish={() => {}} onClose={onClose} />
      </TooltipProvider>
    );
  });
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  $registeredComponentMetas.set(initialMetas);
  $registeredTemplates.set(initialTemplates);
});

test("finds a localized component by its canonical English identifier", async () => {
  expect(
    container.querySelector('[data-drag-component="Image"]')?.textContent
  ).toContain("صورة");
  await act(async () => {
    await page.getByPlaceholder("البحث عن المكوّنات").fill("Image");
  });
  expect(
    container.querySelector('[data-drag-component="Image"]')?.textContent
  ).toContain("صورة");
});

test("keeps the canonical English metadata label searchable after localization", async () => {
  await act(async () => {
    await page.getByPlaceholder("البحث عن المكوّنات").fill("HTML Embed");
  });
  expect(
    container.querySelector('[data-drag-component="HtmlEmbed"]')?.textContent
  ).toContain("تضمين كود HTML");
});

test("shows an empty state and keeps keyboard navigation safe with no results", async () => {
  await act(async () => {
    await page
      .getByPlaceholder("البحث عن المكوّنات")
      .fill("nothing-matches-492");
  });
  expect(container.textContent).toContain("لا يوجد مكوّن مطابق");
  const input = container.querySelector("input")!;
  await act(async () => {
    for (const key of ["Enter", "ArrowDown", "ArrowUp"]) {
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key, code: key, bubbles: true })
      );
    }
  });
  expect(onClose).not.toHaveBeenCalled();
  await act(async () => {
    await page.getByPlaceholder("البحث عن المكوّنات").fill("صورة");
  });
  expect(
    container.querySelector('[data-drag-component="Image"]')?.textContent
  ).toContain("صورة");
});

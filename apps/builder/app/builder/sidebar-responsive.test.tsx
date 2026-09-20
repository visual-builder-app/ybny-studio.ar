import { act } from "react-dom/test-utils";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test } from "vitest";
import { page } from "@vitest/browser/context";
import { TooltipProvider } from "@webstudio-is/design-system";
import { $canvasIframeState } from "~/shared/nano-states/canvas";
import { $settings } from "./shared/client-settings";
import { $dataLoadingState, setActiveSidebarPanel } from "./shared/nano-states";
import { SidebarLeft } from "./sidebar-left/sidebar-left";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const initialSettings = $settings.get();
const initialDataState = $dataLoadingState.get();
const initialCanvasState = $canvasIframeState.get();
let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  await page.viewport(320, 720);
  $settings.set({
    ...initialSettings,
    navigatorLayout: "undocked",
    sidebarPanelWidths: { components: 400 },
  });
  $dataLoadingState.set("loaded");
  $canvasIframeState.set("ready");
  setActiveSidebarPanel("components");
  container = document.createElement("div");
  container.dir = "rtl";
  container.style.cssText =
    "position:fixed;inset-inline-start:0;top:40px;bottom:0;width:40px;display:flex";
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      <TooltipProvider>
        <SidebarLeft publish={() => {}} />
      </TooltipProvider>
    );
  });
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  $settings.set(initialSettings);
  $dataLoadingState.set(initialDataState);
  $canvasIframeState.set(initialCanvasState);
  setActiveSidebarPanel("auto");
});

test("constrains the real components panel without overwriting its saved width", async () => {
  const panel = container.querySelector<HTMLElement>('[role="tabpanel"]')!;
  expect(panel).not.toBeNull();
  const bounds = panel.getBoundingClientRect();
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(window.innerWidth);
  expect(getComputedStyle(panel).resize).toBe("none");
  expect($settings.get().sidebarPanelWidths.components).toBe(400);
  await act(async () => {
    await page.viewport(1280, 720);
  });
  await expect.poll(() => panel.getBoundingClientRect().width).toBe(400);
  expect($settings.get().navigatorLayout).toBe("undocked");
  expect($settings.get().sidebarPanelWidths.components).toBe(400);
});

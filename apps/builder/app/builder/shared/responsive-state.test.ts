import { afterEach, beforeEach, expect, test } from "vitest";
import { page } from "@vitest/browser/context";
import { $canvasIframeState } from "~/shared/nano-states/canvas";
import { $settings } from "./client-settings";
import {
  $activeSidebarPanel,
  $dataLoadingState,
  $loadingState,
  setActiveSidebarPanel,
} from "./nano-states";

const initialSettings = $settings.get();
const initialDataState = $dataLoadingState.get();
const initialCanvasState = $canvasIframeState.get();
let unsubscribe: () => void;

beforeEach(async () => {
  await page.viewport(480, 720);
  $settings.set({
    ...initialSettings,
    navigatorLayout: "undocked",
    sidebarPanelWidths: { components: 400 },
  });
  $dataLoadingState.set("loaded");
  $canvasIframeState.set("ready");
  setActiveSidebarPanel("auto");
  unsubscribe = $activeSidebarPanel.listen(() => {});
});

afterEach(() => {
  unsubscribe();
  $settings.set(initialSettings);
  $dataLoadingState.set(initialDataState);
  $canvasIframeState.set(initialCanvasState);
  setActiveSidebarPanel("auto");
});

test("uses overlay docking on narrow screens without changing saved preferences", async () => {
  expect($loadingState.get().state).toBe("ready");
  expect($activeSidebarPanel.get()).toBe("none");
  await page.viewport(1280, 720);
  await expect.poll(() => $activeSidebarPanel.get()).toBe("navigator");
  await page.viewport(480, 720);
  await expect.poll(() => $activeSidebarPanel.get()).toBe("none");
  setActiveSidebarPanel("components");
  expect($activeSidebarPanel.get()).toBe("components");
  setActiveSidebarPanel("none");
  expect($activeSidebarPanel.get()).toBe("none");
  expect($settings.get().navigatorLayout).toBe("undocked");
  expect($settings.get().sidebarPanelWidths).toEqual({ components: 400 });
});

import { act } from "react-dom/test-utils";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { page } from "@vitest/browser/context";
import { $canvasIframeState } from "~/shared/nano-states/canvas";
import { $builderMode } from "~/shared/nano-states";
import { $dataLoadingState, $loadingState } from "~/builder/shared/nano-states";
import { BlockingAlerts } from "./blocking-alerts";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const initialData = $dataLoadingState.get();
const initialCanvas = $canvasIframeState.get();
const initialMode = $builderMode.get();
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  $builderMode.set("design");
  $dataLoadingState.set("loaded");
  $canvasIframeState.set("ready");
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  $dataLoadingState.set(initialData);
  $canvasIframeState.set(initialCanvas);
  $builderMode.set(initialMode);
});

test("recognizes real Chromium in an embedded browser context", async () => {
  await page.viewport(1280, 720);
  expect(navigator.userAgent).toMatch(/(?:Chrome|Chromium)[/][0-9]/);
  await act(async () => root.render(<BlockingAlerts />));
  expect(document.body.textContent).not.toContain("متصفح غير مدعوم");
});

test.each([320, 480, 699, 700, 899, 900])("does not block a supported %ipx editor viewport", async (width) => {
  await page.viewport(width, 720);
  const onClick = vi.fn();
  expect($loadingState.get().state).toBe("ready");
  await act(async () => {
    root.render(<><button onClick={onClick}>فتح أدوات الاختبار</button><BlockingAlerts /></>);
  });
  expect(document.body.textContent).not.toContain("متصفح غير مدعوم");
  expect(document.body.textContent).not.toContain("نافذة المتصفح صغيرة جدًا");
  await act(async () => page.getByRole("button", { name: "فتح أدوات الاختبار" }).click());
  expect(onClick).toHaveBeenCalledOnce();
});

test("explains the actual supported minimum below 320px", async () => {
  await page.viewport(280, 720);
  await act(async () => root.render(<BlockingAlerts />));
  expect(document.body.textContent).toContain("320px");
});

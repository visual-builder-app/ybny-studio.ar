import { act } from "react-dom/test-utils";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test } from "vitest";
import { page, userEvent } from "@vitest/browser/context";
import { TooltipProvider } from "@webstudio-is/design-system";
import { Menu } from "./menu";
import { $settings } from "~/builder/shared/client-settings";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const initialViewport = { width: window.innerWidth, height: window.innerHeight };
const initialSettings = $settings.get();
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  $settings.set({ ...initialSettings, navigatorLayout: "undocked" });
  container = document.createElement("div");
  container.dir = "rtl";
  container.style.cssText = "position:fixed;top:0;inset-inline-start:0";
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  $settings.set(initialSettings);
  await page.viewport(initialViewport.width, initialViewport.height);
});

test.each([[320, 480], [480, 720], [900, 720], [1280, 720]])(
  "keeps the RTL application menu and keyboard submenu reachable at %ix%i",
  async (width, height) => {
    await page.viewport(width, height);
    await act(async () => root.render(<TooltipProvider><Menu /></TooltipProvider>));
    const trigger = container.querySelector<HTMLButtonElement>('button[aria-label="القائمة"]')!;
    expect(trigger).not.toBeNull();
    await act(async () => page.getByRole("button", { name: "القائمة", exact: true }).click());
    const menu = document.querySelector<HTMLElement>('[role="menu"]')!;
    expect(menu).not.toBeNull();
    const bounds = menu.getBoundingClientRect();
    expect(bounds.left).toBeGreaterThanOrEqual(0);
    expect(bounds.right).toBeLessThanOrEqual(window.innerWidth);
    expect(bounds.top).toBeGreaterThanOrEqual(0);
    expect(bounds.bottom).toBeLessThanOrEqual(window.innerHeight);
    const view = [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')].find((item) => item.textContent?.trim() === "عرض")!;
    expect(view).not.toBeUndefined();
    const arrowTransform = getComputedStyle(view.querySelector("svg")!).transform;
    const arrowMatrix = new DOMMatrixReadOnly(arrowTransform === "none" ? undefined : arrowTransform);
    expect(arrowMatrix.a, "RTL submenu chevron must point toward the opening direction").toBe(-1);
    await act(async () => {
      view.focus();
      await userEvent.keyboard("{ArrowLeft}");
    });
    await expect.poll(() => document.querySelectorAll('[role="menu"]').length).toBe(2);
    for (const popup of document.querySelectorAll<HTMLElement>('[role="menu"]')) {
      const rect = popup.getBoundingClientRect();
      const geometry = JSON.stringify({ side: popup.dataset.side, dir: getComputedStyle(popup).direction, left: rect.left, right: rect.right, width: rect.width, availableWidth: getComputedStyle(popup).getPropertyValue("--radix-popper-available-width") });
      expect(rect.left, geometry).toBeGreaterThanOrEqual(0);
      expect(rect.right, geometry).toBeLessThanOrEqual(window.innerWidth);
      for (const item of popup.querySelectorAll<HTMLElement>('[role^="menuitem"]')) {
        expect(item.scrollWidth, item.textContent ?? "menu item").toBeLessThanOrEqual(item.clientWidth);
      }
    }
    const checkedItem = document.querySelector<HTMLElement>('[role="menuitemcheckbox"][aria-checked="true"]')!;
    expect(checkedItem).not.toBeNull();
    const itemBounds = checkedItem.getBoundingClientRect();
    const indicator = checkedItem.querySelector("svg")!.parentElement!.getBoundingClientRect();
    expect(indicator.left, "RTL checked indicator belongs at the inline start").toBeGreaterThan(itemBounds.left + itemBounds.width / 2);
    await act(async () => userEvent.keyboard("{ArrowRight}"));
    await expect.poll(() => document.querySelectorAll('[role="menu"]').length).toBe(1);
    await act(async () => userEvent.keyboard("{Escape}"));
    await expect.poll(() => document.querySelectorAll('[role="menu"]').length).toBe(0);
    expect(document.activeElement).toBe(trigger);
  }
);

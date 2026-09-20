import { act } from "react-dom/test-utils";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test } from "vitest";
import { page } from "@vitest/browser/context";
import { TooltipProvider } from "@webstudio-is/design-system";
import {
  SidebarTabs,
  SidebarTabsContent,
  SidebarTabsList,
  SidebarTabsTrigger,
} from "./sidebar-left/sidebar-tabs";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  await page.viewport(480, 720);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

test.each(["rtl", "ltr"] as const)(
  "opens the components panel toward the canvas in %s",
  async (direction) => {
    await act(async () => {
      root.render(
        <TooltipProvider>
          <div dir={direction} style={{ position: "fixed", inset: 0 }}>
            <div
              data-testid="rail"
              style={{
                display: "flex",
                position: "absolute",
                insetInlineStart: 0,
                top: 40,
                bottom: 0,
                width: 40,
              }}
            >
              <SidebarTabs dir={direction} defaultValue="components" orientation="vertical">
                <SidebarTabsList>
                  <SidebarTabsTrigger value="components" label="المكوّنات">+</SidebarTabsTrigger>
                </SidebarTabsList>
                <SidebarTabsContent value="components" css={{ width: 300 }}>
                  <input aria-label="البحث عن المكوّنات" />
                </SidebarTabsContent>
              </SidebarTabs>
            </div>
          </div>
        </TooltipProvider>
      );
    });
    const rail = container.querySelector('[data-testid="rail"]')!.getBoundingClientRect();
    const panel = container.querySelector('[role="tabpanel"]')!.getBoundingClientRect();
    expect(panel.left).toBeGreaterThanOrEqual(0);
    expect(panel.right).toBeLessThanOrEqual(window.innerWidth);
    if (direction === "rtl") {
      expect(panel.right).toBeCloseTo(rail.left, 0);
    } else {
      expect(panel.left).toBeCloseTo(rail.right, 0);
    }
  }
);

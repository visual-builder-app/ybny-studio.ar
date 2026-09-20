import { act } from "react-dom/test-utils";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test } from "vitest";
import { page, userEvent } from "@vitest/browser/context";
import { TooltipProvider } from "@webstudio-is/design-system";
import type { Project } from "@webstudio-is/project";
import { Topbar } from "./shared/topbar";
import { $pages, $breakpoints } from "~/shared/sync/data-stores";
import type { Breakpoint } from "@webstudio-is/sdk";
import { $selectedPageId, $selectedBreakpointId, $authPermit } from "~/shared/nano-states";
import { $isCompactInspectorOpen } from "./shared/responsive-layout";
import { __testing__ } from "./builder";

const { ChromeWrapper, Main, SidePanel } = __testing__;
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const initialPages = $pages.get();
const initialPageId = $selectedPageId.get();
const initialPermit = $authPermit.get();
const initialBreakpoints = $breakpoints.get();
const initialBreakpointId = $selectedBreakpointId.get();
let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  await page.viewport(480, 720);
  container = document.createElement("div");
  container.dir = "rtl";
  container.style.cssText = "position:fixed;inset:0";
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  $isCompactInspectorOpen.set(false);
  $pages.set(initialPages);
  $selectedPageId.set(initialPageId);
  $authPermit.set(initialPermit);
  $breakpoints.set(initialBreakpoints);
  $selectedBreakpointId.set(initialBreakpointId);
});

test("gives the narrow workspace the available width instead of reserving inspector space", async () => {
  await act(async () => {
    root.render(
      <ChromeWrapper isPreviewMode={false} isUiHidden={false} isFooterVisible={false} navigatorLayout="undocked">
        <div style={{ gridArea: "header", height: 40 }}>أدوات المحرر</div>
        <Main>
          <iframe title="صفحة مؤلفة باتجاه مستقل" srcDoc={'<html dir="ltr"><body>Page content</body></html>'} style={{ width: "100%", border: 0 }} />
        </Main>
        <SidePanel gridArea="sidebar"><div style={{ width: 40 }}>+</div></SidePanel>
        <SidePanel gridArea="inspector"><button style={{ width: 240 }}>فحص الأنماط</button></SidePanel>
      </ChromeWrapper>
    );
  });
  const main = container.querySelector("main")!;
  expect(main.getBoundingClientRect().width).toBeGreaterThanOrEqual(440);
  expect(main.getBoundingClientRect().left).toBeGreaterThanOrEqual(0);
  expect(main.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
  const iframe = container.querySelector("iframe")!;
  await expect.poll(() => iframe.contentDocument?.documentElement.dir).toBe("ltr");
});

test("opens the compact inspector from the real toolbar and restores focus on Escape", async () => {
  await act(async () => {
    root.render(
      <TooltipProvider>
        <ChromeWrapper isPreviewMode={false} isUiHidden={false} isFooterVisible={false} navigatorLayout="docked">
          <Topbar project={{ id: "responsive-fixture" } as Project} loading={null} isUiHidden={false} css={{ gridArea: "header" }} />
          <Main><button>المحتوى المؤلف</button></Main>
          <SidePanel gridArea="sidebar"><div style={{ width: 40 }}>+</div></SidePanel>
          <SidePanel gridArea="inspector"><input aria-label="تعديل خصائص العنصر" /></SidePanel>
        </ChromeWrapper>
      </TooltipProvider>
    );
  });
  const toggle = container.querySelector<HTMLElement>("#builder-inspector-toggle");
  expect(toggle).not.toBeNull();
  const inspector = container.querySelector<HTMLElement>("#builder-inspector-panel")!;
  expect(getComputedStyle(inspector).display).toBe("none");
  await act(async () => {
    await page.getByRole("button", { name: "الأنماط والإعدادات", exact: true }).click();
  });
  expect(getComputedStyle(inspector).display).toBe("flex");
  const bounds = inspector.getBoundingClientRect();
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(window.innerWidth);
  expect(container.querySelector("main")!.getBoundingClientRect().width).toBeGreaterThanOrEqual(440);
  await expect.poll(() => document.activeElement).toBe(inspector);
  await act(async () => userEvent.keyboard("{Escape}"));
  expect(getComputedStyle(inspector).display).toBe("none");
  expect(document.activeElement).toBe(toggle);
});

test.each([320, 480, 699, 700, 799, 800, 801, 899, 900, 1280])("keeps real toolbar actions reachable at %ipx with a long Arabic page name", async (width) => {
  await page.viewport(width, 720);
  const name = "صفحة عربية طويلة لاختبار الوصول إلى أدوات البناء";
  $pages.set({
    homePageId: "home", rootFolderId: "root",
    folders: new Map([["root", { id: "root", name: "", slug: "", children: ["home"] }]]),
    pages: new Map([["home", { id: "home", name, path: "", title: "", meta: {}, rootInstanceId: "body" }]]),
  });
  $selectedPageId.set("home");
  $authPermit.set("own");
  $breakpoints.set(new Map<string, Breakpoint>([
    ["desktop", { id: "desktop", label: "الأساسي" }],
    ["tablet", { id: "tablet", label: "الجهاز اللوحي", maxWidth: 991 }],
    ["mobile", { id: "mobile", label: "الجوال", maxWidth: 479 }],
  ]));
  $selectedBreakpointId.set("desktop");
  await act(async () => {
    root.render(
      <TooltipProvider>
        <Topbar project={{ id: "responsive-fixture" } as Project} loading={null} isUiHidden={false} css={{}} />
      </TooltipProvider>
    );
  });
  expect(container.textContent).toContain(name);
  const buttons = [...container.querySelectorAll("button")].filter((button) => button.getBoundingClientRect().width > 0);
  expect(buttons.length).toBeGreaterThan(4);
  for (const button of buttons) {
    const bounds = button.getBoundingClientRect();
    expect(bounds.left, button.getAttribute("aria-label") ?? button.textContent ?? "button").toBeGreaterThanOrEqual(0);
    expect(bounds.right, button.getAttribute("aria-label") ?? button.textContent ?? "button").toBeLessThanOrEqual(window.innerWidth);
    if (!button.disabled && button.getAttribute("aria-disabled") !== "true") {
      const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      expect(button.contains(hit), `${button.getAttribute("aria-label") ?? button.textContent} must not be covered`).toBe(true);
    }
  }
});

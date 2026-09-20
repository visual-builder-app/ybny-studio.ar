import { act } from "react-dom/test-utils";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { TooltipProvider } from "@webstudio-is/design-system";
import { Overview } from "./overview";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  container = document.createElement("div");
  container.dir = "rtl";
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

test("renders localized marketplace categories and a helpful empty state when empty", async () => {
  await act(async () => {
    root.render(
      <TooltipProvider>
        <Overview
          items={[]}
          onSelect={vi.fn()}
          onOpenAbout={vi.fn()}
        />
      </TooltipProvider>
    );
  });

  expect(container.textContent).toContain("الأقسام الجاهزة");
  expect(container.textContent).toContain("الصفحات والثيمات");
  expect(container.textContent).toContain("التكاملات");
  expect(container.textContent).toContain("لا توجد ثيمات أو قوالب معتمدة في هذا القسم حالياً");
});

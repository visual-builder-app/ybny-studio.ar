import { describe, expect, test } from "vitest";
import { convertAiHtmlToFragment, convertExportToAiFiles } from "./bridge-converter.server";

describe("YBNY Dual-Studio Bridge Converter", () => {
  test("packages exported HTML and CSS into ybnyai.com virtual files", () => {
    const html = "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>مرحبا</h1></body></html>";
    const css = ".heading { color: #3b82f6; }";
    const files = convertExportToAiFiles({ html, css, title: "مشروع تجربة" });

    expect(files.length).toBe(3);
    const indexFile = files.find((f) => f.path === "/index.html");
    const cssFile = files.find((f) => f.path === "/styles/theme.css");
    const promptFile = files.find((f) => f.path === "/.PROMPT.md");

    expect(indexFile).toBeDefined();
    expect(indexFile?.content).toContain('href="/styles/theme.css"');
    expect(cssFile?.content).toBe(css);
    expect(promptFile?.content).toContain("مشروع تجربة");
    expect(promptFile?.content).toContain("ybny.net");
  });

  test("converts AI HTML with Tailwind into a structured Webstudio AST fragment", async () => {
    const aiHtml = `
      <section class="p-8 bg-slate-900 text-white rounded-xl">
        <h2 class="text-2xl font-bold mb-4">عنوان تم توليده بالذكاء الاصطناعي</h2>
        <p class="text-slate-300">هذا نص من استوديو يبني للذكاء الاصطناعي</p>
        <button class="mt-4 px-6 py-2 bg-blue-600 rounded-lg">زر تفاعلي</button>
      </section>
    `;

    const fragment = await convertAiHtmlToFragment(aiHtml);

    expect(fragment).toBeDefined();
    expect(fragment.instances.length).toBeGreaterThan(0);
    // Instances must have unique IDs and components
    for (const instance of fragment.instances) {
      expect(instance.id).toBeDefined();
      expect(instance.component).toBeDefined();
    }
  });
});

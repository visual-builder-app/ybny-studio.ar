import { describe, expect, test } from "vitest";
import {
  convertAiHtmlToFragment,
  convertExportToAiFiles,
} from "./bridge-converter.server";

describe("YBNY Dual-Studio Bridge Converter", () => {
  test("emits complete project-scoped VFS records with UTF-8 sizes", () => {
    const files = convertExportToAiFiles({
      html: "<h1>يبني</h1>",
      projectId: "project-test",
    });
    for (const file of files) {
      expect(file.projectId).toBe("project-test");
      expect(file.id).toEqual(expect.any(String));
      expect(file.name).toEqual(expect.any(String));
      expect(file.mimeType).toEqual(expect.any(String));
      expect(file.size).toBe(Buffer.byteLength(file.content, "utf8"));
      expect(file.metadata).toEqual(expect.any(Object));
      expect(Number.isNaN(Date.parse(file.createdAt))).toBe(false);
      expect(Number.isNaN(Date.parse(file.updatedAt))).toBe(false);
    }
  });

  test("does not overwrite the AI project's instruction file", () => {
    const files = convertExportToAiFiles({
      html: "<h1>يبني</h1>",
      projectId: "project-test",
    });
    expect(files.some((file) => file.path === "/.PROMPT.md")).toBe(false);
  });
  test("links the stylesheet even when given an HTML fragment without a head", () => {
    const files = convertExportToAiFiles({
      projectId: "project-test",
      html: "<h1>يبني</h1>",
      css: "h1 {color: red}",
    });
    expect(
      files.find((file) => file.path === "/index.html")?.content
    ).toContain('href="/styles/theme.css"');
  });

  test("packages exported HTML and CSS into ybnyai.com virtual files", () => {
    const html =
      "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>مرحبا</h1></body></html>";
    const css = ".heading { color: #3b82f6; }";
    const files = convertExportToAiFiles({
      projectId: "project-test",
      html,
      css,
      title: "مشروع تجربة",
    });

    expect(files.length).toBe(3);
    const indexFile = files.find((f) => f.path === "/index.html");
    const cssFile = files.find((f) => f.path === "/styles/theme.css");
    const promptFile = files.find((f) => f.path === "/.ybny/bridge.json");

    expect(indexFile).toBeDefined();
    expect(indexFile?.content).toContain('href="/styles/theme.css"');
    expect(cssFile?.content).toBe(css);
    expect(promptFile?.content).toContain("مشروع تجربة");
    expect(promptFile?.content).toContain("ybny.net");
  });

  test("imports class-based paired CSS as editable styles", async () => {
    const fragment = await convertAiHtmlToFragment(
      '<h1 class="heading">يبني</h1>',
      ".heading { color: red; padding: 12px; }"
    );
    expect(fragment.styles.some((style) => style.property === "color")).toBe(
      true
    );
    expect(
      fragment.styles.some((style) => style.property === "paddingTop")
    ).toBe(true);
  });

  test("preserves generic tag rules as CSS embeds when they are not editable tokens", async () => {
    const fragment = await convertAiHtmlToFragment(
      "<h1>يبني</h1>",
      "h1 { color: red; }"
    );
    expect(JSON.stringify(fragment.props)).toContain("color: red");
  });

  test("keeps supplied CSS authoritative without introducing utility resets", async () => {
    const fragment = await convertAiHtmlToFragment(
      '<h1 class="heading">يبني</h1>',
      ".heading { color: red; }"
    );
    expect(
      fragment.styleSources.some((source) => source.type === "local")
    ).toBe(false);
  });

  test("refuses active JavaScript rather than silently flattening application behavior", async () => {
    await expect(
      convertAiHtmlToFragment("<div>Site</div><script>window.test=1</script>")
    ).rejects.toThrow();
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

import { createHash } from "node:crypto";
import {
  parse,
  parseFragment,
  serialize,
  type DefaultTreeAdapterMap,
} from "parse5";
import type { WebstudioFragment } from "@webstudio-is/sdk";
import { generateFragmentFromHtml } from "@webstudio-is/project-build/runtime";
import { generateFragmentFromTailwind } from "~/shared/tailwind/tailwind";
import { ybnyVirtualFileSchema, type YbnyVirtualFile } from "./types";

/** Supported-format gate, not a substitute for canvas sandboxing or a security sanitizer. */
const assertStaticDocument = (node: DefaultTreeAdapterMap["node"]): void => {
  if ("tagName" in node) {
    if (
      ["script", "iframe", "object", "embed", "base"].includes(node.tagName) ||
      node.attrs.some(
        (attr) =>
          attr.name.startsWith("on") ||
          /^(?:javascript|vbscript):/i.test(
            attr.value.replace(/[\u0000-\u0020]/g, "")
          )
      )
    ) {
      throw new Error(
        "Active application code requires an explicit runtime adapter"
      );
    }
    if (node.tagName === "template" && "content" in node) {
      assertStaticDocument((node as DefaultTreeAdapterMap["template"]).content);
    }
  }
  if ("childNodes" in node) {
    for (const child of node.childNodes) assertStaticDocument(child);
  }
};

/** Converts supported static HTML plus its supplied CSS; it never fetches remote assets. */
export const convertAiHtmlToFragment = async (
  html: string,
  css = ""
): Promise<WebstudioFragment> => {
  const document = parse(html);
  assertStaticDocument(document);
  let source = html;
  if (css.trim()) {
    if (/<\/style/i.test(css)) throw new Error("Invalid stylesheet content");
    const root = document.childNodes.find(
      (node) => node.nodeName === "html"
    ) as DefaultTreeAdapterMap["element"];
    const head = root.childNodes.find(
      (node) => node.nodeName === "head"
    ) as DefaultTreeAdapterMap["element"];
    const style = parseFragment("<style></style>")
      .childNodes[0] as DefaultTreeAdapterMap["element"];
    style.parentNode = head;
    style.childNodes.push({ nodeName: "#text", value: css, parentNode: style });
    head.childNodes.push(style);
    source = serialize(document);
  }
  const parsed = generateFragmentFromHtml(source);
  if (parsed.skippedSelectors.length > 0) {
    throw new Error(
      "HTML contains CSS selectors that cannot be imported safely"
    );
  }
  // Supplied CSS is authoritative; utility preflight must not override its tokens.
  return css.trim() ? parsed : generateFragmentFromTailwind(parsed);
};

/** Build a manual exchange batch. Never overwrite the user's /.PROMPT.md. */
export const convertExportToAiFiles = ({
  projectId,
  html,
  css = "",
  title = "YBNY Studio Site",
}: {
  projectId: string;
  html: string;
  css?: string;
  title?: string;
}): YbnyVirtualFile[] => {
  const timestamp = new Date().toISOString();
  const file = (
    path: string,
    content: string,
    type: "html" | "css" | "json",
    mimeType: string
  ): YbnyVirtualFile =>
    ybnyVirtualFileSchema.parse({
      id: `ybny-${createHash("sha256").update(`${projectId}\0${path}`).digest("hex")}`,
      projectId,
      path,
      name: path.split("/").at(-1),
      type,
      content,
      mimeType,
      size: Buffer.byteLength(content, "utf8"),
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: path === "/index.html" ? { isEntry: true } : {},
    });
  const files: YbnyVirtualFile[] = [];
  if (css.trim().length > 0) {
    files.push(file("/styles/theme.css", css, "css", "text/css"));
  }
  let processedHtml = html;
  if (css.trim().length > 0) {
    const document = parse(html);
    const root = document.childNodes.find(
      (node) => node.nodeName === "html"
    ) as DefaultTreeAdapterMap["element"];
    const head = root.childNodes.find(
      (node) => node.nodeName === "head"
    ) as DefaultTreeAdapterMap["element"];
    const hasStylesheet = head.childNodes.some(
      (node) =>
        "tagName" in node &&
        node.tagName === "link" &&
        node.attrs.some(
          (attr) =>
            attr.name === "rel" &&
            attr.value.toLowerCase().split(/\s+/).includes("stylesheet")
        ) &&
        node.attrs.some(
          (attr) =>
            attr.name === "href" &&
            ["/styles/theme.css", "styles/theme.css"].includes(attr.value)
        )
    );
    if (!hasStylesheet) {
      const link = parseFragment(
        '<link rel="stylesheet" href="/styles/theme.css">'
      ).childNodes[0];
      link.parentNode = head;
      head.childNodes.push(link);
    }
    processedHtml = serialize(document);
  }
  files.push(file("/index.html", processedHtml, "html", "text/html"));
  files.push(
    file(
      "/.ybny/bridge.json",
      JSON.stringify({ version: 1, title, source: "ybny.net" }),
      "json",
      "application/json"
    )
  );
  return files;
};

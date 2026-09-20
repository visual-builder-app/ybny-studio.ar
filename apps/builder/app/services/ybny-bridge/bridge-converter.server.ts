import type { WebstudioFragment } from "@webstudio-is/sdk";
import { generateFragmentFromHtml } from "@webstudio-is/project-build/runtime";
import { generateFragmentFromTailwind } from "~/shared/tailwind/tailwind";
import type { YbnyVirtualFile } from "./types";

/**
 * Converts raw AI-generated HTML & Tailwind from ybnyai.com
 * into a structured Webstudio AST Fragment ready for visual editing.
 */
export const convertAiHtmlToFragment = async (
  html: string
): Promise<WebstudioFragment> => {
  const parseResult = generateFragmentFromHtml(html);
  // Translate Tailwind utility classes into Webstudio CSS properties
  const fragment = await generateFragmentFromTailwind(parseResult);
  return fragment;
};

/**
 * Formats Webstudio exported HTML and CSS into Virtual Files
 * compatible with the ybnyai.com Virtual File System (VFS).
 */
export const convertExportToAiFiles = ({
  html,
  css = "",
  title = "YBNY Studio Site",
}: {
  html: string;
  css?: string;
  title?: string;
}): YbnyVirtualFile[] => {
  const timestamp = Date.now();
  const files: YbnyVirtualFile[] = [];

  // 1. Theme CSS file if styles exist
  if (css.trim().length > 0) {
    files.push({
      path: "/styles/theme.css",
      content: css,
      updatedAt: timestamp,
    });
  }

  // 2. Main index.html
  let processedHtml = html;
  if (css.trim().length > 0 && !processedHtml.includes('href="/styles/theme.css"')) {
    processedHtml = processedHtml.replace(
      "</head>",
      '  <link rel="stylesheet" href="/styles/theme.css">\n</head>'
    );
  }

  files.push({
    path: "/index.html",
    content: processedHtml,
    updatedAt: timestamp,
  });

  // 3. AI prompt context metadata file to keep the AI agent in sync
  files.push({
    path: "/.PROMPT.md",
    content: `# YBNY Studio Project Metadata\n\nTitle: ${title}\nLast Synced: ${new Date(timestamp).toISOString()}\nSource: ybny.net\nStatus: Synced with Visual Studio\n`,
    updatedAt: timestamp,
  });

  return files;
};

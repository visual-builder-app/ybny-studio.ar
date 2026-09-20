import { z } from "zod";

/** Wire records used by OSW Studio's VFS; dates are serialized ISO strings. */
export const ybnyVirtualFileSchema = z.object({
  id: z.string().min(1).max(200),
  projectId: z.string().min(1).max(200),
  path: z
    .string()
    .min(2)
    .max(1000)
    .refine(
      (path) =>
        path.startsWith("/") &&
        !path.includes("\\") &&
        !/[\u0000-\u001f\u007f]/.test(path) &&
        !path
          .slice(1)
          .split("/")
          .some((part) => part === "" || part === "." || part === ".."),
      "Unsafe virtual file path"
    ),
  name: z.string().min(1).max(200),
  type: z.enum([
    "html",
    "css",
    "js",
    "json",
    "text",
    "template",
    "image",
    "video",
    "audio",
    "font",
    "binary",
  ]),
  content: z.string(),
  mimeType: z.string().min(1).max(200),
  size: z.number().int().nonnegative(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  metadata: z.record(z.string(), z.unknown()),
  _isBinaryBase64: z.boolean().optional(),
});

export type YbnyVirtualFile = z.infer<typeof ybnyVirtualFileSchema>;
export type YbnySyncDirection = "to_ai" | "from_ai" | "bidirectional";
export type YbnyProjectMapping = {
  studioProjectId: string;
  aiWorkspaceId: string;
  aiProjectId: string;
  lastSyncedAt?: number;
};
export type YbnySyncPayload = {
  mapping: YbnyProjectMapping;
  direction: YbnySyncDirection;
  files?: YbnyVirtualFile[];
  html?: string;
  css?: string;
};
export type YbnySyncResult = {
  success: boolean;
  syncedFilesCount: number;
  direction: YbnySyncDirection;
  timestamp: number;
  error?: string;
};

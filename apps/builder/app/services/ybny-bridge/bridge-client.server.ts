import { z } from "zod";
import {
  ybnyVirtualFileSchema,
  type YbnyVirtualFile,
  type YbnySyncResult,
} from "./types";

export type BridgeClientConfig = {
  /** Trusted server configuration, never a URL taken from a browser request. */
  aiBaseUrl?: string;
  /** A per-user OSW session. Not a shared API key; never expose it to the canvas. */
  sessionToken?: string;
  timeoutMs?: number;
};

const MAX_BODY_BYTES = 4 * 1024 * 1024;
const filesSchema = z.array(ybnyVirtualFileSchema).max(500);
const identifierSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);
class BridgeError extends Error {}

const readJson = async (response: Response): Promise<unknown> => {
  if (
    !response.headers
      .get("content-type")
      ?.toLowerCase()
      .includes("application/json")
  ) {
    throw new BridgeError("Bridge response is not JSON");
  }
  const reader = response.body?.getReader();
  if (!reader) throw new BridgeError("Bridge response is empty");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new BridgeError("Bridge response exceeds the transfer limit");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new BridgeError("Bridge returned invalid JSON");
  }
};

const validateFiles = (
  input: unknown,
  projectId: string
): YbnyVirtualFile[] => {
  const parsed = filesSchema.safeParse(input);
  if (!parsed.success) throw new BridgeError("Invalid VFS file records");
  const paths = new Set<string>();
  for (const file of parsed.data) {
    if (file.projectId !== projectId || paths.has(file.path)) {
      throw new BridgeError("File project mismatch or duplicate path");
    }
    paths.add(file.path);
  }
  return parsed.data;
};

/**
 * Manual server-side file exchange only. The legacy receiver has no revision/CAS
 * or atomic batch guarantee. Do not connect this client to automatic save events.
 */
export class YbnyBridgeClient {
  private readonly baseUrl: string;
  private readonly sessionToken?: string;
  private readonly timeoutMs: number;

  constructor(config: BridgeClientConfig = {}) {
    const url = new URL(config.aiBaseUrl ?? "https://ybnyai.com");
    const loopback =
      url.hostname === "127.0.0.1" || url.hostname === "localhost";
    if (
      (url.protocol !== "https:" && !(loopback && url.protocol === "http:")) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/"
    ) {
      throw new BridgeError(
        "Bridge requires a trusted HTTPS origin or local test server"
      );
    }
    this.baseUrl = url.origin;
    this.sessionToken = config.sessionToken;
    this.timeoutMs = config.timeoutMs ?? 15000;
    if (
      !Number.isInteger(this.timeoutMs) ||
      this.timeoutMs < 1 ||
      this.timeoutMs > 60000
    ) {
      throw new BridgeError("Invalid bridge timeout");
    }
  }

  private endpoint(workspaceId: string, projectId: string) {
    if (
      !identifierSchema.safeParse(workspaceId).success ||
      !identifierSchema.safeParse(projectId).success
    ) {
      throw new BridgeError("Invalid project or workspace identifier");
    }
    return `/api/w/${encodeURIComponent(workspaceId)}/sync/files`;
  }

  private async request(path: string, body?: string): Promise<unknown> {
    if (!this.sessionToken || !/^[A-Za-z0-9._~-]+$/.test(this.sessionToken)) {
      throw new BridgeError(
        "An authenticated per-user OSW session is required"
      );
    }
    try {
      const response = await fetch(this.baseUrl + path, {
        method: body === undefined ? "GET" : "POST",
        redirect: "error",
        signal: AbortSignal.timeout(this.timeoutMs),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Cookie: `osw_session=${this.sessionToken}`,
        },
        ...(body === undefined ? {} : { body }),
      });
      if (!response.ok)
        throw new BridgeError(
          `Bridge request rejected (HTTP ${response.status})`
        );
      return await readJson(response);
    } catch (error) {
      if (error instanceof BridgeError) throw error;
      throw new BridgeError("Bridge request failed or timed out");
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const data = z
        .object({ authenticated: z.literal(true) })
        .safeParse(await this.request("/api/auth/check"));
      return data.success;
    } catch {
      return false;
    }
  }

  async pullFiles({
    workspaceId,
    projectId,
  }: {
    workspaceId: string;
    projectId: string;
  }): Promise<{ files: YbnyVirtualFile[] }> {
    const path = this.endpoint(workspaceId, projectId);
    const data = z
      .object({ files: z.unknown() })
      .safeParse(
        await this.request(`${path}?projectId=${encodeURIComponent(projectId)}`)
      );
    if (!data.success) throw new BridgeError("Invalid VFS pull response");
    return { files: validateFiles(data.data.files, projectId) };
  }

  async pushFiles({
    workspaceId,
    projectId,
    files,
    replace = false,
  }: {
    workspaceId: string;
    projectId: string;
    files: YbnyVirtualFile[];
    replace?: boolean;
  }): Promise<YbnySyncResult> {
    try {
      const path = this.endpoint(workspaceId, projectId);
      if (replace)
        throw new BridgeError("Destructive project replacement is disabled");
      const validated = validateFiles(files, projectId);
      if (!validated.length)
        throw new BridgeError("An empty transfer is not a write");
      if (
        validated.some(
          (file) =>
            file.path === "/.PROMPT.md" || file.path.startsWith("/.skills/")
        )
      ) {
        throw new BridgeError(
          "AI instructions and skills must not be overwritten by the bridge"
        );
      }
      const body = JSON.stringify({
        projectId,
        files: validated,
        replace: false,
      });
      if (Buffer.byteLength(body) > MAX_BODY_BYTES)
        throw new BridgeError("Bridge payload exceeds the transfer limit");
      const acknowledgement = z
        .object({
          success: z.literal(true),
          count: z.literal(validated.length),
        })
        .safeParse(await this.request(path, body));
      if (!acknowledgement.success)
        throw new BridgeError("Invalid file-sync acknowledgement");
      const stored = new Map(
        (await this.pullFiles({ workspaceId, projectId })).files.map((file) => [
          file.path,
          file,
        ])
      );
      if (
        validated.some((file) => {
          const saved = stored.get(file.path);
          return (
            saved?.content !== file.content ||
            saved?.mimeType !== file.mimeType ||
            saved?.size !== file.size
          );
        })
      )
        throw new BridgeError(
          "Transferred files could not be verified; inspect the destination before retrying"
        );
      return {
        success: true,
        syncedFilesCount: validated.length,
        direction: "to_ai",
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        syncedFilesCount: 0,
        direction: "to_ai",
        timestamp: Date.now(),
        error:
          error instanceof BridgeError
            ? error.message
            : "Bridge transfer failed",
      };
    }
  }
}

// Unauthenticated by design. A validated project binding must supply its own session.
export const defaultBridgeClient = new YbnyBridgeClient();

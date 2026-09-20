import type { YbnyVirtualFile, YbnySyncResult } from "./types";

export type BridgeClientConfig = {
  aiBaseUrl?: string;
  authToken?: string;
};

const DEFAULT_AI_BASE_URL = "https://ybnyai.com";

export class YbnyBridgeClient {
  private readonly baseUrl: string;
  private readonly authToken?: string;

  constructor(config: BridgeClientConfig = {}) {
    this.baseUrl = (config.aiBaseUrl || process.env.YBNY_AI_URL || DEFAULT_AI_BASE_URL).replace(/\/$/, "");
    this.authToken = config.authToken || process.env.YBNY_BRIDGE_SECRET;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  /**
   * Health-check connectivity with ybnyai.com
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/models`, {
        method: "GET",
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Pulls files for a project from ybnyai.com VFS
   */
  async pullFiles({
    workspaceId,
    projectId,
  }: {
    workspaceId: string;
    projectId: string;
  }): Promise<{ files: YbnyVirtualFile[] }> {
    const url = `${this.baseUrl}/api/w/${workspaceId}/sync/files?projectId=${encodeURIComponent(projectId)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to pull files from ybnyai.com (${response.status}): ${errorText}`);
    }

    const data = await response.json() as { files?: YbnyVirtualFile[] };
    return { files: data.files ?? [] };
  }

  /**
   * Pushes files from ybny.net into ybnyai.com VFS
   */
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
    const url = `${this.baseUrl}/api/w/${workspaceId}/sync/files`;
    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        projectId,
        files,
        replace,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        syncedFilesCount: 0,
        direction: "to_ai",
        timestamp: Date.now(),
        error: `Push failed (${response.status}): ${errorText}`,
      };
    }

    return {
      success: true,
      syncedFilesCount: files.length,
      direction: "to_ai",
      timestamp: Date.now(),
    };
  }
}

export const defaultBridgeClient = new YbnyBridgeClient();

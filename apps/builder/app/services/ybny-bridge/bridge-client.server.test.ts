import { describe, expect, test, vi, beforeEach } from "vitest";
import { YbnyBridgeClient } from "./bridge-client.server";

describe("YbnyBridgeClient", () => {
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    mockFetch.mockReset();
  });

  test("pullFiles queries the workspace files endpoint and parses JSON", async () => {
    const client = new YbnyBridgeClient({ aiBaseUrl: "https://test.ybnyai.com" });
    const mockFiles = [
      { path: "/index.html", content: "<h1>Hello</h1>" },
      { path: "/styles/main.css", content: "body { margin: 0; }" },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ files: mockFiles }),
    });

    const result = await client.pullFiles({
      workspaceId: "ws-123",
      projectId: "proj-456",
    });

    expect(result.files).toEqual(mockFiles);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://test.ybnyai.com/api/w/ws-123/sync/files?projectId=proj-456",
      expect.objectContaining({ method: "GET" })
    );
  });

  test("pushFiles posts files payload to ybnyai.com VFS API", async () => {
    const client = new YbnyBridgeClient({ aiBaseUrl: "https://test.ybnyai.com" });
    const files = [{ path: "/index.html", content: "<h1>Updated</h1>" }];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const result = await client.pushFiles({
      workspaceId: "ws-123",
      projectId: "proj-456",
      files,
      replace: false,
    });

    expect(result.success).toBe(true);
    expect(result.syncedFilesCount).toBe(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://test.ybnyai.com/api/w/ws-123/sync/files",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          projectId: "proj-456",
          files,
          replace: false,
        }),
      })
    );
  });
});

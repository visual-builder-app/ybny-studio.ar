import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { YbnyBridgeClient } from "./bridge-client.server";
import { convertExportToAiFiles } from "./bridge-converter.server";

const files = convertExportToAiFiles({
  projectId: "proj-456",
  html: "<h1>يبني</h1>",
});
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const target = { workspaceId: "ws-123", projectId: "proj-456" };
let mockFetch: ReturnType<typeof vi.fn>;
const client = () =>
  new YbnyBridgeClient({
    aiBaseUrl: "https://ybnyai.com",
    sessionToken: "synthetic-test-session",
  });

beforeEach(() => {
  mockFetch = vi.fn();
  vi.stubGlobal("fetch", mockFetch);
});
afterEach(() => vi.unstubAllGlobals());

describe("YbnyBridgeClient contract", () => {
  test("uses the session authentication actually accepted by the workspace API", async () => {
    mockFetch.mockResolvedValueOnce(json({ files }));
    expect((await client().pullFiles(target)).files).toEqual(files);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://ybnyai.com/api/w/ws-123/sync/files?projectId=proj-456",
      expect.objectContaining({
        redirect: "error",
        headers: expect.objectContaining({
          Cookie: "osw_session=synthetic-test-session",
        }),
      })
    );
  });

  test("checks an authenticated session, not the public model-list endpoint", async () => {
    mockFetch.mockResolvedValueOnce(json({ authenticated: true }));
    expect(await client().checkHealth()).toBe(true);
    expect(mockFetch.mock.calls[0][0]).toBe(
      "https://ybnyai.com/api/auth/check"
    );
  });

  test("does not report rejected JSON as a successful push", async () => {
    mockFetch.mockResolvedValueOnce(json({ success: false, count: 0 }));
    expect((await client().pushFiles({ ...target, files })).success).toBe(
      false
    );
  });

  test("reads the stored files back before reporting success", async () => {
    mockFetch.mockResolvedValueOnce(
      json({ success: true, count: files.length })
    );
    mockFetch.mockResolvedValueOnce(json({ files }));
    expect((await client().pushFiles({ ...target, files })).success).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(JSON.parse(mockFetch.mock.calls[0][1].body).replace).toBe(false);
  });

  test("does not report success when acknowledged files were not stored", async () => {
    mockFetch.mockResolvedValueOnce(
      json({ success: true, count: files.length })
    );
    mockFetch.mockResolvedValueOnce(json({ files: [] }));
    expect((await client().pushFiles({ ...target, files })).success).toBe(
      false
    );
  });

  test("refuses destructive whole-project replacement", async () => {
    mockFetch.mockResolvedValueOnce(
      json({ success: true, count: files.length })
    );
    expect(
      (await client().pushFiles({ ...target, files, replace: true })).success
    ).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("rejects files belonging to another project before sending", async () => {
    expect(
      (
        await client().pushFiles({
          ...target,
          files: [{ ...files[0], projectId: "other-project" }],
        })
      ).success
    ).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("rejects malformed pull responses instead of inventing an empty project", async () => {
    mockFetch.mockResolvedValueOnce(json({ files: "not-an-array" }));
    await expect(client().pullFiles(target)).rejects.toThrow();
  });

  test("rejects traversal paths before any network request", async () => {
    expect(
      (
        await client().pushFiles({
          ...target,
          files: [{ ...files[0], path: "/../private.txt" }],
        })
      ).success
    ).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("requires explicit authentication and never falls back to a shared bearer secret", async () => {
    mockFetch.mockResolvedValueOnce(
      json({ success: true, count: files.length })
    );
    expect(
      (await new YbnyBridgeClient().pushFiles({ ...target, files })).success
    ).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("reports a network failure without echoing untrusted server errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("private-response-marker"));
    const result = await client().pushFiles({ ...target, files });
    expect(result.success).toBe(false);
    expect(result.error).not.toContain("private-response-marker");
  });
});

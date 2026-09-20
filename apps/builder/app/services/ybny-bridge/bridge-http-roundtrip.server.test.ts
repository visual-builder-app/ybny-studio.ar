import { randomBytes, randomUUID } from "node:crypto";
import { describe, expect, test } from "vitest";
import { YbnyBridgeClient } from "./bridge-client.server";
import {
  convertAiHtmlToFragment,
  convertExportToAiFiles,
} from "./bridge-converter.server";

const origin = process.env.YBNY_BRIDGE_TEST_ORIGIN;
// Opt-in only: this fixture creates isolated test data, never production data.
describe.runIf(origin !== undefined)(
  "bridge against a real local OSW server",
  () => {
    test("writes, reads and updates real VFS files while preserving AI instructions", async () => {
      if (!origin || !/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
        throw new Error("A loopback-only OSW test server is required");
      }
      const post = (path: string, body: unknown, cookie = "") =>
        fetch(origin + path, {
          method: "POST",
          redirect: "error",
          headers: {
            "Content-Type": "application/json",
            Origin: origin,
            Cookie: cookie,
          },
          body: JSON.stringify(body),
        });
      const registration = await post("/api/auth/register", {
        email: `bridge-${randomUUID()}@example.invalid`,
        password: randomBytes(32).toString("base64url"),
        displayName: "YBNY bridge integration fixture",
      });
      expect(registration.status).toBe(200);
      const account = (await registration.json()) as {
        defaultWorkspaceId: string;
      };
      const workspaceId = account.defaultWorkspaceId;
      const cookie = registration.headers.get("set-cookie")!.split(";")[0];
      const sessionToken = cookie.slice(cookie.indexOf("=") + 1);
      const projectId = randomUUID();
      const now = new Date().toISOString();
      const endpoint = `/api/w/${workspaceId}/sync/files`;
      const created = await post(
        `/api/w/${workspaceId}/sync/projects`,
        {
          project: {
            id: projectId,
            name: "يبني — اختبار تبادل محلي",
            createdAt: now,
            updatedAt: now,
            settings: { runtime: "static" },
          },
        },
        cookie
      );
      expect(created.status).toBe(200);
      const instruction = "Original user instructions — تعليماتي لا تتغير";
      const seeded = await post(
        endpoint,
        {
          projectId,
          replace: false,
          files: [
            {
              id: randomUUID(),
              projectId,
              path: "/.PROMPT.md",
              name: ".PROMPT.md",
              type: "text",
              content: instruction,
              mimeType: "text/plain",
              size: Buffer.byteLength(instruction),
              createdAt: now,
              updatedAt: now,
              metadata: {},
            },
          ],
        },
        cookie
      );
      expect(seeded.status).toBe(200);

      const client = new YbnyBridgeClient({ aiBaseUrl: origin, sessionToken });
      const files = convertExportToAiFiles({
        projectId,
        html: "<!doctype html><html lang=ar dir=rtl><head><title>يبني</title></head><body><h1 class=bridge-heading>مرحبا من الاستوديو المرئي</h1></body></html>",
        css: ".bridge-heading { color: rgb(12, 34, 56); }",
        title: "اختبار محلي",
      });
      const pushed = await client.pushFiles({ workspaceId, projectId, files });
      expect(pushed.success, pushed.error).toBe(true);
      let pulled = await client.pullFiles({ workspaceId, projectId });
      expect(
        pulled.files.find((file) => file.path === "/.PROMPT.md")?.content
      ).toBe(instruction);
      expect(
        pulled.files.find((file) => file.path === "/index.html")?.content
      ).toContain("مرحبا من الاستوديو المرئي");
      expect(
        pulled.files.find((file) => file.path === "/styles/theme.css")?.content
      ).toContain("rgb(12, 34, 56)");
      const styledFragment = await convertAiHtmlToFragment(
        pulled.files.find((file) => file.path === "/index.html")!.content,
        pulled.files.find((file) => file.path === "/styles/theme.css")!.content
      );
      expect(
        styledFragment.styles.some((style) => style.property === "color")
      ).toBe(true);
      // An AI-side file edit through the real endpoint, with no AI API expenditure.
      const index = pulled.files.find((file) => file.path === "/index.html")!;
      const updated = await post(
        endpoint,
        {
          projectId,
          replace: false,
          files: [
            {
              ...index,
              content: "<section><h2>تعديل من الاستوديو الذكي</h2></section>",
              updatedAt: new Date().toISOString(),
            },
          ],
        },
        cookie
      );
      expect(updated.status).toBe(200);
      pulled = await client.pullFiles({ workspaceId, projectId });
      const fragment = await convertAiHtmlToFragment(
        pulled.files.find((file) => file.path === "/index.html")!.content
      );
      expect(JSON.stringify(fragment.instances)).toContain(
        "تعديل من الاستوديو الذكي"
      );
      expect(
        pulled.files.find((file) => file.path === "/.PROMPT.md")?.content
      ).toBe(instruction);
      const anonymous = await fetch(
        `${origin}${endpoint}?projectId=${encodeURIComponent(projectId)}`
      );
      expect(anonymous.status).toBe(401);
      console.log(
        JSON.stringify({
          localServer: origin,
          projectId,
          workspaceId,
          filesRead: pulled.files.length,
          importedInstances: fragment.instances.length,
          instructionsPreserved: true,
          anonymousRejected: true,
        })
      );
    }, 90000);
  }
);

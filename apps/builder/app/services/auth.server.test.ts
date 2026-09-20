import { beforeEach, expect, test, vi } from "vitest";

// Test-only configuration: never read the developer or production credentials.
const authEnv = vi.hoisted(() => ({
  DEV_LOGIN: "true",
  AUTH_SECRET: "configured-test-secret-not-for-deployment" as string | undefined,
}));
const createOrLoginWithDev = vi.hoisted(() => vi.fn());

vi.mock("~/env/env.server", () => ({ default: authEnv }));
vi.mock("~/env/env.static.server", () => ({ staticEnv: {} }));
vi.mock("~/shared/db", () => ({ user: { createOrLoginWithDev } }));
vi.mock("~/shared/db/user.server", () => ({ getUserById: vi.fn() }));
vi.mock("~/shared/context.server", () => ({
  createContext: async () => ({ authorization: { type: "anonymous" } }),
}));
vi.mock("./builder-auth.server", () => ({
  builderAuthenticator: { isAuthenticated: vi.fn() },
}));

import { authenticator } from "./auth.server";

const authenticate = (secret: string) =>
  authenticator.authenticate(
    "dev",
    new Request("https://example.com/auth/dev", {
      method: "POST",
      body: new URLSearchParams({ secret, email: "owner@example.com" }),
    })
  );

beforeEach(() => {
  authEnv.AUTH_SECRET = "configured-test-secret-not-for-deployment";
  createOrLoginWithDev.mockReset().mockResolvedValue({ id: "test-user" });
});

test.each(["ybny2026", "admin", "123456", "incorrect-secret", ""])(
  "rejects unconfigured login credential %# before accessing the database",
  async (secret) => {
    await expect(authenticate(secret)).rejects.toThrow("Secret is incorrect");
    expect(createOrLoginWithDev).not.toHaveBeenCalled();
  }
);

test("accepts only the configured server credential", async () => {
  await expect(authenticate(authEnv.AUTH_SECRET!)).resolves.toMatchObject({
    userId: "test-user",
  });
  expect(createOrLoginWithDev).toHaveBeenCalledWith(
    expect.anything(),
    "owner@example.com"
  );
});

test.each([undefined, ""])(
  "fails closed when the server credential is not configured (%#)",
  async (configuredSecret) => {
    authEnv.AUTH_SECRET = configuredSecret;
    await expect(authenticate("")).rejects.toThrow("Secret is incorrect");
    expect(createOrLoginWithDev).not.toHaveBeenCalled();
  }
);

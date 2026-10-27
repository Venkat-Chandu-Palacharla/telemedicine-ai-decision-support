import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("production JWT secret configuration", () => {
  it.each([
    ["missing", undefined],
    ["too short", "short-secret"],
    ["development placeholder", "dev-secret-change-me"],
    ["Compose placeholder", "change-me-to-a-long-random-secret"],
  ])("rejects a %s JWT secret", async (_description, secret) => {
    vi.stubEnv("NODE_ENV", "production");
    if (secret === undefined) {
      vi.stubEnv("JWT_SECRET", "");
    } else {
      vi.stubEnv("JWT_SECRET", secret);
    }

    await expect(import("../src/config/env.js")).rejects.toThrow(
      "Configure a strong, unique JWT_SECRET",
    );
  });

  it("accepts an explicitly supplied strong JWT secret", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("JWT_SECRET", "test-only-strong-secret-value-1234567890");

    const { env } = await import("../src/config/env.js");

    expect(env.jwtSecret).toBe("test-only-strong-secret-value-1234567890");
  });
});

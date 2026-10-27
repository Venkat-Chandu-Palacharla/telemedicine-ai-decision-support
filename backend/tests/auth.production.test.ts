import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("production authentication", () => {
  it("rejects demo login in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("JWT_SECRET", "test-only-strong-secret-value-1234567890");
    vi.resetModules();

    const { createApp } = await import("../src/app.js");
    const response = await request(createApp())
      .post("/api/auth/login")
      .send({ email: "admin@demo.com", password: "demo1234" });

    expect(response.status).toBe(503);
    expect(response.body.error).toBe("Demo login is disabled in production.");
    expect(response.body.token).toBeUndefined();
  });
});

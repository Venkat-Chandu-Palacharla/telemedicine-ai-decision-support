import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      ENABLE_RATE_LIMIT: "false",
      JWT_SECRET: "test-secret",
    },
    coverage: {
      reporter: ["text", "json", "html"],
    },
  },
});

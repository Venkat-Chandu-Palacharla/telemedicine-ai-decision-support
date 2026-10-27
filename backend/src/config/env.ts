import "dotenv/config";

const NODE_ENV = process.env.NODE_ENV ?? "development";
const rawJwtSecret = process.env.JWT_SECRET;
const DEFAULT_SECRET = "dev-secret-change-me";
const unsafeProductionSecrets = new Set([
  DEFAULT_SECRET,
  "change-me-to-a-long-random-secret",
]);

if (
  NODE_ENV === "production" &&
  (!rawJwtSecret ||
    rawJwtSecret.trim().length < 32 ||
    unsafeProductionSecrets.has(rawJwtSecret.trim().toLowerCase()))
) {
  throw new Error(
    "FATAL: Configure a strong, unique JWT_SECRET of at least 32 characters for production."
  );
}

const JWT_SECRET = rawJwtSecret ?? DEFAULT_SECRET;

if (JWT_SECRET === DEFAULT_SECRET) {
  console.warn("[env] WARNING: Using the default dev JWT_SECRET. Set JWT_SECRET for any non-local deployment.");
}

export const env = {
  port: Number(process.env.PORT ?? 8080),
  nodeEnv: NODE_ENV,
  jwtSecret: JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "2h",
  databaseUrl: process.env.DATABASE_URL,
  mongoUri: process.env.MONGODB_URI,
  // Security: rate limiting is enabled by default and disabled only in test mode.
  enableRateLimit: (process.env.ENABLE_RATE_LIMIT ?? "true") === "true",
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
};

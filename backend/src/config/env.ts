import "dotenv/config";

const NODE_ENV = process.env.NODE_ENV ?? "development";
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const DEFAULT_SECRET = "dev-secret-change-me";

// Security: fail fast in production if the default JWT secret is still in use.
// The default secret is only acceptable for local development / tests.
if (NODE_ENV === "production" && JWT_SECRET === DEFAULT_SECRET) {
  throw new Error(
    "FATAL: JWT_SECRET is not set. Refusing to start in production with the default development secret. " +
      "Set a strong, unique JWT_SECRET environment variable."
  );
}
if (JWT_SECRET === DEFAULT_SECRET) {
  // Non-production warning (dev/test) so the default is never silently used in prod.
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


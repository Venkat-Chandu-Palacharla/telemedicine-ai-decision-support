import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { swaggerSpec } from "./swagger/swagger.js";
import healthRouter from "./routes/health.js";
import predictRouter from "./routes/predict.js";
import authRouter from "./routes/auth.js";
import { authRequired, requireRole } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// Sanitized request logger: redacts the Authorization header (JWT) so tokens
// are never written to logs. Body content is not logged.
const sanitizedLogTokens: morgan.FormatFn = (tokens, req, res) => {
  const method = tokens.method(req, res) ?? "";
  const url = tokens.url(req, res) ?? "";
  const status = tokens.status(req, res) ?? "";
  const responseTime = tokens["response-time"](req, res) ?? "";
  const remoteAddr = tokens["remote-addr"](req, res) ?? "";
  const authHeader = req.headers.authorization;
  const authSummary = authHeader ? "Bearer [REDACTED]" : "none";
  return `${method} ${url} ${status} ${responseTime}ms ${remoteAddr} auth=${authSummary}`;
};

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins }));
  app.use(express.json({ limit: "1mb" }));
  app.set("trust proxy", 1);
  app.use(morgan(sanitizedLogTokens));

  // API Documentation (Swagger / OpenAPI)
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "TeleMedicine AI Decision-Support API",
  }));
  app.get("/api-docs.json", (_req, res) => res.json(swaggerSpec));

  // Public routes
  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);

  // Protected prediction routes (JWT + RBAC)
  // All authenticated roles may request a prediction for themselves.
  app.use("/api/predict", authRequired, predictRouter);

  // Example RBAC-protected route demonstrating role-based access control.
  app.get("/api/admin/only", authRequired, requireRole("admin"), (_req, res) => {
    res.status(200).json({ message: "Admin access granted", role: _req.user?.role });
  });
  app.get("/api/doctor/only", authRequired, requireRole("doctor", "admin"), (_req, res) => {
    res.status(200).json({ message: "Doctor access granted", role: _req.user?.role });
  });

  app.get("/", (_req, res) => {
    res.status(200).json({
      name: "TeleMedicine AI Decision-Support API",
      docs: "/api-docs",
      health: "/api/health",
      predict: "/api/predict",
      disclaimer:
        "Decision-support only. Not a substitute for professional medical diagnosis.",
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;

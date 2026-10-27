import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { UserRole } from "../types/roles.js";
import { validateBody } from "../middleware/validate.js";
import { HttpError } from "../utils/httpError.js";

const router = Router();

/**
 * Demo login endpoint for issuing role-scoped JWTs.
 *
 * This mirrors the Supabase RBAC model (patient/doctor/admin). In production,
 * this endpoint would be replaced by Supabase Auth or an identity provider.
 * It exists here so the API layer is independently testable and demonstrates
 * role-based access control (RBAC) on protected endpoints.
 *
 * Security:
 * - Rate-limited to mitigate brute-force / credential-stuffing.
 * - Passwords are stored as bcrypt hashes (never plaintext).
 * - Credentials are validated server-side; role escalation via the body is
 *   rejected when a known demo account exists (server-side role wins).
 */

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["patient", "doctor", "admin"]).default("patient"),
  name: z.string().optional(),
});

// Demo user store (in-memory; bcrypt hashes of the demo password "demo1234")
// In production, replace with a real user store + password hashes in DB.
const DEMO_PASSWORD_HASH = "$2b$10$KGt.MkRmfTX2v3WUVwSYYuHy2DPpL.xcqQ3olbNszC8Zmzl1iBKP.";

const demoUsers: Record<string, { name: string; role: UserRole; passwordHash: string }> = {
  "patient@demo.com": { name: "Demo Patient", role: "patient", passwordHash: DEMO_PASSWORD_HASH },
  "doctor@demo.com": { name: "Demo Doctor", role: "doctor", passwordHash: DEMO_PASSWORD_HASH },
  "admin@demo.com": { name: "Demo Admin", role: "admin", passwordHash: DEMO_PASSWORD_HASH },
};

// Rate limit login attempts (e.g. max 10 per 15 minutes per IP).
// Disabled in test mode to avoid flaky rate-limit failures during CI.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !env.enableRateLimit,
  message: { error: "Too many login attempts. Please try again later." },
});

router.post("/login", loginLimiter, validateBody(loginSchema), async (req, res, next) => {
  try {
    if (env.nodeEnv === "production") {
      throw new HttpError(503, "Demo login is disabled in production.");
    }

    const { email, password, role, name } = req.body;
    const sanitizedEmail = email.trim().toLowerCase();
    const account = demoUsers[sanitizedEmail];

    if (!account) {
      // Unknown account -> reject. Do not reveal whether the account exists.
      throw new HttpError(401, "Invalid email or password");
    }

    const passwordOk = await bcrypt.compare(password, account.passwordHash);
    if (!passwordOk) {
      throw new HttpError(401, "Invalid email or password");
    }

    // Server-side role wins; never trust a client-supplied role for an existing account.
    const actualRole = account.role;

    const payload = {
      sub: sanitizedEmail,
      email: sanitizedEmail,
      role: actualRole,
      name: account.name ?? name ?? "Demo User",
    };

    const token = jwt.sign(payload, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
    });

    res.status(200).json({
      token,
      user: payload,
      expiresIn: env.jwtExpiresIn,
      note: "Demo credentials. Available: patient@demo.com, doctor@demo.com, admin@demo.com (password: demo1234).",
    });
  } catch (err) {
    next(err);
  }
});

export default router;

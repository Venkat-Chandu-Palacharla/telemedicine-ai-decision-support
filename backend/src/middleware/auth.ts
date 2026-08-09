import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AuthUser, UserRole } from "../types/roles.js";
import { HttpError } from "../utils/httpError.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authRequired(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Authentication required: missing Bearer token"));
  }

  const token = header.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthUser;
    req.user = payload;
    return next();
  } catch {
    return next(new HttpError(401, "Invalid or expired token"));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, "Authentication required"));
    }
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, "Access denied: insufficient role"));
    }
    return next();
  };
}

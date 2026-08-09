import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/httpError.js";
import { ZodError } from "zod";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Route not found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
      details: err.details,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
    });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({
    error: "An unexpected error occurred. Please try again later.",
  });
}

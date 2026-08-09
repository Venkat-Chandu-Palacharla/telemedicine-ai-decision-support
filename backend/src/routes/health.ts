import { Router, Response } from "express";
import { env } from "../config/env.js";

const router = Router();

router.get("/", (_req, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "telemed-ai-backend",
    version: "1.0.0",
    mode: env.nodeEnv,
    timestamp: new Date().toISOString(),
    decisionSupportNote:
      "This API is a decision-support tool. Outputs are heuristic probability estimates, not medical diagnoses.",
  });
});

router.get("/diseases", (_req, res: Response) => {
  res.status(200).json({
    diseases: [
      { id: "heart-disease", name: "Heart Disease", endpoint: "/api/predict/heart" },
      { id: "diabetes", name: "Diabetes", endpoint: "/api/predict/diabetes" },
      { id: "hypertension", name: "Hypertension", endpoint: "/api/predict/hypertension" },
      { id: "parkinsons", name: "Parkinson's (research)", endpoint: "/api/predict/parkinsons" },
      { id: "mental-health", name: "Mental Health Wellbeing", endpoint: "/api/predict/mental-health" },
    ],
  });
});

export default router;


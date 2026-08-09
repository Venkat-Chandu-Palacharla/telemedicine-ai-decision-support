import { Router } from "express";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { computePrediction } from "../engine/heuristicEngine.js";
import { validateBody } from "../middleware/validate.js";
import { predictSchema, healthParamsSchema, mentalHealthSchema, parkinsonsSchema } from "../schemas/prediction.js";
import { HttpError } from "../utils/httpError.js";
import { env } from "../config/env.js";

const router = Router();

// Rate limit predictions to protect the API from abuse (enabled unless in test).
const predictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !env.enableRateLimit,
  message: { error: "Too many prediction requests. Please slow down." },
});

// Attach a deterministic prediction id for patient history tracking.
function withPredictionId<T>(result: T): T & { predictionId: string } {
  return { ...result, predictionId: crypto.randomUUID() };
}

/**
 * POST /api/predict
 * Compute a heuristic risk estimate for a given disease using validated parameters.
 */
router.post("/", predictLimiter, validateBody(predictSchema), (req, res) => {
  const { diseaseType, parameters } = req.body;
  const result = computePrediction(diseaseType, parameters);
  res.status(200).json(withPredictionId(result));
});

/**
 * POST /api/predict/heart
 * Convenience endpoint for heart disease with a structured body.
 */
router.post("/heart", validateBody(healthParamsSchema), (req, res) => {
  const p = req.body;
  const result = computePrediction("heart-disease", {
    age: p.age,
    systolic: p.bloodPressureSystolic,
    diastolic: p.bloodPressureDiastolic,
    glucose: p.bloodGlucose,
    bmi: p.bmi,
    cholesterol: p.cholesterol,
    heartRate: p.heartRate,
  });
  res.status(200).json(result);
});

/**
 * POST /api/predict/diabetes
 */
router.post("/diabetes", validateBody(healthParamsSchema), (req, res) => {
  const p = req.body;
  const result = computePrediction("diabetes", {
    glucose: p.bloodGlucose,
    bmi: p.bmi,
    age: p.age,
    systolic: p.bloodPressureSystolic,
    diastolic: p.bloodPressureDiastolic,
    cholesterol: p.cholesterol,
  });
  res.status(200).json(result);
});

/**
 * POST /api/predict/hypertension
 */
router.post("/hypertension", validateBody(healthParamsSchema), (req, res) => {
  const p = req.body;
  const result = computePrediction("hypertension", {
    systolic: p.bloodPressureSystolic,
    diastolic: p.bloodPressureDiastolic,
    age: p.age,
    bmi: p.bmi,
    glucose: p.bloodGlucose,
  });
  res.status(200).json(result);
});

/**
 * POST /api/predict/parkinsons
 * Research/educational voice-acoustic proxy screening.
 */
router.post("/parkinsons", validateBody(parkinsonsSchema), (req, res) => {
  const result = computePrediction("parkinsons", req.body);
  res.status(200).json(result);
});

/**
 * POST /api/predict/mental-health
 * Supportive wellbeing screening.
 */
router.post("/mental-health", validateBody(mentalHealthSchema), (req, res) => {
  const input = req.body;
  const result = computePrediction("mental-health", {
    stress: input.stressLevel,
    anxiety: input.anxietyLevel,
    sleep: input.sleepHours,
    mood: input.moodRating,
  });
  res.status(200).json(result);
});

router.all("/", () => {
  throw new HttpError(405, "Method not allowed. Use POST /api/predict.");
});

export default router;


import {
  DiseaseType,
  HealthParameters,
  PredictionResponse,
  RiskLevel,
  FactorImpact,
  MentalHealthInput,
} from "../types/prediction.js";
import { diseaseConfigs, factorActivation, DiseaseConfig } from "../models/diseaseConfig.js";
import { HttpError } from "../utils/httpError.js";

export interface EngineInput {
  diseaseType: DiseaseType;
  parameters: Record<string, number>;
}

/**
 * Heuristic (rule-based) inference engine.
 *
 * This returns a deterministic heuristic risk score for decision-support purposes.
 * It is deterministic, fully testable, and does not require training data or an
 * external model. It is NOT a trained statistical model. Once trained ML models
 * are produced by the Python pipeline (ml/), this engine can be swapped for a
 * model export without changing the API contract.
 */

const DISCLAIMER =
  "This system is a decision-support tool. The default engine produces a deterministic risk score (a heuristic estimate), NOT a statistically calibrated probability and NOT a medical diagnosis. Always consult a qualified healthcare professional.";

function riskLevelFromPct(pct: number): RiskLevel {
  if (pct < 40) return "Low";
  if (pct < 70) return "Moderate";
  return "High";
}

function presentFactors(input: Record<string, number>, config: DiseaseConfig) {
  const presentPct =
    config.factors.length === 0
      ? 1
      : config.factors.filter((f) => input[f.id] !== undefined).length / config.factors.length;
  if (presentPct >= 0.8) return "complete";
  if (presentPct >= 0.5) return "partial";
  return "minimal";
}

export function computePrediction(diseaseType: DiseaseType, input: Record<string, number>): PredictionResponse {
  const config = diseaseConfigs[diseaseType];
  if (!config) {
    throw new HttpError(400, `Unsupported disease type: ${diseaseType}`);
  }

  // Weighted sum of factor activations
  let weightedSum = 0;
  let totalWeight = 0;
  const factorImpacts: FactorImpact[] = [];

  for (const rule of config.factors) {
    const value = input[rule.id];
    if (value === undefined) continue;
    const act = factorActivation(value, rule);
    const contribution = act * rule.weight;
    weightedSum += contribution;
    totalWeight += rule.weight;

    const impact = contribution > 0.6 * rule.weight ? "negative" : contribution < 0.4 * rule.weight ? "positive" : "neutral";
    factorImpacts.push({
      name: rule.label,
      impact,
      contribution: Math.round(act * 100),
    });
  }

  if (totalWeight === 0) {
    throw new HttpError(400, "No valid parameters provided for risk calculation.");
  }

  // Normalize to fraction of maximum contribution, then squash to a score with a sigmoid.
  const normalized = weightedSum / totalWeight;
  const { k, x0 } = config.sigmoid;
  const sigmoidScore = 1 / (1 + Math.exp(-k * (normalized - x0)));
  let riskPercentage = Math.round(Math.max(5, Math.min(95, sigmoidScore * 100)));

  // Apply deterministic heuristic bounds so extreme and low-risk parameter
  // sets resolve to distinct risk tiers. These are not statistical calibration.
  if (normalized >= 0.7) riskPercentage = Math.max(riskPercentage, 70);
  if (normalized >= 0.9) riskPercentage = Math.max(riskPercentage, 85);
  if (normalized <= 0.33) riskPercentage = Math.min(riskPercentage, 40);
  if (normalized <= 0.2) riskPercentage = Math.min(riskPercentage, 25);

  const riskLevel = riskLevelFromPct(riskPercentage);

  const completeness = presentFactors(input, config);
  const confidence = config.confidenceByCompleteness[completeness];

  const sortedFactors = [...factorImpacts].sort((a, b) => b.contribution - a.contribution);

return {
    diseaseType,
    riskScore: riskPercentage / 100,
    riskPercentage,
    riskLevel,
    confidence,
    factors: sortedFactors,
    recommendations: config.recommendations,
    model: {
      name: config.modelName,
      family: config.family,
      methodology: config.methodology,
      calibrated: false,
    },
    warnings:
      riskLevel === "High"
        ? ["Elevated risk signal — this is not a diagnosis. Seek professional evaluation promptly."]
        : completeness === "minimal"
        ? ["Limited parameters provided — confidence is reduced. Interpret cautiously."]
        : [],
    disclaimer: DISCLAIMER,
  };
}

// ---------- Convenience adapters for each disease ----------

export function predictHeart(params: HealthParameters): PredictionResponse {
  const input: Record<string, number> = {
    age: params.age,
    systolic: params.bloodPressureSystolic,
    diastolic: params.bloodPressureDiastolic,
    glucose: params.bloodGlucose,
    bmi: params.bmi,
  };
  if (params.cholesterol !== undefined) input.cholesterol = params.cholesterol;
  if (params.heartRate !== undefined) input.heartRate = params.heartRate;
  return computePrediction("heart-disease", input);
}

export function predictDiabetes(params: HealthParameters): PredictionResponse {
  const input: Record<string, number> = {
    glucose: params.bloodGlucose,
    bmi: params.bmi,
    age: params.age,
    systolic: params.bloodPressureSystolic,
    diastolic: params.bloodPressureDiastolic,
  };
  if (params.cholesterol !== undefined) input.cholesterol = params.cholesterol;
  return computePrediction("diabetes", input);
}

export function predictHypertension(params: HealthParameters): PredictionResponse {
  return computePrediction("hypertension", {
    systolic: params.bloodPressureSystolic,
    diastolic: params.bloodPressureDiastolic,
    age: params.age,
    bmi: params.bmi,
    glucose: params.bloodGlucose,
  });
}

export function predictParkinsons(params: Record<string, number>): PredictionResponse {
  return computePrediction("parkinsons", params);
}

export function predictMentalHealth(input: MentalHealthInput): PredictionResponse {
  return computePrediction("mental-health", {
    stress: input.stressLevel,
    anxiety: input.anxietyLevel,
    sleep: input.sleepHours,
    mood: input.moodRating,
  });
}

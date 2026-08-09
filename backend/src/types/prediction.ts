export type DiseaseType = "heart-disease" | "diabetes" | "parkinsons" | "hypertension" | "mental-health";

export type RiskLevel = "Low" | "Moderate" | "High";

export interface HealthParameters {
  age: number;
  bmi: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  bloodGlucose: number;
  cholesterol?: number;
  heartRate?: number;
}

export interface MentalHealthInput {
  stressLevel: number;
  anxietyLevel: number;
  sleepHours: number;
  moodRating: number;
}

export interface FactorImpact {
  name: string;
  impact: "positive" | "negative" | "neutral";
  contribution: number;
}

export interface PredictionResponse {
  diseaseType: DiseaseType;
  /**
   * Deterministic heuristic risk score (0-1).
   *
   * IMPORTANT: This is NOT a statistically calibrated probability. It is a
   * rule-based, deterministic risk score produced by the default heuristic
   * engine for decision-support purposes. Once a trained, calibrated ML model
   * is integrated (see ml/), this field may be relabeled `riskProbability`
   * with model.calibrated = true.
   */
  riskScore: number;
  riskPercentage: number;
  riskLevel: RiskLevel;
  confidence: number; // 0-100 based on parameter completeness/validity
  factors: FactorImpact[];
  recommendations: string[];
  model: {
    name: string;
    family: string;
    methodology: string;
    /** false for the heuristic engine; true once a trained, calibrated model is used. */
    calibrated: boolean;
  };
  warnings: string[];
  disclaimer: string;
  /** Identifier for persisting/storing this prediction in a history store. */
  predictionId?: string;
}


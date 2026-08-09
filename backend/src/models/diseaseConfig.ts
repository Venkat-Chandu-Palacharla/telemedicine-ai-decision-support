import { DiseaseType } from "../types/prediction.js";

export interface FactorRule {
  id: string;
  label: string;
  // A factor can contribute with continuous value mapping or discrete.
  // We use sigmoid-like scoring based on a threshold.
  threshold: number;
  weight: number;
  direction: "higher" | "lower"; // which side increases risk
  severityBands?: { [key: string]: string };
}

export interface DiseaseConfig {
  id: DiseaseType;
  name: string;
  description: string;
  modelName: string;
  family: string;
  methodology: string;
  referenceStudy: string;
  factors: FactorRule[];
  // Sigmoid steepness (k) and midpoint (x0) for risk aggregation
  sigmoid: { k: number; x0: number };
  confidenceByCompleteness: { complete: number; partial: number; minimal: number };
  recommendations: string[];
}

// Normalize each factor contribution into a 0-1 "activation" using a
// bounded relationship based on threshold and direction.
function activation(value: number, rule: FactorRule): number {
  const diff = value - rule.threshold;
  const t = rule.direction === "higher" ? diff / Math.max(1, rule.threshold) : -diff / Math.max(1, rule.threshold);
  // bounded logistic-like transform to [0,1]
  return 1 / (1 + Math.exp(-3 * t));
}

export function factorActivation(value: number, rule: FactorRule): number {
  return activation(value, rule);
}

export const diseaseConfigs: Record<DiseaseType, DiseaseConfig> = {
  "heart-disease": {
    id: "heart-disease",
    name: "Heart Disease",
    description: "Cardiovascular disease risk based on established clinical indicators.",
    modelName: "Heuristic Cardiac Risk Index",
    family: "Clinical scoring (rule-based, calibrated)",
methodology:
      "Weighted physiological indicators (age, blood pressure, glucose, BMI, cholesterol, heart rate) aggregated via a calibrated logistic score. Output is a deterministic heuristic risk score for decision support, not a statistically calibrated probability and not a clinical diagnosis.",
    referenceStudy: "Based on Framingham-style and Cleveland/UCI risk factor weighting.",
    sigmoid: { k: 1.6, x0: 0.62 },
    confidenceByCompleteness: { complete: 88, partial: 72, minimal: 55 },
    factors: [
      { id: "age", label: "Age", threshold: 55, weight: 0.22, direction: "higher" },
      { id: "systolic", label: "Systolic BP", threshold: 130, weight: 0.2, direction: "higher" },
      { id: "diastolic", label: "Diastolic BP", threshold: 85, weight: 0.12, direction: "higher" },
      { id: "glucose", label: "Blood Glucose", threshold: 110, weight: 0.18, direction: "higher" },
      { id: "bmi", label: "BMI", threshold: 27, weight: 0.12, direction: "higher" },
      { id: "cholesterol", label: "Cholesterol", threshold: 200, weight: 0.1, direction: "higher" },
      { id: "heartRate", label: "Resting Heart Rate", threshold: 90, weight: 0.06, direction: "higher" },
    ],
    recommendations: [
      "Consult a physician for a full cardiovascular assessment.",
      "Monitor blood pressure and blood glucose regularly.",
      "Maintain a heart-healthy diet low in saturated fat and sodium.",
      "Engage in moderate aerobic exercise at least 150 minutes per week.",
      "If a high-risk score is returned, prioritize an in-person cardiology evaluation.",
    ],
  },
  diabetes: {
    id: "diabetes",
    name: "Diabetes",
    description: "Type 2 diabetes risk based on glycemic and metabolic indicators.",
    modelName: "Heuristic Glycemic Risk Index",
    family: "Clinical scoring (rule-based, calibrated)",
methodology:
      "Weighted glycemic and metabolic indicators (glucose, BMI, blood pressure, age) aggregated via a calibrated logistic score. Output is a deterministic heuristic risk score for decision support, not a statistically calibrated probability and not a diagnostic result.",
    referenceStudy: "Based on Pima Indians Diabetes and ADA risk-factor weighting.",
    sigmoid: { k: 1.8, x0: 0.6 },
    confidenceByCompleteness: { complete: 90, partial: 74, minimal: 58 },
    factors: [
      { id: "glucose", label: "Fasting Glucose", threshold: 110, weight: 0.32, direction: "higher" },
      { id: "bmi", label: "BMI", threshold: 27, weight: 0.22, direction: "higher" },
      { id: "age", label: "Age", threshold: 50, weight: 0.16, direction: "higher" },
      { id: "systolic", label: "Systolic BP", threshold: 130, weight: 0.16, direction: "higher" },
      { id: "diastolic", label: "Diastolic BP", threshold: 85, weight: 0.08, direction: "higher" },
      { id: "cholesterol", label: "Cholesterol", threshold: 200, weight: 0.06, direction: "higher" },
    ],
    recommendations: [
      "See a physician for a fasting blood test (HbA1c / glucose).",
      "Manage carbohydrate intake and maintain a balanced diet.",
      "If you are overweight, work toward gradual, sustainable weight loss.",
      "Exercise regularly for at least 30 minutes daily to improve insulin sensitivity.",
    ],
  },
  parkinsons: {
    id: "parkinsons",
    name: "Parkinson's Disease",
    description: "Screening signal for Parkinson's based on voice/motor biomarkers (research/educational).",
    modelName: "Heuristic Voice Biomarker Index",
    family: "Acoustic proxy scoring (rule-based, exploratory)",
    methodology:
      "This module is research/educational. It aggregates hypothetical vocal-acoustic proxy indicators. Output is a heuristic screening signal only and is NOT a substitute for a neurological diagnosis.",
    referenceStudy: "Informed by the Oxford Parkinson's vocal dataset; exploratory only.",
    sigmoid: { k: 1.5, x0: 0.6 },
    confidenceByCompleteness: { complete: 70, partial: 60, minimal: 45 },
    factors: [
      { id: "voiceJitter", label: "Voice Jitter (proxy)", threshold: 0.007, weight: 0.3, direction: "higher" },
      { id: "voiceShimmer", label: "Voice Shimmer (proxy)", threshold: 0.03, weight: 0.26, direction: "higher" },
      { id: "hnrProxy", label: "Harmonics-to-Noise (proxy)", threshold: 18, weight: 0.24, direction: "lower" },
      { id: "age", label: "Age", threshold: 60, weight: 0.2, direction: "higher" },
    ],
    recommendations: [
      "Note that this is a voice-acoustic screening proxy with significant uncertainty.",
      "If you notice persistent tremor, rigidity, or voice changes, consult a neurologist.",
      "Keep a symptom diary (tremor, stiffness, balance) before an in-person visit.",
      "This module is exploratory and should not be used for self-diagnosis.",
    ],
  },
  hypertension: {
    id: "hypertension",
    name: "Hypertension",
    description: "Blood pressure risk based on systolic/diastolic measures and supporting indicators.",
    modelName: "Heuristic Blood Pressure Index",
    family: "Clinical scoring (rule-based, calibrated)",
methodology:
      "Aggregates systolic and diastolic blood pressure with age, BMI, and glucose using a calibrated logistic score. Output is a deterministic heuristic risk score for decision support only, not a statistically calibrated probability.",
    referenceStudy: "Informed by ACC/AHA hypertension staging.",
    sigmoid: { k: 2.0, x0: 0.55 },
    confidenceByCompleteness: { complete: 89, partial: 73, minimal: 56 },
    factors: [
      { id: "systolic", label: "Systolic BP", threshold: 120, weight: 0.34, direction: "higher" },
      { id: "diastolic", label: "Diastolic BP", threshold: 80, weight: 0.22, direction: "higher" },
      { id: "age", label: "Age", threshold: 55, weight: 0.2, direction: "higher" },
      { id: "bmi", label: "BMI", threshold: 27, weight: 0.16, direction: "higher" },
      { id: "glucose", label: "Blood Glucose", threshold: 115, weight: 0.08, direction: "higher" },
    ],
    recommendations: [
      "If readings are persistently elevated, schedule an in-person blood pressure evaluation.",
      "Reduce sodium intake and increase potassium-rich foods.",
      "Monitor blood pressure at the same time each day and keep a log.",
      "Manage stress and maintain a healthy weight.",
    ],
  },
  "mental-health": {
    id: "mental-health",
    name: "Mental Health Wellbeing",
    description: "Wellbeing screening based on stress, anxiety, sleep, and mood indicators.",
    modelName: "Heuristic Wellbeing Index",
    family: "Composite wellbeing scoring (rule-based, supportive)",
    methodology:
      "Aggregates self-reported stress, anxiety, sleep, and mood into a wellbeing composite. Output is supportive screening info, not a mental health diagnosis.",
    referenceStudy: "Informed by self-report screening instruments.",
    sigmoid: { k: 1.7, x0: 0.6 },
    confidenceByCompleteness: { complete: 86, partial: 70, minimal: 54 },
    factors: [
      { id: "stress", label: "Stress Level /10", threshold: 6, weight: 0.28, direction: "higher" },
      { id: "anxiety", label: "Anxiety Level /10", threshold: 6, weight: 0.28, direction: "higher" },
      { id: "sleep", label: "Sleep Hours", threshold: 7, weight: 0.24, direction: "lower" },
      { id: "mood", label: "Mood Rating /10", threshold: 6, weight: 0.2, direction: "lower" },
    ],
    recommendations: [
      "If your score is elevated, consider speaking with a counselor or general practitioner.",
      "Practice consistent sleep hygiene (regular schedule, no screens before bed).",
      "Include daily physical activity and mindfulness or breathing exercises.",
      "Reach out to trusted friends or family; do not cope alone.",
      "If thoughts of self-harm arise, contact emergency services or a crisis line immediately.",
    ],
  },
};

export const diseaseList = Object.values(diseaseConfigs).map((c) => ({
  id: c.id,
  name: c.name,
  description: c.description,
}));


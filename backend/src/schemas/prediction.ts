import { z } from "zod";

export const healthParamsSchema = z
  .object({
    age: z.number().min(0).max(150),
    bmi: z.number().min(10).max(100),
    bloodPressureSystolic: z.number().min(60).max(250),
    bloodPressureDiastolic: z.number().min(30).max(150),
    bloodGlucose: z.number().min(30).max(600),
    cholesterol: z.number().min(80).max(400).optional(),
    heartRate: z.number().min(30).max(220).optional(),
  })
  .strict();

export const mentalHealthSchema = z
  .object({
    stressLevel: z.number().min(0).max(10),
    anxietyLevel: z.number().min(0).max(10),
    sleepHours: z.number().min(0).max(24),
    moodRating: z.number().min(0).max(10),
  })
  .strict();

export const parkinsonsSchema = z
  .object({
    age: z.number().min(0).max(150),
    voiceJitter: z.number().min(0).max(1),
    voiceShimmer: z.number().min(0).max(1),
    hnrProxy: z.number().min(0).max(50),
  })
  .strict();

export const predictSchema = z
  .object({
    diseaseType: z.enum(["heart-disease", "diabetes", "hypertension", "parkinsons", "mental-health"]),
    parameters: z.record(z.number()),
  })
  .strict();

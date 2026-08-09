export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface DiseaseType {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface HealthParameters {
  age: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  bloodGlucose: number;
  bmi: number;
  cholesterol?: number;
  heartRate?: number;
}

export interface PredictionResult {
  diseaseType: string;
  riskScore: number;
  riskPercentage: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  confidence: number;
  rocAuc: number;
  recommendations: string[];
  factors: { name: string; impact: 'positive' | 'negative' | 'neutral' }[];
  modelComparison: {
    model: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    rocAuc: number;
  }[];
}

export interface MentalHealthInput {
  stressLevel: number;
  anxietyLevel: number;
  sleepHours: number;
  moodRating: number;
}

export interface MentalHealthResult {
  status: 'Good' | 'Moderate Concern' | 'High Concern';
  score: number;
  recommendations: string[];
  insights: string[];
}

export interface VitalSigns {
  heartRate: number;
  spo2: number;
  temperature: number;
  bloodPressure: { systolic: number; diastolic: number };
  timestamp: Date;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  rating: number;
  experience: number;
  available: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  type: 'video' | 'in-person';
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  instructions: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

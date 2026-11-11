// src/types.ts
import { isAxiosError } from 'axios';

export type User = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  age?: number | null;
  sex?: string;
  diet_type?: string;
  smoking_history?: string;
};

export type Advice = {
  short?: string;
  avoid?: string[];
  do?: string[];
  prevention?: string[];
  nutrition?: { recommended?: string[]; avoid?: string[] };
  urgent?: boolean;
  notes?: string;
};

export type Explanation = {
  method: string;
  top_contributors: { feature: string; contribution: number }[];
};

export type PredictionResult = {
  prediction: string;
  confidence: number;
  explanation?: Explanation | null;
  matchedSymptoms?: string[];
  unrecognizedSymptoms?: string[];
  historyId?: string;
  advice?: Advice | null;
};

export type HistoryItem = {
  _id: string;
  prediction: string;
  confidence: number;
  explanation?: Explanation | null;
  advice?: Advice | null;
  createdAt: string;
  form?: {
    age?: number;
    sex?: string;
    diet_type?: string;
    smoking_history?: string;
    physical_activity?: string;
    symptoms_text?: string;
  };
};

// Options that match the categories the ML model was trained on.
export const DIET_OPTIONS = ['Healthy', 'Average', 'Unhealthy'];
export const ACTIVITY_OPTIONS = [
  { value: 'Rarely', label: 'Rarely (low activity)' },
  { value: 'Occasional', label: 'Occasional (moderate activity)' },
  { value: 'Regular', label: 'Regular (high activity)' },
];
export const SMOKING_OPTIONS = ['Never', 'Former', 'Current'];
export const SEX_OPTIONS = ['Female', 'Male', 'Other'];

export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (isAxiosError(err)) {
    const msg = (err.response?.data as { message?: string } | undefined)?.message;
    if (msg) return msg;
    if (!err.response) return 'Cannot reach the server. Is the backend running?';
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}

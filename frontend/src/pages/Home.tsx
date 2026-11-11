// src/pages/Home.tsx
import React, { useState } from "react";
import { Activity } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import AdviceCards from "../components/AdviceCards";
import ExplanationList from "../components/ExplanationList";
import {
  ACTIVITY_OPTIONS,
  DIET_OPTIONS,
  SEX_OPTIONS,
  SMOKING_OPTIONS,
  getErrorMessage,
  type PredictionResult,
} from "../types";

const KNOWN_SYMPTOMS = [
  "Back Pain", "Bleeding Gums", "Blurred Vision", "Body Ache", "Chest Pain",
  "Cold Hands", "Cough", "Dizziness", "Fatigue", "Fever",
  "Frequent Urination", "Headache", "High Fever", "Increased Thirst",
  "Irregular Heartbeat", "Itching", "Joint Pain", "Loss of Smell",
  "Nausea", "Pale Skin", "Rash", "Shortness of Breath", "Slow Healing",
  "Sore Throat", "Sweating", "Swelling", "Weakness", "Weight Loss",
];

const inputClass =
  "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500";

export default function Home() {
  const { user } = useAuth();

  // Pre-fill from the saved profile where the values are valid for the model.
  const [form, setForm] = useState(() => ({
    age: user?.age != null ? String(user.age) : "",
    sex: SEX_OPTIONS.includes(user?.sex ?? "") ? user!.sex! : "",
    diet_type: DIET_OPTIONS.includes(user?.diet_type ?? "") ? user!.diet_type! : "",
    smoking_history: SMOKING_OPTIONS.includes(user?.smoking_history ?? "") ? user!.smoking_history! : "",
    physical_activity: "",
    symptoms: "",
  }));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PredictionResult | null>(null);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addSymptom = (symptom: string) => {
    const current = form.symptoms
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (current.some((s) => s.toLowerCase() === symptom.toLowerCase())) return;
    handleChange("symptoms", [...current, symptom].join(", "));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const { data } = await api.post<PredictionResult>("/prediction", { features: form });
      setResult(data);
    } catch (err) {
      setError(getErrorMessage(err, "Prediction failed"));
    } finally {
      setLoading(false);
    }
  };

  const confidencePct = Math.round((result?.confidence ?? 0) * 100);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-8">
          <Activity className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Health Symptom Checker</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">Age *</label>
              <input
                id="age"
                type="number"
                min={1}
                max={120}
                value={form.age}
                onChange={(e) => handleChange("age", e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-2">Sex *</label>
              <select id="sex" value={form.sex} onChange={(e) => handleChange("sex", e.target.value)} className={inputClass} required>
                <option value="">Select sex</option>
                {SEX_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="diet" className="block text-sm font-medium text-gray-700 mb-2">Diet Quality *</label>
              <select id="diet" value={form.diet_type} onChange={(e) => handleChange("diet_type", e.target.value)} className={inputClass} required>
                <option value="">Select diet quality</option>
                {DIET_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="smoking" className="block text-sm font-medium text-gray-700 mb-2">Smoking History *</label>
              <select id="smoking" value={form.smoking_history} onChange={(e) => handleChange("smoking_history", e.target.value)} className={inputClass} required>
                <option value="">Select smoking history</option>
                {SMOKING_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="activity" className="block text-sm font-medium text-gray-700 mb-2">Physical Activity *</label>
              <select id="activity" value={form.physical_activity} onChange={(e) => handleChange("physical_activity", e.target.value)} className={inputClass} required>
                <option value="">Select activity</option>
                {ACTIVITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-2">Symptoms *</label>
            <textarea
              id="symptoms"
              value={form.symptoms}
              onChange={(e) => handleChange("symptoms", e.target.value)}
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="Separate symptoms with commas, e.g. Fever, Cough, Headache"
              required
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {KNOWN_SYMPTOMS.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => addSymptom(s)}
                  className="text-xs px-2 py-1 rounded-full border border-gray-300 text-gray-600 hover:bg-blue-50 hover:border-blue-300"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Predict Health"}
          </button>
        </form>

        {result && (
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Prediction Result</h2>
            <p className="text-lg text-gray-900 mb-3">
              🧠 Predicted Condition: <strong>{result.prediction}</strong>
            </p>

            <div className="w-full bg-gray-200 rounded h-3 mb-2">
              <div className="h-3 rounded bg-green-500" style={{ width: `${confidencePct}%` }} />
            </div>
            <p className="text-sm text-gray-700 mb-2">Confidence: {confidencePct}%</p>

            {!!result.matchedSymptoms?.length && (
              <p className="text-sm text-gray-700">
                Symptoms used: {result.matchedSymptoms.join(", ")}
              </p>
            )}
            {!!result.unrecognizedSymptoms?.length && (
              <p className="text-sm text-amber-700">
                Not recognised (ignored): {result.unrecognizedSymptoms.join(", ")}
              </p>
            )}

            <ExplanationList explanation={result.explanation} />
            {result.advice && <AdviceCards advice={result.advice} />}
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Disclaimer:</strong> This AI prediction is for educational purposes only.
            Always consult a licensed healthcare professional for a medical diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
}

// Bolt/src/pages/Home.tsx
import React, { useState } from "react";
import { Activity } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    age: "",
    sex: "",
    diet_type: "",
    smoking_history: "",
    physical_activity: "",
    symptoms: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [success, setSuccess] = useState("");

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setSuccess("");
    setLoading(true);

    try {
      const { data } = await api.post("/prediction", { features: form });
      console.log("✅ Prediction Result:", data);
      setResult(data);
      setSuccess("Prediction completed successfully!");
    } catch (err: any) {
      console.error("❌ Prediction Error:", err);
      setError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-8">
          <Activity className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Health Symptom Checker
          </h1>
        </div>

        {/* --- Form --- */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age *
              </label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => handleChange("age", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Sex */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sex *
              </label>
              <select
                value={form.sex}
                onChange={(e) => handleChange("sex", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select sex</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Diet Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diet Type *
              </label>
              <select
                value={form.diet_type}
                onChange={(e) => handleChange("diet_type", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select diet type</option>
                <option value="Healthy">Healthy</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Non-Vegetarian">Non-Vegetarian</option>
                <option value="Vegan">Vegan</option>
              </select>
            </div>

            {/* Smoking History */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Smoking History *
              </label>
              <select
                value={form.smoking_history}
                onChange={(e) => handleChange("smoking_history", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select smoking history</option>
                <option value="Never">Never</option>
                <option value="Former">Former</option>
                <option value="Current">Current</option>
              </select>
            </div>

            {/* Physical Activity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Physical Activity *
              </label>
              <select
                value={form.physical_activity}
                onChange={(e) =>
                  handleChange("physical_activity", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select activity</option>
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Symptoms *
            </label>
            <textarea
              value={form.symptoms}
              onChange={(e) => handleChange("symptoms", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
              placeholder="Describe your symptoms (e.g., Fever, Cough, Headache)..."
              required
            />
          </div>

          {/* Error + Success */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Predict Health"}
          </button>
        </form>

        {/* --- Prediction Result Section --- */}
        {result && (
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Prediction Result
            </h2>

            <p className="text-lg text-gray-900 mb-3">
              🧠 Predicted Disease: <strong>{result.prediction}</strong>
            </p>

            {/* Confidence Bar */}
            <div className="w-full bg-gray-200 rounded h-3 mb-2">
              <div
                className="h-3 rounded bg-green-500"
                style={{
                  width: `${Math.round((result.confidence || 0) * 100)}%`,
                }}
              />
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Confidence: {Math.round((result.confidence || 0) * 100)}%
            </p>

            {/* ✅ Card-Based Advice Section */}
            {result.advice && (
              <div className="mt-8 space-y-4">
                <h3 className="font-semibold text-lg text-gray-800">
                  🩺 Health Guidance
                </h3>
                <p className="text-gray-700">{result.advice.short}</p>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ⚠️ Avoid */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
                    <h4 className="text-red-700 font-semibold mb-2">
                      ⚠️ Things to Avoid
                    </h4>
                    <ul className="list-disc ml-5 text-sm text-red-800 space-y-1">
                      {result.advice.avoid?.length
                        ? result.advice.avoid.map((a: string, i: number) => (
                            <li key={i}>{a}</li>
                          ))
                        : <li>—</li>}
                    </ul>
                  </div>

                  {/* ✅ Do’s */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
                    <h4 className="text-green-700 font-semibold mb-2">
                      ✅ Recommended Actions
                    </h4>
                    <ul className="list-disc ml-5 text-sm text-green-800 space-y-1">
                      {result.advice.do?.length
                        ? result.advice.do.map((d: string, i: number) => (
                            <li key={i}>{d}</li>
                          ))
                        : <li>—</li>}
                    </ul>
                  </div>

                  {/* 🛡️ Prevention */}
                  {result.advice.prevention?.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm md:col-span-2">
                      <h4 className="text-blue-700 font-semibold mb-2">
                        🛡️ Prevention Tips
                      </h4>
                      <ul className="list-disc ml-5 text-sm text-blue-800 space-y-1">
                        {result.advice.prevention.map(
                          (p: string, i: number) => <li key={i}>{p}</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* 🥗 Nutrition */}
                  {result.advice.nutrition && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm md:col-span-2">
                      <h4 className="text-yellow-700 font-semibold mb-2">
                        🥗 Nutrition Guide
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium text-yellow-800 text-sm mb-1">
                            Recommended
                          </p>
                          <ul className="list-disc ml-5 text-sm text-yellow-700 space-y-1">
                            {result.advice.nutrition.recommended?.length
                              ? result.advice.nutrition.recommended.map(
                                  (n: string, i: number) => (
                                    <li key={i}>{n}</li>
                                  )
                                )
                              : <li>—</li>}
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium text-yellow-800 text-sm mb-1">
                            Avoid
                          </p>
                          <ul className="list-disc ml-5 text-sm text-yellow-700 space-y-1">
                            {result.advice.nutrition.avoid?.length
                              ? result.advice.nutrition.avoid.map(
                                  (n: string, i: number) => (
                                    <li key={i}>{n}</li>
                                  )
                                )
                              : <li>—</li>}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes & Urgent */}
                {result.advice.notes && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                    🩶 {result.advice.notes}
                  </div>
                )}
                {result.advice.urgent && (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-3 font-semibold text-red-700">
                    🚨 Seek medical attention immediately if symptoms worsen.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Disclaimer:</strong> This AI prediction is for educational
            purposes only. Always consult a licensed healthcare professional for
            a medical diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
}

// src/pages/Home.tsx
import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function Home() {
  const { user } = useAuth();

  // form + ML prediction state
  const [form, setForm] = useState({
    sex: 'Female',
    age: 20,
    diet_type: 'Healthy',
    smoking_history: 'Never',
    physical_activity: 'Moderate',
    symptoms: '',
  });

  const [schema, setSchema] = useState<{ feature_order: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [result, setResult] = useState<any>(null);

  // Fetch schema or backend health
  useEffect(() => {
    const fetchSchema = async () => {
      try {
        await api.get('/health'); // Optional health check
        const { data } = await api.get('/ml/schema');
        setSchema(data);
      } catch (err) {
        console.warn('Schema fetch failed:', err);
      }
    };
    fetchSchema();
  }, []);

  // handle form input
  const handleChange = (key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Predict API call
  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data } = await api.post('/prediction', { features: form });
      setResult(data);
      setSuccess('Prediction completed successfully!');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-8">
          <Activity className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Health Symptom Checker</h1>
        </div>

        <form onSubmit={handlePredict} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                id="age"
                type="number"
                value={form.age}
                onChange={(e) => handleChange('age', Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter your age"
                min="1"
                max="120"
                required
              />
            </div>

            <div>
              <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-2">
                Sex <span className="text-red-500">*</span>
              </label>
              <select
                id="sex"
                value={form.sex}
                onChange={(e) => handleChange('sex', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="dietType" className="block text-sm font-medium text-gray-700 mb-2">
                Diet Type
              </label>
              <select
                id="dietType"
                value={form.diet_type}
                onChange={(e) => handleChange('diet_type', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="Healthy">Healthy</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Non-Vegetarian">Non-Vegetarian</option>
                <option value="Vegan">Vegan</option>
              </select>
            </div>

            <div>
              <label htmlFor="smokingHistory" className="block text-sm font-medium text-gray-700 mb-2">
                Smoking History
              </label>
              <select
                id="smokingHistory"
                value={form.smoking_history}
                onChange={(e) => handleChange('smoking_history', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="Never">Never</option>
                <option value="Former">Former</option>
                <option value="Current">Current</option>
              </select>
            </div>

            <div>
              <label htmlFor="physicalActivity" className="block text-sm font-medium text-gray-700 mb-2">
                Physical Activity
              </label>
              <select
                id="physicalActivity"
                value={form.physical_activity}
                onChange={(e) => handleChange('physical_activity', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="Sedentary">Sedentary</option>
                <option value="Moderate">Moderate</option>
                <option value="Active">Active</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-2">
              Symptoms
            </label>
            <textarea
              id="symptoms"
              value={form.symptoms}
              onChange={(e) => handleChange('symptoms', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
              placeholder="Describe your symptoms in detail..."
              rows={6}
            />
          </div>

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
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Predict Health'}
          </button>
        </form>

        {result && (
          <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-xl">
            <h2 className="text-xl font-semibold mb-3">Prediction Result</h2>
            <p className="text-gray-800 mb-3">
              <strong>Disease:</strong> {result.prediction}
            </p>

            {/* Confidence Bar */}
            <div className="w-full bg-gray-200 rounded mb-2">
              <div
                className="h-3 rounded bg-green-500"
                style={{ width: `${Math.round(result.confidence * 100)}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Confidence: {Math.round(result.confidence * 100)}%
            </p>

            {/* Contributors */}
            {result.explanation?.top_contributors && (
              <>
                <h3 className="text-md font-semibold mb-2">Top Contributing Factors:</h3>
                {result.explanation.top_contributors.slice(0, 5).map((c: any) => (
                  <div key={c.feature} className="my-1">
                    <div className="flex justify-between text-sm">
                      <span>{c.feature}</span>
                      <span>{c.weight.toFixed(3)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded">
                      <div
                        className="h-2 rounded bg-blue-500"
                        style={{ width: `${Math.min(Math.abs(c.weight) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Disclaimer:</strong> This is a demo health predictor. Consult a healthcare professional for real advice.
          </p>
        </div>
      </div>
    </div>
  );
}

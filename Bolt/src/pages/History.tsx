// Bolt/src/pages/History.tsx
import React, { useState, useEffect } from "react";
import {
  History as HistoryIcon,
  Calendar,
  User,
  Utensils,
  Cigarette,
  Activity,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

export default function History() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/prediction/history");
        setItems(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading)
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading your prediction history...</p>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-8">
          <HistoryIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Prediction History</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-12">
            <HistoryIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No predictions yet</p>
            <p className="text-gray-500 mt-2">
              Make your first prediction to see it here.
            </p>
          </div>
        ) : (
          <ul>
            {items.map((h) => (
              <li
                key={h._id}
                onClick={() => setSelected(h)}
                className="cursor-pointer border border-gray-200 p-4 my-3 rounded-xl hover:border-blue-400 hover:shadow transition"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="font-medium text-gray-800">
                    {h.prediction || "Unknown Disease"}
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 text-sm">
                    <Calendar className="w-4 h-4" />
                    {formatDate(h.createdAt)}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Confidence: {Math.round((h.confidence ?? 0) * 100)}%
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* --- Modal for details --- */}
        {selected && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-2"
            onClick={() => setSelected(null)}
          >
            <div
              className="bg-white rounded-xl p-6 shadow-lg w-full max-w-lg relative overflow-y-auto max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Prediction Details
              </h2>

              <div className="space-y-4">
                {/* Disease */}
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Disease Predicted:
                  </p>
                  <p className="font-semibold text-blue-700">
                    {selected.prediction}
                  </p>
                </div>

                {/* Confidence */}
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Confidence:
                  </p>
                  <div className="w-full bg-gray-200 rounded">
                    <div
                      className="h-3 rounded bg-green-500"
                      style={{
                        width: `${Math.round((selected.confidence ?? 0) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm mt-1">
                    {Math.round((selected.confidence ?? 0) * 100)}%
                  </p>
                </div>

                {/* Symptoms */}
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Symptoms:
                  </p>
                  <p className="text-gray-700 bg-gray-50 border border-gray-200 p-3 rounded">
                    {selected.form?.symptoms_text?.trim()
                      ? selected.form.symptoms_text
                      : "—"}
                  </p>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <User className="inline-block w-4 h-4 text-gray-500 mr-1" />
                    {selected.form?.sex || "—"}
                  </div>
                  <div>
                    <Utensils className="inline-block w-4 h-4 text-gray-500 mr-1" />
                    {selected.form?.diet_type || "—"}
                  </div>
                  <div>
                    <Activity className="inline-block w-4 h-4 text-gray-500 mr-1" />
                    {selected.form?.physical_activity || "—"}
                  </div>
                  <div>
                    <Cigarette className="inline-block w-4 h-4 text-gray-500 mr-1" />
                    {selected.form?.smoking_history || "—"}
                  </div>
                </div>

                {/* ✅ Advice Section (Card-based layout) */}
                {selected.advice && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      🩺 Health Guidance
                    </h3>
                    <p className="text-gray-700">{selected.advice.short}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* ⚠️ Avoid */}
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
                        <h4 className="text-red-700 font-semibold mb-2">
                          ⚠️ Things to Avoid
                        </h4>
                        <ul className="list-disc ml-5 text-sm text-red-800 space-y-1">
                          {selected.advice.avoid?.length
                            ? selected.advice.avoid.map((a: string, i: number) => (
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
                          {selected.advice.do?.length
                            ? selected.advice.do.map((d: string, i: number) => (
                                <li key={i}>{d}</li>
                              ))
                            : <li>—</li>}
                        </ul>
                      </div>

                      {/* 🛡️ Prevention */}
                      {selected.advice.prevention?.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm md:col-span-2">
                          <h4 className="text-blue-700 font-semibold mb-2">
                            🛡️ Prevention Tips
                          </h4>
                          <ul className="list-disc ml-5 text-sm text-blue-800 space-y-1">
                            {selected.advice.prevention.map(
                              (p: string, i: number) => (
                                <li key={i}>{p}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                      {/* 🥗 Nutrition */}
                      {selected.advice.nutrition && (
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
                                {selected.advice.nutrition.recommended?.length
                                  ? selected.advice.nutrition.recommended.map(
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
                                {selected.advice.nutrition.avoid?.length
                                  ? selected.advice.nutrition.avoid.map(
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

                    {selected.advice.notes && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                        🩶 {selected.advice.notes}
                      </div>
                    )}
                    {selected.advice.urgent && (
                      <div className="bg-red-100 border border-red-300 rounded-lg p-3 font-semibold text-red-700">
                        🚨 Seek medical attention immediately if symptoms worsen.
                      </div>
                    )}
                  </div>
                )}

                {/* Created At */}
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Created At:
                  </p>
                  <p className="text-gray-700">{formatDate(selected.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

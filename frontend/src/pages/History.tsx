// src/pages/History.tsx
import { useEffect, useState } from "react";
import { History as HistoryIcon, Calendar, User, Utensils, Cigarette, Activity } from "lucide-react";
import api from "../lib/api";
import AdviceCards from "../components/AdviceCards";
import ExplanationList from "../components/ExplanationList";
import { getErrorMessage, type HistoryItem } from "../types";

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function History() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .get<HistoryItem[]>("/prediction/history")
      .then(({ data }) => !cancelled && setItems(data))
      .catch((err) => !cancelled && setError(getErrorMessage(err, "Failed to load history")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Close the modal with Escape
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  if (loading)
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading your prediction history...</p>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-8">
          <HistoryIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Prediction History</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
        )}

        {items.length === 0 && !error ? (
          <div className="text-center py-12">
            <HistoryIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No predictions yet</p>
            <p className="text-gray-500 mt-2">Make your first prediction to see it here.</p>
          </div>
        ) : (
          <ul>
            {items.map((h) => (
              <li key={h._id}>
                <button
                  type="button"
                  onClick={() => setSelected(h)}
                  className="w-full text-left border border-gray-200 p-4 my-3 rounded-xl hover:border-blue-400 hover:shadow transition"
                >
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
                    <div className="font-medium text-gray-800">{h.prediction || "Unknown"}</div>
                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                      <Calendar className="w-4 h-4" />
                      {formatDate(h.createdAt)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Confidence: {Math.round((h.confidence ?? 0) * 100)}%
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {selected && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-2"
            onClick={() => setSelected(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Prediction details"
              className="bg-white rounded-xl p-6 shadow-lg w-full max-w-2xl relative overflow-y-auto max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Prediction Details</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Condition Predicted:</p>
                  <p className="font-semibold text-blue-700">{selected.prediction}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Confidence:</p>
                  <div className="w-full bg-gray-200 rounded">
                    <div
                      className="h-3 rounded bg-green-500"
                      style={{ width: `${Math.round((selected.confidence ?? 0) * 100)}%` }}
                    />
                  </div>
                  <p className="text-sm mt-1">{Math.round((selected.confidence ?? 0) * 100)}%</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Symptoms:</p>
                  <p className="text-gray-700 bg-gray-50 border border-gray-200 p-3 rounded">
                    {selected.form?.symptoms_text?.trim() || "—"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div title="Age / Sex">
                    <User className="inline-block w-4 h-4 text-gray-500 mr-1" />
                    {[selected.form?.age, selected.form?.sex].filter(Boolean).join(", ") || "—"}
                  </div>
                  <div title="Diet">
                    <Utensils className="inline-block w-4 h-4 text-gray-500 mr-1" />
                    {selected.form?.diet_type || "—"}
                  </div>
                  <div title="Physical activity">
                    <Activity className="inline-block w-4 h-4 text-gray-500 mr-1" />
                    {selected.form?.physical_activity || "—"}
                  </div>
                  <div title="Smoking history">
                    <Cigarette className="inline-block w-4 h-4 text-gray-500 mr-1" />
                    {selected.form?.smoking_history || "—"}
                  </div>
                </div>

                <ExplanationList explanation={selected.explanation} />
                {selected.advice && <AdviceCards advice={selected.advice} />}

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Created At:</p>
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

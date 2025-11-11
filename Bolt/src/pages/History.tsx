// src/pages/History.tsx
import React, { useState, useEffect } from 'react';
import {
  History as HistoryIcon,
  Calendar,
  User,
  Utensils,
  Cigarette,
  Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function History() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/predictions/history');
        setItems(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
            <p className="text-gray-500 mt-2">Make your first prediction to see it here</p>
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
                    {h.prediction || 'Unknown Disease'}
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

        {/* Modal for selected history item */}
        {selected && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            onClick={() => setSelected(null)}
          >
            <div
              className="bg-white rounded-xl p-6 shadow-lg w-full max-w-lg relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Prediction Details
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Disease Predicted:</p>
                  <p className="font-semibold text-blue-700">{selected.prediction}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Confidence:</p>
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

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Symptoms:</p>
                  <p className="text-gray-700 bg-gray-50 border border-gray-200 p-3 rounded">
                    {selected.features?.symptoms || '—'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <User className="inline-block w-4 h-4 text-gray-500 mr-1" />
                    <span className="font-medium">{selected.features?.sex}</span>
                  </div>
                  <div>
                    <Utensils className="inline-block w-4 h-4 text-gray-500 mr-1" />
                    <span className="font-medium">{selected.features?.diet_type}</span>
                  </div>
                  <div>
                    <Activity className="inline-block w-4 h-4 text-gray-500 mr-1" />
                    <span className="font-medium">{selected.features?.physical_activity}</span>
                  </div>
                  <div>
                    <Cigarette className="inline-block w-4 h-4 text-gray-500 mr-1" />
                    <span className="font-medium">{selected.features?.smoking_history}</span>
                  </div>
                </div>

                {selected.explanation?.top_contributors && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Top Contributors:</p>
                    {selected.explanation.top_contributors.slice(0, 5).map((c: any) => (
                      <div key={c.feature} className="my-1">
                        <div className="flex justify-between text-sm">
                          <span>{c.feature}</span>
                          <span>{c.weight.toFixed(3)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded">
                          <div
                            className="h-2 rounded bg-blue-500"
                            style={{
                              width: `${Math.min(Math.abs(c.weight) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

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

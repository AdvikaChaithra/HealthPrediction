import type { Explanation } from '../types';

export default function ExplanationList({ explanation }: { explanation?: Explanation | null }) {
  const items = explanation?.top_contributors ?? [];
  if (!items.length) return null;

  const isShap = explanation?.method === 'shap';
  const max = Math.max(...items.map((c) => Math.abs(c.contribution)), 1e-9);

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">🔍 Top Contributing Factors</h3>
      <p className="text-xs text-gray-500 mb-3">
        {isShap
          ? 'How much each input pushed the model toward (green) or away from (red) this prediction.'
          : 'Overall feature importance of the model.'}
      </p>
      <ul className="space-y-2">
        {items.map((c) => {
          const width = `${Math.round((Math.abs(c.contribution) / max) * 100)}%`;
          const positive = !isShap || c.contribution >= 0;
          return (
            <li key={c.feature} className="text-sm">
              <div className="flex justify-between text-gray-700">
                <span>{c.feature.replace(/_/g, ': ')}</span>
                <span className="tabular-nums text-gray-500">{c.contribution.toFixed(3)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded h-2">
                <div
                  className={`h-2 rounded ${positive ? 'bg-green-500' : 'bg-red-400'}`}
                  style={{ width }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

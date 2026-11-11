import type { Advice } from '../types';

function List({ items, className }: { items?: string[]; className: string }) {
  return (
    <ul className={`list-disc ml-5 text-sm space-y-1 ${className}`}>
      {items?.length ? items.map((item, i) => <li key={i}>{item}</li>) : <li>—</li>}
    </ul>
  );
}

export default function AdviceCards({ advice }: { advice: Advice }) {
  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">🩺 Health Guidance</h3>
      {advice.short && <p className="text-gray-700">{advice.short}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
          <h4 className="text-red-700 font-semibold mb-2">⚠️ Things to Avoid</h4>
          <List items={advice.avoid} className="text-red-800" />
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
          <h4 className="text-green-700 font-semibold mb-2">✅ Recommended Actions</h4>
          <List items={advice.do} className="text-green-800" />
        </div>

        {!!advice.prevention?.length && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm md:col-span-2">
            <h4 className="text-blue-700 font-semibold mb-2">🛡️ Prevention Tips</h4>
            <List items={advice.prevention} className="text-blue-800" />
          </div>
        )}

        {(!!advice.nutrition?.recommended?.length || !!advice.nutrition?.avoid?.length) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm md:col-span-2">
            <h4 className="text-yellow-700 font-semibold mb-2">🥗 Nutrition Guide</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-yellow-800 text-sm mb-1">Recommended</p>
                <List items={advice.nutrition?.recommended} className="text-yellow-700" />
              </div>
              <div>
                <p className="font-medium text-yellow-800 text-sm mb-1">Avoid</p>
                <List items={advice.nutrition?.avoid} className="text-yellow-700" />
              </div>
            </div>
          </div>
        )}
      </div>

      {advice.notes && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
          📝 {advice.notes}
        </div>
      )}
      {advice.urgent && (
        <div className="bg-red-100 border border-red-300 rounded-lg p-3 font-semibold text-red-700">
          🚨 Seek medical attention immediately if symptoms worsen.
        </div>
      )}
    </div>
  );
}

import type { DonationRecord, DonationCategory } from '../types/donation';
import { CATEGORY_LABELS } from '../types/donation';

interface SummaryProps {
  records: DonationRecord[];
  taxYear: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function Summary({ records, taxYear }: SummaryProps) {
  // Aggregate by category across all records
  const categoryTotals: Partial<Record<DonationCategory, number>> = {};
  let grandTotal = 0;

  for (const record of records) {
    for (const item of record.items) {
      const v = item.quantity * item.unitValue;
      categoryTotals[item.category] = (categoryTotals[item.category] ?? 0) + v;
      grandTotal += v;
    }
  }

  const sorted = Object.entries(categoryTotals).sort(([, a], [, b]) => (b ?? 0) - (a ?? 0));

  return (
    <div className="bg-white border border-irs-200 rounded-lg p-6">
      <h2 className="text-base font-semibold text-irs-800 mb-4 border-b border-irs-100 pb-2">
        {taxYear} Summary
      </h2>

      {sorted.length === 0 ? (
        <p className="text-irs-400 text-sm">No donations yet.</p>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {sorted.map(([cat, total]) => {
              const itemCount = records.reduce(
                (sum, r) => sum + r.items.filter(i => i.category === cat).reduce((s, i) => s + i.quantity, 0),
                0
              );
              return (
                <div key={cat} className="flex justify-between items-center text-sm">
                  <span className="text-irs-600">
                    {CATEGORY_LABELS[cat as DonationCategory]}
                    <span className="text-irs-400 ml-1 text-xs">({itemCount})</span>
                  </span>
                  <span className="font-mono font-medium text-irs-800">
                    {formatCurrency(total ?? 0)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="border-t-2 border-irs-700 pt-3 flex justify-between items-center">
            <span className="font-semibold text-irs-800 text-sm">Total Deduction</span>
            <span className="font-mono font-bold text-xl text-irs-900">{formatCurrency(grandTotal)}</span>
          </div>
          <p className="mt-2 text-xs text-irs-400">
            {records.length} donation{records.length !== 1 ? 's' : ''} to{' '}
            {new Set(records.map(r => r.organization)).size} organization{new Set(records.map(r => r.organization)).size !== 1 ? 's' : ''}
          </p>
        </>
      )}
    </div>
  );
}

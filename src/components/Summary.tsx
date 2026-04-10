import type { Donation, DonationCategory } from '../types/donation';
import { CATEGORY_LABELS } from '../types/donation';

interface SummaryProps {
  donations: Donation[];
  taxYear: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export function Summary({ donations, taxYear }: SummaryProps) {
  const categoryTotals = donations.reduce<Partial<Record<DonationCategory, number>>>(
    (acc, d) => {
      acc[d.category] = (acc[d.category] || 0) + d.estimatedValue;
      return acc;
    },
    {}
  );

  const grandTotal = donations.reduce((sum, d) => sum + d.estimatedValue, 0);
  const sortedCategories = Object.entries(categoryTotals).sort(
    ([, a], [, b]) => (b ?? 0) - (a ?? 0)
  );

  return (
    <div className="bg-white border border-irs-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-irs-800 mb-4 border-b border-irs-100 pb-2">
        Tax Year {taxYear} Summary
      </h2>

      {sortedCategories.length === 0 ? (
        <p className="text-irs-400 text-sm">No donations to summarize.</p>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {sortedCategories.map(([cat, total]) => {
              const count = donations.filter(d => d.category === cat).length;
              return (
                <div key={cat} className="flex justify-between items-center text-sm">
                  <span className="text-irs-600">
                    {CATEGORY_LABELS[cat as DonationCategory]}
                    <span className="text-irs-400 ml-1">({count} item{count !== 1 ? 's' : ''})</span>
                  </span>
                  <span className="font-mono font-medium text-irs-800">
                    {formatCurrency(total ?? 0)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="border-t-2 border-irs-700 pt-3 flex justify-between items-center">
            <span className="font-semibold text-irs-800">Total Deduction</span>
            <span className="font-mono font-bold text-xl text-irs-900">
              {formatCurrency(grandTotal)}
            </span>
          </div>
          <p className="mt-2 text-xs text-irs-400">
            {donations.length} donation{donations.length !== 1 ? 's' : ''} recorded for tax year {taxYear}
          </p>
        </>
      )}
    </div>
  );
}

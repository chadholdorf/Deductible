import { useState } from 'react';
import type { DonationRecord, DonationCategory } from '../types/donation';
import { CATEGORY_LABELS } from '../types/donation';

interface SummaryProps {
  records: DonationRecord[];
  taxYear: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

const TAX_BRACKETS = [
  { rate: 10, label: '10%' },
  { rate: 12, label: '12%' },
  { rate: 22, label: '22%' },
  { rate: 24, label: '24%' },
  { rate: 32, label: '32%' },
  { rate: 35, label: '35%' },
  { rate: 37, label: '37%' },
];

// 2025 standard deduction amounts (used for 2025+ tax years)
const STANDARD_DEDUCTION = {
  single: 15000,
  married: 30000,
};

export function Summary({ records, taxYear }: SummaryProps) {
  const [bracketRate, setBracketRate] = useState(22);

  // Aggregate by category across all records
  const categoryTotals: Partial<Record<DonationCategory, number>> = {};
  let grandTotal = 0;
  let cashTotal = 0;
  let nonCashTotal = 0;
  let maxSingleItemValue = 0;

  for (const record of records) {
    for (const item of record.items) {
      const v = item.quantity * item.unitValue;
      categoryTotals[item.category] = (categoryTotals[item.category] ?? 0) + v;
      grandTotal += v;
      if (item.category === 'cash') {
        cashTotal += v;
      } else {
        nonCashTotal += v;
      }
      // Track single highest-value item (per-unit, not qty * unit)
      if (item.unitValue > maxSingleItemValue) {
        maxSingleItemValue = item.unitValue;
      }
    }
  }

  const sorted = Object.entries(categoryTotals).sort(([, a], [, b]) => (b ?? 0) - (a ?? 0));
  const estimatedSavings = grandTotal * (bracketRate / 100);
  const needsForm8283 = nonCashTotal > 500;
  const needsAppraisal = maxSingleItemValue > 5000;

  return (
    <div className="space-y-4">
      {/* Category Totals */}
      <div className="bg-white border border-irs-200 rounded-lg p-5">
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

            {/* Cash vs Non-cash split */}
            {cashTotal > 0 && nonCashTotal > 0 && (
              <div className="mb-3 pt-2 border-t border-irs-100 space-y-1">
                <div className="flex justify-between text-xs text-irs-500">
                  <span>Cash donations</span>
                  <span className="font-mono">{formatCurrency(cashTotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-irs-500">
                  <span>Non-cash (property)</span>
                  <span className="font-mono">{formatCurrency(nonCashTotal)}</span>
                </div>
              </div>
            )}

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

      {/* Tax Insights */}
      {grandTotal > 0 && (
        <div className="bg-white border border-irs-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-irs-800 mb-3 border-b border-irs-100 pb-2">
            Tax Insights
          </h3>

          {/* Estimated savings */}
          <div className="mb-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-irs-600">Your tax bracket</span>
              <select
                value={bracketRate}
                onChange={e => setBracketRate(Number(e.target.value))}
                className="border border-irs-200 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-irs-400 min-h-[36px]"
              >
                {TAX_BRACKETS.map(b => (
                  <option key={b.rate} value={b.rate}>{b.label}</option>
                ))}
              </select>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-xs text-green-700 mb-1">Estimated Tax Savings</div>
              <div className="text-2xl font-bold font-mono text-green-800">
                {formatCurrency(estimatedSavings)}
              </div>
              <p className="text-xs text-green-600 mt-1">
                {formatCurrency(grandTotal)} &times; {bracketRate}% bracket
              </p>
            </div>
          </div>

          {/* Standard deduction comparison */}
          <div className="mb-4 p-3 bg-irs-50 rounded-lg">
            <div className="text-xs font-medium text-irs-700 mb-1.5">Itemizing vs. Standard Deduction</div>
            <p className="text-xs text-irs-500 leading-relaxed">
              Your charitable donations count only if you <strong>itemize</strong> deductions.
              The {taxYear} standard deduction is ~{formatCurrency(STANDARD_DEDUCTION.single)} (single)
              or ~{formatCurrency(STANDARD_DEDUCTION.married)} (married filing jointly).
              You need total itemized deductions (including mortgage interest, state taxes, etc.)
              to exceed the standard deduction for these to save you money.
            </p>
          </div>

          {/* IRS thresholds & warnings */}
          <div className="space-y-2">
            {needsForm8283 && (
              <div className="flex gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs text-amber-800">
                  <strong>Form 8283 required.</strong> Your non-cash donations
                  ({formatCurrency(nonCashTotal)}) exceed $500. You must file
                  IRS Form 8283 with your return.
                </div>
              </div>
            )}

            {needsAppraisal && (
              <div className="flex gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs text-red-800">
                  <strong>Qualified appraisal needed.</strong> You have an item valued
                  over $5,000. The IRS requires a qualified independent appraisal
                  for single items (or groups of similar items) exceeding $5,000.
                </div>
              </div>
            )}

            {nonCashTotal > 0 && !needsForm8283 && (
              <div className="flex gap-2 p-2.5 bg-irs-50 border border-irs-200 rounded-lg">
                <svg className="w-4 h-4 text-irs-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="text-xs text-irs-600">
                  Non-cash donations under $500. No additional forms required beyond your tax return.
                </div>
              </div>
            )}
          </div>

          <p className="mt-3 text-xs text-irs-400 leading-relaxed">
            Estimates only. Consult a tax professional for advice specific to your situation.
          </p>
        </div>
      )}
    </div>
  );
}

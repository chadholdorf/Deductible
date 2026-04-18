import { useState } from 'react';
import type { DonationRecord, DonationCategory } from '../types/donation';
import { CATEGORY_LABELS } from '../types/donation';

interface SummaryProps {
  records: DonationRecord[];
  taxYear: number;
  bracketRate?: number;
  onBracketChange?: (rate: number) => void;
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

export function Summary({ records, taxYear, bracketRate: bracketRateProp, onBracketChange }: SummaryProps) {
  const [localRate, setLocalRate] = useState(22);
  const bracketRate = bracketRateProp ?? localRate;
  function setBracketRate(v: number) { setLocalRate(v); onBracketChange?.(v); }

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

  // Per-record acknowledgment check: any single donation ≥ $250 needs written receipt
  const recordsNeedingAcknowledgment = records.filter(r => {
    const nonCash = r.items.filter(i => i.category !== 'cash').reduce((s, i) => s + i.quantity * i.unitValue, 0);
    return nonCash >= 250;
  });
  const needsAcknowledgment = recordsNeedingAcknowledgment.length > 0;
  const missingAddress = needsForm8283 && records.filter(r => {
    const nonCash = r.items.filter(i => i.category !== 'cash').reduce((s, i) => s + i.quantity * i.unitValue, 0);
    return nonCash > 0 && !r.organizationAddress;
  }).length > 0;

  return (
    <div className="space-y-4">
      {/* Category Totals */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <h2 className="text-base font-semibold text-irs-800 dark:text-gray-100 mb-4 border-b border-irs-100 dark:border-gray-700 pb-2">
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
                    <span className="font-mono font-medium text-irs-800 dark:text-gray-100">
                      {formatCurrency(total ?? 0)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Cash vs Non-cash split */}
            {cashTotal > 0 && nonCashTotal > 0 && (
              <div className="mb-3 pt-2 border-t border-irs-100 dark:border-gray-700 space-y-1">
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
              <span className="font-semibold text-irs-800 dark:text-gray-100 text-sm">Total Deduction</span>
              <span className="font-mono font-bold text-xl text-irs-900 dark:text-white">{formatCurrency(grandTotal)}</span>
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-irs-800 dark:text-gray-100 mb-3 border-b border-irs-100 dark:border-gray-700 pb-2">
            Tax Insights
          </h3>

          {/* Estimated savings */}
          <div className="mb-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-irs-600">Your tax bracket</span>
              <select
                value={bracketRate}
                onChange={e => setBracketRate(Number(e.target.value))}
                className="border border-irs-200 dark:border-gray-600 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-irs-400 min-h-[36px]"
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
          <div className="mb-4 p-3 bg-irs-50 dark:bg-gray-900/50 rounded-lg">
            <div className="text-xs font-medium text-irs-700 mb-2">Itemizing vs. Standard Deduction</div>
            <div className="text-xs text-irs-600 space-y-2">
              <p>Charitable donations only reduce your taxes if you <strong>itemize</strong> deductions instead of taking the standard deduction.</p>
              <div className="bg-white dark:bg-gray-800 rounded border border-irs-200 dark:border-gray-600 p-2">
                <div className="flex justify-between py-0.5">
                  <span className="text-irs-500">Single filer</span>
                  <span className="font-mono font-medium">~{formatCurrency(STANDARD_DEDUCTION.single)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-irs-500">Married filing jointly</span>
                  <span className="font-mono font-medium">~{formatCurrency(STANDARD_DEDUCTION.married)}</span>
                </div>
              </div>
              <p className="text-irs-500">
                Your total itemized deductions (donations + mortgage interest + state/local taxes + medical expenses)
                need to exceed the standard deduction for itemizing to be worthwhile.
              </p>
              <a
                href="https://www.irs.gov/taxtopics/tc501"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-medium"
              >
                Learn more at IRS.gov
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

          {/* IRS thresholds & warnings */}
          <div className="space-y-2">

            {needsAppraisal && (
              <div className="flex gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs text-red-800">
                  <strong>Qualified appraisal required.</strong> An item is valued over $5,000. The IRS requires a written qualified appraisal and Form 8283 Section B.
                </div>
              </div>
            )}

            {needsForm8283 && (
              <div className="flex gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs text-amber-800">
                  <strong>Form 8283 required.</strong> Non-cash donations ({formatCurrency(nonCashTotal)}) exceed $500 — file IRS Form 8283 with your return. The form requires each charity's name and address.
                  {missingAddress && <span className="block mt-1 font-medium">⚠ Some donations are missing an address — edit them to add it.</span>}
                </div>
              </div>
            )}

            {needsAcknowledgment && (
              <div className="flex gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="text-xs text-blue-800">
                  <strong>Written receipt required.</strong> {recordsNeedingAcknowledgment.length === 1 ? 'A donation' : `${recordsNeedingAcknowledgment.length} donations`} exceed{recordsNeedingAcknowledgment.length === 1 ? 's' : ''} $250. The IRS requires a written acknowledgment from the charity — keep the receipt they gave you at drop-off.
                </div>
              </div>
            )}

            {nonCashTotal > 0 && !needsForm8283 && !needsAcknowledgment && (
              <div className="flex gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="text-xs text-green-700">
                  Non-cash donations are under $250 each. No receipt or additional forms required — just keep this record.
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

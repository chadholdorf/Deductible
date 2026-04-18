import type { DonationRecord } from '../types/donation';
import { CATEGORY_LABELS, CONDITION_LABELS } from '../types/donation';

interface PrintReportProps {
  records: DonationRecord[];
  taxYear: number;
  onClose: () => void;
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-');
  return `${month}/${day}/${year}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
}

export function PrintReport({ records, taxYear, onClose }: PrintReportProps) {
  // Split into cash and non-cash
  const cashRecords: { org: string; address?: string; date: string; items: string; total: number }[] = [];
  const nonCashByOrg: Record<string, { address?: string; dates: { date: string; items: string; total: number }[] }> = {};

  let totalCash = 0;
  let totalNonCash = 0;

  for (const record of [...records].sort((a, b) => a.organization.localeCompare(b.organization) || a.date.localeCompare(b.date))) {
    const cashItems = record.items.filter(i => i.category === 'cash');
    const nonCashItems = record.items.filter(i => i.category !== 'cash');

    // Cash items
    if (cashItems.length > 0) {
      const cashTotal = cashItems.reduce((s, i) => s + i.quantity * i.unitValue, 0);
      totalCash += cashTotal;
      cashRecords.push({
        org: record.organization,
        address: record.organizationAddress,
        date: record.date,
        items: cashItems.map(i => i.description || i.itemName).join(', '),
        total: cashTotal,
      });
    }

    // Non-cash items — group by organization
    if (nonCashItems.length > 0) {
      if (!nonCashByOrg[record.organization]) {
        nonCashByOrg[record.organization] = { address: record.organizationAddress, dates: [] };
      }
      const dateTotal = nonCashItems.reduce((s, i) => s + i.quantity * i.unitValue, 0);
      totalNonCash += dateTotal;

      // Build comma-separated item list with details
      const itemDescriptions = nonCashItems.map(item => {
        const cat = CATEGORY_LABELS[item.category];
        const cond = item.condition ? CONDITION_LABELS[item.condition] : 'Good';
        const qty = item.quantity > 1 ? ` (×${item.quantity})` : '';
        return `${item.itemName}${qty}: ${cond}, ${cat}`;
      });

      nonCashByOrg[record.organization].dates.push({
        date: record.date,
        items: itemDescriptions.join(', '),
        total: dateTotal,
      });
    }
  }

  const grandTotal = totalCash + totalNonCash;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto print:static">
      {/* Toolbar */}
      <div className="print:hidden sticky top-0 bg-irs-900 text-white px-4 py-3 flex items-center justify-between shadow-md z-10">
        <span className="text-sm font-medium">{taxYear} YTD Charitable Deductions</span>
        <div className="flex gap-2">
          <button onClick={handlePrint}
            className="px-4 py-2 bg-white text-irs-900 rounded text-sm font-medium hover:bg-irs-100 min-h-[44px] flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Save as PDF
          </button>
          <button onClick={onClose}
            className="px-4 py-2 border border-irs-600 text-irs-200 rounded text-sm hover:bg-irs-800 min-h-[44px]">
            Close
          </button>
        </div>
      </div>

      {/* Report */}
      <div className="max-w-[850px] mx-auto px-8 py-8 print:px-0 print:py-4 print:max-w-none text-[13px] text-gray-900 leading-relaxed">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-lg font-bold text-gray-900">It's Deductible</h1>
            <p className="text-[11px] text-gray-400">Charitable Donation Report</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">{taxYear} Tax Year</div>
            <div className="text-base font-bold text-gray-900">YTD Charitable Deductions</div>
          </div>
        </div>

        <hr className="border-gray-300 mb-6" />

        {/* ─── NON-CASH SECTION ─── */}
        <div className="mb-8">
          <div className="flex gap-4 items-start mb-3 pb-2 border-b border-gray-400">
            <div className="font-bold text-sm whitespace-nowrap">Non-Cash</div>
            <div className="text-[11px] text-gray-500 leading-snug">
              The IRS includes item and stock donations in the definition of "Non-Cash" items donations.
            </div>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[140px_1fr_100px] gap-2 bg-yellow-50 border-b border-gray-400 px-2 py-1.5">
            <div className="font-bold text-xs">Charity Name</div>
            <div className="font-bold text-xs">Description</div>
            <div className="font-bold text-xs text-right">Value</div>
          </div>

          {Object.keys(nonCashByOrg).length === 0 ? (
            <div className="px-2 py-4 text-gray-400 text-sm">No non-cash donations recorded.</div>
          ) : (
            Object.entries(nonCashByOrg).map(([org, data]) => {
              const orgTotal = data.dates.reduce((s, d) => s + d.total, 0);
              return (
                <div key={org} className="mb-4">
                  {/* Org name */}
                  <div className="grid grid-cols-[140px_1fr_100px] gap-2 border-b border-gray-300 px-2 py-1.5 bg-gray-50">
                    <div>
                      <div className="font-bold text-sm">{org}</div>
                      {data.address && <div className="text-[10px] text-gray-500 mt-0.5">{data.address}</div>}
                    </div>
                    <div></div>
                    <div></div>
                  </div>

                  <div className="px-2 py-1 text-xs text-gray-500 font-medium">Item Donations</div>

                  {/* Each donation date */}
                  {data.dates.map((d, i) => (
                    <div key={`${org}-${d.date}-${i}`} className="grid grid-cols-[140px_1fr_100px] gap-2 px-2 py-2 border-b border-gray-100">
                      <div className="text-sm text-gray-700 pt-0.5">{formatDate(d.date)}</div>
                      <div className="text-[12px] text-gray-700 leading-relaxed">{d.items}</div>
                      <div className="text-right text-sm font-mono text-gray-900">{formatCurrency(d.total)}</div>
                    </div>
                  ))}

                  {/* Org subtotal */}
                  <div className="grid grid-cols-[140px_1fr_100px] gap-2 px-2 py-1.5 border-t border-gray-300">
                    <div></div>
                    <div className="text-right text-xs text-gray-600 font-medium">Subtotal:</div>
                    <div className="text-right text-sm font-mono font-bold text-gray-900 border-t border-gray-400 pt-1">
                      {formatCurrency(orgTotal)}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Total Non-Cash */}
          <div className="grid grid-cols-[140px_1fr_100px] gap-2 px-2 py-2 bg-yellow-50 border-y border-gray-400">
            <div></div>
            <div className="text-right font-bold text-sm">Total Non-Cash:</div>
            <div className="text-right font-mono font-bold text-sm">{formatCurrency(totalNonCash)}</div>
          </div>
        </div>

        {/* ─── CASH SECTION ─── */}
        <div className="mb-8">
          <div className="flex gap-4 items-start mb-3 pb-2 border-b border-gray-400">
            <div className="font-bold text-sm whitespace-nowrap">Cash Donations</div>
            <div className="text-[11px] text-gray-500 leading-snug">
              The IRS includes cash, out-of-pocket expenses, and mileage donations in its definition of "Cash" money donations.
            </div>
          </div>

          <div className="grid grid-cols-[140px_1fr_100px] gap-2 bg-yellow-50 border-b border-gray-400 px-2 py-1.5">
            <div className="font-bold text-xs">Charity Name</div>
            <div className="font-bold text-xs">Description</div>
            <div className="font-bold text-xs text-right">Amount</div>
          </div>

          {cashRecords.length === 0 ? (
            <div className="px-2 py-4 text-gray-400 text-sm">No cash donations recorded.</div>
          ) : (
            cashRecords.map((cr, i) => (
              <div key={`cash-${i}`} className="grid grid-cols-[140px_1fr_100px] gap-2 px-2 py-2 border-b border-gray-100">
                <div>
                  <div className="text-sm font-medium text-gray-800">{cr.org}</div>
                  {cr.address && <div className="text-[10px] text-gray-500 mt-0.5">{cr.address}</div>}
                </div>
                <div className="text-[12px] text-gray-700">
                  {formatDate(cr.date)}{cr.items ? ` — ${cr.items}` : ''}
                </div>
                <div className="text-right text-sm font-mono text-gray-900">{formatCurrency(cr.total)}</div>
              </div>
            ))
          )}

          {/* Total Cash */}
          <div className="grid grid-cols-[140px_1fr_100px] gap-2 px-2 py-2 bg-yellow-50 border-y border-gray-400">
            <div></div>
            <div className="text-right font-bold text-sm">Total Cash Donations:</div>
            <div className="text-right font-mono font-bold text-sm">{formatCurrency(totalCash)}</div>
          </div>
        </div>

        {/* ─── GRAND TOTAL ─── */}
        <div className="grid grid-cols-[140px_1fr_100px] gap-2 px-2 py-3 bg-gray-100 border-2 border-gray-800 rounded">
          <div></div>
          <div className="text-right font-bold text-base">Grand Total:</div>
          <div className="text-right font-mono font-bold text-base">{formatCurrency(grandTotal)}</div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-300 text-[10px] text-gray-400 space-y-1">
          <p>Generated by It's Deductible — open-source charitable donation tracker.</p>
          <p>Fair market values are estimates. Not tax advice. Consult a qualified tax professional.</p>
          {totalNonCash > 500 && (
            <p className="text-gray-600">
              Note: Non-cash donations totaling more than $500 require IRS Form 8283.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

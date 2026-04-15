import type { DonationRecord } from '../types/donation';
import { CATEGORY_LABELS } from '../types/donation';

interface ExportCSVProps {
  records: DonationRecord[];
  taxYear: number;
}

export function ExportCSV({ records, taxYear }: ExportCSVProps) {
  function handleExport() {
    if (records.length === 0) return;

    const headers = ['Date', 'Organization', 'Category', 'Item', 'Qty', 'Unit Value', 'Subtotal', 'Notes'];
    const rows: string[] = [];

    let grandTotal = 0;
    for (const record of [...records].sort((a, b) => b.date.localeCompare(a.date))) {
      for (const item of record.items) {
        const subtotal = item.quantity * item.unitValue;
        grandTotal += subtotal;
        rows.push([
          record.date,
          `"${record.organization.replace(/"/g, '""')}"`,
          CATEGORY_LABELS[item.category],
          `"${item.itemName.replace(/"/g, '""')}"`,
          item.quantity,
          item.unitValue.toFixed(2),
          subtotal.toFixed(2),
          `"${item.description.replace(/"/g, '""')}"`,
        ].join(','));
      }
    }

    rows.push(['', '', '', '', '', 'TOTAL', grandTotal.toFixed(2), ''].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donations-${taxYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      disabled={records.length === 0}
      className="px-4 py-2 border border-irs-300 text-irs-600 rounded hover:bg-irs-50 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed print:hidden"
    >
      Export CSV
    </button>
  );
}

import type { Donation } from '../types/donation';
import { CATEGORY_LABELS } from '../types/donation';

interface ExportCSVProps {
  donations: Donation[];
  taxYear: number;
}

export function ExportCSV({ donations, taxYear }: ExportCSVProps) {
  function handleExport() {
    if (donations.length === 0) return;

    const headers = ['Date', 'Organization', 'Category', 'Description', 'Estimated FMV'];
    const rows = donations.map(d => [
      d.date,
      `"${d.organization.replace(/"/g, '""')}"`,
      CATEGORY_LABELS[d.category],
      `"${d.description.replace(/"/g, '""')}"`,
      d.estimatedValue.toFixed(2),
    ]);

    const total = donations.reduce((sum, d) => sum + d.estimatedValue, 0);
    rows.push(['', '', '', 'TOTAL', total.toFixed(2)]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
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
      disabled={donations.length === 0}
      className="px-4 py-2 border border-irs-300 text-irs-600 rounded hover:bg-irs-50 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed print:hidden"
    >
      Export CSV
    </button>
  );
}

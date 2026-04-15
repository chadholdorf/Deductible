import type { DonationRecord } from '../types/donation';

interface TXFExportProps {
  records: DonationRecord[];
  taxYear: number;
}

/**
 * TXF (Tax Exchange Format) export for TurboTax Desktop.
 *
 * TXF codes for Schedule A charitable deductions:
 * - 488 = Cash contributions (line 12)
 * - 489 = Non-cash contributions (line 13)
 */
function buildTXF(records: DonationRecord[], _taxYear: number): string {
  const lines: string[] = [];

  // Header
  lines.push('V042');
  lines.push('AIts Deductible');
  lines.push(`D${formatTXFDate(new Date())}`)
  lines.push('^');

  for (const record of [...records].sort((a, b) => a.date.localeCompare(b.date))) {
    let cashTotal = 0;
    let nonCashTotal = 0;
    const nonCashItems: string[] = [];

    for (const item of record.items) {
      const value = item.quantity * item.unitValue;
      if (item.category === 'cash') {
        cashTotal += value;
      } else {
        nonCashTotal += value;
        const qty = item.quantity > 1 ? ` (x${item.quantity})` : '';
        nonCashItems.push(`${item.itemName}${qty}`);
      }
    }

    // Cash donation entry (code 488)
    if (cashTotal > 0) {
      lines.push('TD');
      lines.push('N488');
      lines.push('C1');
      lines.push(`L${record.organization}`);
      lines.push(`D${formatTXFDate(new Date(record.date + 'T00:00:00'))}`);
      lines.push(`$${cashTotal.toFixed(2)}`);
      lines.push('^');
    }

    // Non-cash donation entry (code 489)
    if (nonCashTotal > 0) {
      lines.push('TD');
      lines.push('N489');
      lines.push('C1');
      lines.push(`L${record.organization} - ${nonCashItems.join(', ')}`);
      lines.push(`D${formatTXFDate(new Date(record.date + 'T00:00:00'))}`);
      lines.push(`$${nonCashTotal.toFixed(2)}`);
      lines.push('^');
    }
  }

  return lines.join('\r\n');
}

function formatTXFDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const y = date.getFullYear();
  return `${m}/${d}/${y}`;
}

export function TXFExport({ records, taxYear }: TXFExportProps) {
  function handleExport() {
    if (records.length === 0) return;
    const txf = buildTXF(records, taxYear);
    const blob = new Blob([txf], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donations-${taxYear}.txf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      disabled={records.length === 0}
      className="px-3 py-2 text-xs border border-irs-200 dark:border-gray-600 text-irs-500 dark:text-gray-400 rounded hover:bg-irs-50 dark:hover:bg-gray-700 active:bg-irs-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      title="Export TXF for TurboTax Desktop"
    >
      TurboTax (.txf)
    </button>
  );
}

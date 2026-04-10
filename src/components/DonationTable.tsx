import type { Donation } from '../types/donation';
import { CATEGORY_LABELS } from '../types/donation';

interface DonationTableProps {
  donations: Donation[];
  onEdit: (donation: Donation) => void;
  onDelete: (id: string) => void;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${month}/${day}/${year}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export function DonationTable({ donations, onEdit, onDelete }: DonationTableProps) {
  if (donations.length === 0) {
    return (
      <div className="bg-white border border-irs-200 rounded-lg p-8 text-center text-irs-400">
        <p className="text-lg">No donations recorded for this tax year.</p>
        <p className="text-sm mt-1">Use the form above to add your first donation.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-irs-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-irs-50 border-b border-irs-200">
              <th className="text-left px-4 py-3 font-semibold text-irs-700">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-irs-700">Organization</th>
              <th className="text-left px-4 py-3 font-semibold text-irs-700">Category</th>
              <th className="text-left px-4 py-3 font-semibold text-irs-700 hidden md:table-cell">Description</th>
              <th className="text-right px-4 py-3 font-semibold text-irs-700">FMV</th>
              <th className="text-right px-4 py-3 font-semibold text-irs-700 print:hidden">Actions</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((donation, i) => (
              <tr
                key={donation.id}
                className={`border-b border-irs-100 hover:bg-irs-50/50 transition-colors ${
                  i % 2 === 1 ? 'bg-gray-50/50' : ''
                }`}
              >
                <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-irs-600">
                  {formatDate(donation.date)}
                </td>
                <td className="px-4 py-3 text-irs-800 font-medium">{donation.organization}</td>
                <td className="px-4 py-3 text-irs-600">
                  <span className="inline-block px-2 py-0.5 bg-irs-100 text-irs-700 rounded text-xs">
                    {CATEGORY_LABELS[donation.category]}
                  </span>
                </td>
                <td className="px-4 py-3 text-irs-500 max-w-xs truncate hidden md:table-cell">
                  {donation.description || '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-irs-800">
                  {formatCurrency(donation.estimatedValue)}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap print:hidden">
                  <button
                    onClick={() => onEdit(donation)}
                    className="text-irs-500 hover:text-irs-700 mr-3 text-xs underline transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this donation?')) {
                        onDelete(donation.id);
                      }
                    }}
                    className="text-red-400 hover:text-red-600 text-xs underline transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { DonationRecord } from '../types/donation';
import { CATEGORY_LABELS, recordTotal } from '../types/donation';

interface DonationHistoryProps {
  records: DonationRecord[];
  onEdit: (record: DonationRecord) => void;
  onDelete: (id: string) => void;
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-');
  return `${month}/${day}/${year}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function DonationHistory({ records, onEdit, onDelete }: DonationHistoryProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (records.length === 0) {
    return (
      <div className="bg-white border border-irs-200 rounded-lg p-10 text-center text-irs-400">
        <p className="text-base">No donations recorded for this tax year.</p>
        <p className="text-sm mt-1">Click "Start New Donation List" above to add your first donation.</p>
      </div>
    );
  }

  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="bg-white border border-irs-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-irs-50 border-b border-irs-200">
              <th className="text-left px-4 py-3 font-semibold text-irs-700 w-6"></th>
              <th className="text-left px-4 py-3 font-semibold text-irs-700">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-irs-700">Organization</th>
              <th className="text-center px-4 py-3 font-semibold text-irs-700 hidden sm:table-cell">Items</th>
              <th className="text-right px-4 py-3 font-semibold text-irs-700">Total FMV</th>
              <th className="text-right px-4 py-3 font-semibold text-irs-700 print:hidden">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((record, i) => {
              const total = recordTotal(record);
              const expanded = expandedIds.has(record.id);
              return (
                <>
                  <tr
                    key={record.id}
                    className={`border-b border-irs-100 cursor-pointer hover:bg-irs-50/60 transition-colors ${i % 2 === 1 ? 'bg-gray-50/40' : ''}`}
                    onClick={() => toggleExpand(record.id)}
                  >
                    <td className="px-4 py-3 text-irs-400">
                      <svg
                        className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-irs-600">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-4 py-3 font-medium text-irs-800">{record.organization}</td>
                    <td className="px-4 py-3 text-center text-irs-500 hidden sm:table-cell">
                      {record.items.length} item{record.items.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-irs-800">
                      {formatCurrency(total)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap print:hidden" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => onEdit(record)}
                        className="text-irs-500 hover:text-irs-700 mr-3 text-xs underline transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete donation to "${record.organization}" on ${formatDate(record.date)}?`)) {
                            onDelete(record.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-600 text-xs underline transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>

                  {/* Expanded item rows */}
                  {expanded && record.items.map(item => (
                    <tr key={item.id} className="bg-irs-50/70 border-b border-irs-100/60">
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2 text-irs-400 text-xs" colSpan={1}></td>
                      <td className="px-4 py-2" colSpan={2}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-1.5 py-0.5 bg-irs-100 text-irs-600 rounded flex-shrink-0">
                            {CATEGORY_LABELS[item.category]}
                          </span>
                          <span className="text-xs text-irs-700">
                            {item.quantity > 1 && (
                              <span className="text-irs-400 mr-1">{item.quantity}×</span>
                            )}
                            {item.itemName}
                            {item.description && (
                              <span className="text-irs-400 ml-1">— {item.description}</span>
                            )}
                          </span>
                          {item.quantity > 1 && (
                            <span className="text-irs-400 text-xs">
                              ({formatCurrency(item.unitValue)} each)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-xs text-irs-600">
                        {formatCurrency(item.quantity * item.unitValue)}
                      </td>
                      <td className="px-4 py-2 print:hidden"></td>
                    </tr>
                  ))}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

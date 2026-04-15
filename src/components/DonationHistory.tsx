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
    <div className="space-y-3">
      {sorted.map(record => {
        const total = recordTotal(record);
        const expanded = expandedIds.has(record.id);
        return (
          <div key={record.id} className="bg-white border border-irs-200 rounded-lg overflow-hidden">
            {/* Main row — tap to expand */}
            <button
              type="button"
              onClick={() => toggleExpand(record.id)}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-irs-50/60 active:bg-irs-50 transition-colors min-h-[52px]"
            >
              <svg
                className={`w-4 h-4 flex-shrink-0 text-irs-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium text-sm text-irs-800 truncate">{record.organization}</span>
                  <span className="text-xs text-irs-400 whitespace-nowrap">
                    {record.items.length} item{record.items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-xs text-irs-500 font-mono mt-0.5">{formatDate(record.date)}</div>
              </div>

              <span className="flex-shrink-0 font-mono font-semibold text-sm text-irs-800">
                {formatCurrency(total)}
              </span>
            </button>

            {/* Expanded details */}
            {expanded && (
              <div className="border-t border-irs-100">
                {/* Item list */}
                <div className="px-4 py-3 space-y-2 bg-irs-50/40">
                  {record.items.map(item => (
                    <div key={item.id} className="flex items-start gap-2 text-sm">
                      <span className="flex-shrink-0 px-1.5 py-0.5 bg-irs-100 text-irs-600 rounded text-xs mt-0.5">
                        {CATEGORY_LABELS[item.category]}
                      </span>
                      <span className="flex-1 min-w-0 text-xs text-irs-700">
                        {item.quantity > 1 && (
                          <span className="text-irs-400 mr-1">{item.quantity}×</span>
                        )}
                        {item.itemName}
                        {item.description && (
                          <span className="text-irs-400 ml-1">— {item.description}</span>
                        )}
                        {item.quantity > 1 && (
                          <span className="text-irs-400 ml-1">({formatCurrency(item.unitValue)} ea.)</span>
                        )}
                      </span>
                      <span className="flex-shrink-0 font-mono text-xs text-irs-600">
                        {formatCurrency(item.quantity * item.unitValue)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="px-4 py-3 border-t border-irs-100 flex gap-3 print:hidden">
                  <button
                    onClick={() => onEdit(record)}
                    className="px-4 py-2 text-sm text-irs-600 border border-irs-200 rounded hover:bg-irs-50 active:bg-irs-100 transition-colors min-h-[44px]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete donation to "${record.organization}" on ${formatDate(record.date)}?`)) {
                        onDelete(record.id);
                      }
                    }}
                    className="px-4 py-2 text-sm text-red-500 border border-red-200 rounded hover:bg-red-50 active:bg-red-100 transition-colors min-h-[44px]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

import { useState } from 'react';
import type { DonationRecord } from '../types/donation';
import { CATEGORY_LABELS, CONDITION_LABELS, recordTotal } from '../types/donation';

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
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center text-gray-400 dark:text-gray-500">
        <p className="text-base">No donations recorded for this tax year.</p>
        <p className="text-sm mt-1">Tap "New Donation" to add your first.</p>
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
          <div key={record.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleExpand(record.id)}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-750 active:bg-gray-100 dark:active:bg-gray-700 transition-colors min-h-[52px]"
            >
              <svg
                className={`w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">{record.organization}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {record.items.length} item{record.items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">{formatDate(record.date)}</div>
              </div>
              <span className="flex-shrink-0 font-mono font-semibold text-sm text-gray-800 dark:text-gray-100">
                {formatCurrency(total)}
              </span>
            </button>

            {expanded && (
              <div className="border-t border-gray-100 dark:border-gray-700">
                <div className="px-4 py-3 space-y-2 bg-gray-50/60 dark:bg-gray-900/40">
                  {record.items.map(item => (
                    <div key={item.id} className="flex items-start gap-2 text-sm">
                      <span className="flex-shrink-0 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs mt-0.5">
                        {CATEGORY_LABELS[item.category]}
                      </span>
                      <span className="flex-1 min-w-0 text-xs text-gray-700 dark:text-gray-300">
                        {item.quantity > 1 && <span className="text-gray-400 mr-1">{item.quantity}×</span>}
                        {item.itemName}
                        {item.condition && <span className="text-gray-400 ml-1">[{CONDITION_LABELS[item.condition]}]</span>}
                        {item.description && <span className="text-gray-400 ml-1">— {item.description}</span>}
                        {item.quantity > 1 && <span className="text-gray-400 ml-1">({formatCurrency(item.unitValue)} ea.)</span>}
                      </span>
                      <span className="flex-shrink-0 font-mono text-xs text-gray-600 dark:text-gray-400">
                        {formatCurrency(item.quantity * item.unitValue)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex gap-3 print:hidden">
                  <button onClick={() => onEdit(record)}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 transition-colors min-h-[44px]">
                    Edit
                  </button>
                  <button onClick={() => { if (window.confirm(`Delete donation to "${record.organization}"?`)) onDelete(record.id); }}
                    className="px-4 py-2 text-sm text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 active:bg-red-100 transition-colors min-h-[44px]">
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

import { useState } from 'react';
import type { DonationRecord } from '../types/donation';
import { CATEGORY_LABELS, CONDITION_LABELS, recordTotal } from '../types/donation';
import { CATEGORY_ICONS } from '../App';

interface DonationHistoryProps {
  records: DonationRecord[];
  onEdit: (record: DonationRecord) => void;
  onDelete: (id: string) => void;
  sortMode?: 'date' | 'amount' | 'charity';
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-');
  return `${month}/${day}/${year}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

/** Get the dominant category of a record (highest value) */
function dominantCategory(record: DonationRecord): string {
  const totals: Record<string, number> = {};
  for (const item of record.items) {
    totals[item.category] = (totals[item.category] ?? 0) + item.quantity * item.unitValue;
  }
  return Object.entries(totals).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'other';
}

export function DonationHistory({ records, onEdit, onDelete, sortMode = 'date' }: DonationHistoryProps) {
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

  // Sort records based on mode
  const sorted = [...records].sort((a, b) => {
    if (sortMode === 'amount') return recordTotal(b) - recordTotal(a);
    if (sortMode === 'charity') return a.organization.localeCompare(b.organization) || b.date.localeCompare(a.date);
    return b.date.localeCompare(a.date); // default: date desc
  });

  return (
    <div className="space-y-2.5">
      {sorted.map(record => {
        const total = recordTotal(record);
        const expanded = expandedIds.has(record.id);
        const cat = dominantCategory(record);
        const style = CATEGORY_ICONS[cat] ?? CATEGORY_ICONS.other;

        // Build a brief item summary for the card
        const itemSummary = record.items
          .slice(0, 2)
          .map(i => i.itemName)
          .join(', ') + (record.items.length > 2 ? ` +${record.items.length - 2} more` : '');

        return (
          <div key={record.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleExpand(record.id)}
              className="w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-750 active:bg-gray-100 dark:active:bg-gray-700 transition-colors min-h-[64px]"
            >
              {/* Category icon */}
              <div className={`w-10 h-10 rounded-full ${style.bg} flex items-center justify-center text-base flex-shrink-0`}>
                {style.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">
                  {record.organization}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {formatDate(record.date)} &middot; {itemSummary}
                </div>
              </div>

              <div className="flex-shrink-0 text-right">
                <div className="font-mono font-semibold text-sm text-gray-800 dark:text-gray-100">
                  {formatCurrency(total)}
                </div>
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform ml-auto mt-0.5 ${expanded ? 'rotate-90' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {expanded && (
              <div className="border-t border-gray-100 dark:border-gray-700">
                <div className="px-4 py-3 space-y-2 bg-gray-50/60 dark:bg-gray-900/40">
                  {record.organizationAddress && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 pb-1">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {record.organizationAddress}
                    </p>
                  )}
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

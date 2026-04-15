import { useState, useMemo } from 'react';
import type { ValuationItem } from '../types/donation';
import valuationGuide from '../data/valuationGuide.json';

const guide = valuationGuide as ValuationItem[];

interface ValuationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ValuationModal({ isOpen, onClose }: ValuationModalProps) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const categories = useMemo(
    () => [...new Set(guide.map(g => g.category))],
    []
  );

  const filtered = useMemo(() => {
    let items = guide;
    if (filterCategory) {
      items = items.filter(g => g.category === filterCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        g =>
          g.item.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q)
      );
    }
    return items;
  }, [search, filterCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-start sm:justify-center sm:pt-12 md:pt-16">
      <div className="bg-white rounded-t-xl sm:rounded-lg shadow-xl w-full sm:max-w-3xl sm:mx-4 h-[90vh] sm:h-auto sm:max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-irs-200 flex-shrink-0">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-irs-800">
              Donation Value Reference Guide
            </h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 rounded-full text-irs-400 hover:text-irs-700 hover:bg-irs-100 active:bg-irs-200 transition-colors text-2xl leading-none"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          <p className="text-xs text-irs-500 mb-3">
            Fair market values based on Salvation Army &amp; Goodwill guides. Values are for items in good, used condition.
          </p>
          <div className="flex gap-3 flex-col sm:flex-row">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items..."
              className="flex-1 border border-irs-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-irs-400 min-h-[44px]"
              autoFocus
            />
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="border border-irs-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-irs-400 bg-white min-h-[44px]"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-irs-50">
              <tr className="border-b border-irs-200">
                <th className="text-left px-3 sm:px-4 py-2 font-semibold text-irs-700 hidden sm:table-cell">Category</th>
                <th className="text-left px-3 sm:px-4 py-2 font-semibold text-irs-700">Item</th>
                <th className="text-right px-3 sm:px-4 py-2 font-semibold text-irs-700">Low</th>
                <th className="text-right px-3 sm:px-4 py-2 font-semibold text-irs-700">High</th>
                <th className="text-center px-3 sm:px-4 py-2 font-semibold text-irs-700 hidden sm:table-cell">Unit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-irs-400">
                    No items found.
                  </td>
                </tr>
              ) : (
                filtered.map((item, i) => (
                  <tr
                    key={`${item.category}-${item.item}-${i}`}
                    className={`border-b border-irs-100 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                  >
                    <td className="px-3 sm:px-4 py-2.5 text-irs-500 text-xs hidden sm:table-cell">{item.category}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-irs-800">{item.item}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-right font-mono text-irs-600">${item.low}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-right font-mono text-irs-600">${item.high}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-center text-irs-400 text-xs hidden sm:table-cell">{item.unit}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-irs-200 flex-shrink-0 text-xs text-irs-400 text-center">
          {filtered.length} item{filtered.length !== 1 ? 's' : ''} shown &middot; Values for good, used condition
        </div>
      </div>
    </div>
  );
}

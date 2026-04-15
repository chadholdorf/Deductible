import { useState, useMemo } from 'react';
import { useDonations } from './hooks/useDonations';
import { useDarkMode } from './hooks/useDarkMode';
import { DonationBuilder } from './components/DonationBuilder';
import { DonationHistory } from './components/DonationHistory';
import { Summary } from './components/Summary';
import { ValuationModal } from './components/ValuationModal';
import { ExportCSV } from './components/ExportCSV';
import { TXFExport } from './components/TXFExport';
import { PrintReport } from './components/PrintReport';
import { DataManagement } from './components/DataManagement';
import type { DonationRecord, DonationCategory } from './types/donation';
import { CATEGORY_LABELS, recordTotal } from './types/donation';

type Mode = 'view' | 'building' | 'editing';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

const CATEGORY_ICONS: Partial<Record<DonationCategory, { icon: string; bg: string; text: string }>> = {
  clothing: { icon: '👔', bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300' },
  cash: { icon: '💵', bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-300' },
  furniture: { icon: '🛋️', bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300' },
  household: { icon: '🏠', bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300' },
  electronics: { icon: '💻', bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-700 dark:text-cyan-300' },
  appliances: { icon: '🔌', bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300' },
  books_media_toys: { icon: '📚', bg: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-700 dark:text-pink-300' },
  vehicle: { icon: '🚗', bg: 'bg-slate-100 dark:bg-slate-900/40', text: 'text-slate-700 dark:text-slate-300' },
  other: { icon: '📦', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
};

function App() {
  const { records, addRecord, updateRecord, deleteRecord, reloadRecords } = useDonations();
  const { dark, toggleDark } = useDarkMode();
  const [mode, setMode] = useState<Mode>('view');
  const [editingRecord, setEditingRecord] = useState<DonationRecord | null>(null);
  const [showValuation, setShowValuation] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Tax years
  const taxYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [...new Set([currentYear, ...records.map(r => r.taxYear)])];
    return years.sort((a, b) => b - a);
  }, [records]);

  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  const yearRecords = useMemo(
    () => records.filter(r => r.taxYear === selectedYear),
    [records, selectedYear]
  );

  const yearTotal = useMemo(
    () => yearRecords.reduce((sum, r) => sum + recordTotal(r), 0),
    [yearRecords]
  );

  // Category totals for the grid
  const categoryTotals = useMemo(() => {
    const totals: Partial<Record<DonationCategory, number>> = {};
    for (const record of yearRecords) {
      for (const item of record.items) {
        const v = item.quantity * item.unitValue;
        totals[item.category] = (totals[item.category] ?? 0) + v;
      }
    }
    return totals;
  }, [yearRecords]);

  const activeCategories = Object.entries(categoryTotals).sort(([, a], [, b]) => (b ?? 0) - (a ?? 0));

  function handleSave(data: Omit<DonationRecord, 'id'>) {
    if (editingRecord) {
      updateRecord(editingRecord.id, data);
      setEditingRecord(null);
    } else {
      addRecord(data);
      if (data.taxYear !== selectedYear) setSelectedYear(data.taxYear);
    }
    setMode('view');
  }

  function handleEdit(record: DonationRecord) {
    setEditingRecord(record);
    setMode('editing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancel() {
    setEditingRecord(null);
    setMode('view');
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors ${dark ? 'dark' : ''}`}>
      {/* Header */}
      <header className="bg-irs-900 dark:bg-gray-950 text-white print:bg-white print:text-black">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">It&rsquo;s Deductible</h1>
          <div className="flex items-center gap-2 print:hidden">
            <button onClick={() => setShowValuation(true)} title="Value Reference"
              className="p-2 rounded-lg hover:bg-irs-800 dark:hover:bg-gray-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </button>
            <button onClick={toggleDark} title={dark ? 'Light mode' : 'Dark mode'}
              className="p-2 rounded-lg hover:bg-irs-800 dark:hover:bg-gray-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              {dark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5 space-y-5">

        {mode !== 'view' ? (
          <DonationBuilder
            editingRecord={editingRecord}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <>
            {/* ── Hero Total Card ── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg px-2.5 py-1.5 border-none focus:outline-none focus:ring-2 focus:ring-irs-400 min-h-[36px]"
                >
                  {taxYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="text-4xl font-bold font-mono text-gray-900 dark:text-white tracking-tight">
                {formatCurrency(yearTotal)}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {yearRecords.length} donation{yearRecords.length !== 1 ? 's' : ''} to {new Set(yearRecords.map(r => r.organization)).size} {new Set(yearRecords.map(r => r.organization)).size === 1 ? 'charity' : 'charities'}
              </p>
            </div>

            {/* ── Category Grid ── */}
            {activeCategories.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {activeCategories.map(([cat, total]) => {
                  const style = CATEGORY_ICONS[cat as DonationCategory] ?? CATEGORY_ICONS.other!;
                  return (
                    <div key={cat}
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${style.bg} flex items-center justify-center text-lg flex-shrink-0`}>
                        {style.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {CATEGORY_LABELS[cat as DonationCategory]}
                        </div>
                        <div className={`text-sm font-bold font-mono ${style.text}`}>
                          {formatCurrency(total ?? 0)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Export / Tools Row ── */}
            <div className="flex flex-wrap items-center gap-2">
              <ExportCSV records={yearRecords} taxYear={selectedYear} />
              <TXFExport records={yearRecords} taxYear={selectedYear} />
              <button onClick={() => setShowReport(true)} disabled={yearRecords.length === 0}
                className="px-3 py-2 text-xs border border-irs-200 dark:border-gray-600 text-irs-500 dark:text-gray-400 rounded hover:bg-irs-50 dark:hover:bg-gray-700 active:bg-irs-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Export PDF
              </button>
              <DataManagement onImport={reloadRecords} />
            </div>

            {/* ── Summary + History ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-1">
                <Summary records={yearRecords} taxYear={selectedYear} />
              </div>
              <div className="md:col-span-2">
                <DonationHistory
                  records={yearRecords}
                  onEdit={handleEdit}
                  onDelete={deleteRecord}
                />
              </div>
            </div>
          </>
        )}

        {/* ── Floating New Donation Button ── */}
        {mode === 'view' && (
          <div className="fixed bottom-6 right-6 z-30 print:hidden">
            <button
              onClick={() => setMode('building')}
              className="flex items-center gap-2 px-5 py-3.5 bg-irs-700 dark:bg-irs-600 text-white rounded-full shadow-lg hover:bg-irs-800 dark:hover:bg-irs-700 active:bg-irs-900 transition-colors text-sm font-semibold min-h-[52px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Donation
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-12 py-6 text-center text-xs text-gray-400 dark:text-gray-600 print:hidden">
        <p>It&rsquo;s Deductible &mdash; Open-source donation tracker. All data stored locally in your browser.</p>
        <p className="mt-1">Not tax advice. Consult a qualified tax professional.</p>
      </footer>

      {/* Modals */}
      <ValuationModal isOpen={showValuation} onClose={() => setShowValuation(false)} />
      {showReport && (
        <PrintReport records={yearRecords} taxYear={selectedYear} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
}

export default App;

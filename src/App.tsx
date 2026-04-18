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
type SortMode = 'date' | 'amount' | 'charity';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export const CATEGORY_ICONS: Record<string, { icon: string; bg: string; text: string }> = {
  clothing: { icon: '👔', bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300' },
  cash: { icon: '💵', bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-300' },
  furniture: { icon: '🛋️', bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300' },
  household: { icon: '🏠', bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300' },
  electronics: { icon: '💻', bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-700 dark:text-cyan-300' },
  appliances: { icon: '🔌', bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300' },
  books_media_toys: { icon: '📚', bg: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-700 dark:text-pink-300' },
  vehicle: { icon: '🚗', bg: 'bg-slate-100 dark:bg-slate-900/40', text: 'text-slate-700 dark:text-slate-300' },
  mileage: { icon: '🛣️', bg: 'bg-teal-100 dark:bg-teal-900/40', text: 'text-teal-700 dark:text-teal-300' },
  other: { icon: '📦', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
};

function App() {
  const { records, addRecord, updateRecord, deleteRecord, reloadRecords } = useDonations();
  const { dark, toggleDark } = useDarkMode();
  const [mode, setMode] = useState<Mode>('view');
  const [editingRecord, setEditingRecord] = useState<DonationRecord | null>(null);
  const [showValuation, setShowValuation] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [startCategory, setStartCategory] = useState<DonationCategory | null>(null);
  const [showTaxInsights, setShowTaxInsights] = useState(false);
  const [bracketRate, setBracketRate] = useState(() => {
    const saved = localStorage.getItem('its-deductible-bracket');
    return saved ? Number(saved) : 22;
  });

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
            startCategory={startCategory}
            onSave={(data) => { setStartCategory(null); handleSave(data); }}
            onCancel={() => { setStartCategory(null); handleCancel(); }}
          />
        ) : (
          <>
            {/* ── Compact Hero ── */}
            <div className="bg-white dark:bg-gray-800 rounded-xl px-4 py-3.5 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg px-2.5 py-1.5 border-none focus:outline-none focus:ring-2 focus:ring-irs-400 flex-shrink-0"
                  >
                    {taxYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <div className="min-w-0">
                    <div className="text-3xl font-bold font-mono text-gray-900 dark:text-white tracking-tight leading-none">
                      {formatCurrency(yearTotal)}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {yearRecords.length} donation{yearRecords.length !== 1 ? 's' : ''} · {new Set(yearRecords.map(r => r.organization)).size} {new Set(yearRecords.map(r => r.organization)).size === 1 ? 'charity' : 'charities'}
                    </p>
                  </div>
                </div>
                {yearTotal > 0 && (
                  <div className="flex-shrink-0 flex items-center gap-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wide text-green-600 dark:text-green-400 font-medium">Est. Savings</p>
                      <div className="text-xl font-bold font-mono text-green-700 dark:text-green-300 leading-tight">
                        {formatCurrency(yearTotal * (bracketRate / 100))}
                      </div>
                    </div>
                    <select
                      value={bracketRate}
                      onChange={e => { const v = Number(e.target.value); setBracketRate(v); localStorage.setItem('its-deductible-bracket', String(v)); }}
                      className="text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 border-none rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-green-400"
                    >
                      {[10,12,22,24,32,35,37].map(r => <option key={r} value={r}>{r}%</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* ── Category chips — horizontal scroll ── */}
            {activeCategories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-0.5">
                {activeCategories.map(([cat, total]) => {
                  const style = CATEGORY_ICONS[cat as DonationCategory] ?? CATEGORY_ICONS.other;
                  return (
                    <div key={cat} className="flex-shrink-0 flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full pl-2.5 pr-1.5 py-1.5 shadow-sm">
                      <span className="text-sm leading-none">{style.icon}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{CATEGORY_LABELS[cat as DonationCategory]}</span>
                      <span className={`text-xs font-bold font-mono whitespace-nowrap ${style.text}`}>{formatCurrency(total ?? 0)}</span>
                      <button
                        onClick={() => { setStartCategory(cat as DonationCategory); setMode('building'); }}
                        className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-irs-100 dark:hover:bg-gray-600 flex items-center justify-center text-gray-400 hover:text-irs-600 transition-colors"
                        title={`Add ${CATEGORY_LABELS[cat as DonationCategory]}`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Sort + Actions row ── */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5">
                {([['date', 'Date ↓'], ['amount', 'Amount'], ['charity', 'Charity']] as const).map(([key, label]) => (
                  <button key={key} onClick={() => setSortMode(key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors min-h-[32px] ${
                      sortMode === key
                        ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <ExportCSV records={yearRecords} taxYear={selectedYear} />
                <TXFExport records={yearRecords} taxYear={selectedYear} />
                <button onClick={() => setShowReport(true)} disabled={yearRecords.length === 0}
                  className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  PDF
                </button>
                <DataManagement onImport={reloadRecords} />
              </div>
            </div>

            {/* ── Full-width History ── */}
            <DonationHistory
              records={yearRecords}
              onEdit={handleEdit}
              onDelete={deleteRecord}
              sortMode={sortMode}
            />

            {/* ── Tax Insights (collapsible) ── */}
            {yearTotal > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowTaxInsights(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
                >
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <svg className="w-4 h-4 text-irs-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Tax Insights &amp; IRS Notes
                  </span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${showTaxInsights ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showTaxInsights && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-900/30">
                    <Summary records={yearRecords} taxYear={selectedYear} bracketRate={bracketRate} onBracketChange={v => { setBracketRate(v); localStorage.setItem('its-deductible-bracket', String(v)); }} />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Floating New Donation Button ── */}
        {mode === 'view' && (
          <div className="fixed bottom-6 right-6 z-30 print:hidden">
            <button
              onClick={() => { setStartCategory(null); setMode('building'); }}
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

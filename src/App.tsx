import { useState, useMemo } from 'react';
import { useDonations } from './hooks/useDonations';
import { DonationBuilder } from './components/DonationBuilder';
import { DonationHistory } from './components/DonationHistory';
import { Summary } from './components/Summary';
import { ValuationModal } from './components/ValuationModal';
import { ExportCSV } from './components/ExportCSV';
import { PrintReport } from './components/PrintReport';
import type { DonationRecord } from './types/donation';
import { recordTotal } from './types/donation';

type Mode = 'view' | 'building' | 'editing';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function App() {
  const { records, addRecord, updateRecord, deleteRecord } = useDonations();
  const [mode, setMode] = useState<Mode>('view');
  const [editingRecord, setEditingRecord] = useState<DonationRecord | null>(null);
  const [showValuation, setShowValuation] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Available tax years — always include current year
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
    <div className="min-h-screen bg-irs-50">
      {/* Header */}
      <header className="bg-irs-900 text-white print:bg-white print:text-black">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">It&rsquo;s Deductible</h1>
            <p className="text-irs-300 text-xs mt-0.5 print:text-gray-500">
              Charitable Donation Tracker
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => setShowValuation(true)}
              className="px-4 py-2.5 bg-irs-700 hover:bg-irs-600 active:bg-irs-500 text-white rounded text-sm transition-colors border border-irs-600 min-h-[44px]"
            >
              Value Reference
            </button>
            <button
              onClick={() => setShowReport(true)}
              className="px-4 py-2.5 border border-irs-600 text-irs-200 hover:bg-irs-800 active:bg-irs-700 rounded text-sm transition-colors min-h-[44px]"
            >
              Export PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ── Step 1: Start or Builder ── */}
        {mode === 'view' ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              onClick={() => setMode('building')}
              className="flex items-center justify-center sm:justify-start gap-2 px-5 py-3.5 bg-irs-700 text-white rounded-lg hover:bg-irs-800 active:bg-irs-900 transition-colors text-sm font-semibold shadow-sm min-h-[48px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Start New Donation List
            </button>
            {yearRecords.length > 0 && (
              <p className="text-sm text-irs-500">
                {yearRecords.length} donation{yearRecords.length !== 1 ? 's' : ''} in {selectedYear} &mdash; {formatCurrency(yearTotal)} total
              </p>
            )}
          </div>
        ) : (
          <DonationBuilder
            editingRecord={editingRecord}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}

        {/* ── Year filter + export ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-irs-700 print:hidden">Tax Year:</span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="border border-irs-200 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-irs-400 print:hidden"
            >
              {taxYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <span className="hidden print:inline text-sm font-semibold text-irs-800">Tax Year {selectedYear}</span>
          </div>
          <ExportCSV records={yearRecords} taxYear={selectedYear} />
        </div>

        {/* ── Summary + History ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </main>

      {/* Footer */}
      <footer className="border-t border-irs-200 mt-12 py-6 text-center text-xs text-irs-400 print:hidden">
        <p>It&rsquo;s Deductible &mdash; Open-source donation tracker. All data stored locally in your browser.</p>
        <p className="mt-1">Not tax advice. Consult a qualified tax professional.</p>
      </footer>

      <ValuationModal isOpen={showValuation} onClose={() => setShowValuation(false)} />
      {showReport && (
        <PrintReport records={yearRecords} taxYear={selectedYear} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
}

export default App;

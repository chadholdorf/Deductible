import { useState, useMemo } from 'react';
import { useDonations } from './hooks/useDonations';
import { DonationForm } from './components/DonationForm';
import { DonationTable } from './components/DonationTable';
import { Summary } from './components/Summary';
import { ValuationModal } from './components/ValuationModal';
import { ExportCSV } from './components/ExportCSV';
import type { Donation } from './types/donation';

function App() {
  const { donations, addDonation, updateDonation, deleteDonation } = useDonations();
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [showValuation, setShowValuation] = useState(false);

  // Derive available tax years — always include the current year
  const taxYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [...new Set([currentYear, ...donations.map(d => d.taxYear)])];
    return years.sort((a, b) => b - a);
  }, [donations]);

  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  // Filter donations by selected year
  const filteredDonations = useMemo(
    () =>
      donations
        .filter(d => d.taxYear === selectedYear)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [donations, selectedYear]
  );

  function handleSubmit(donation: Omit<Donation, 'id'>) {
    if (editingDonation) {
      updateDonation(editingDonation.id, donation);
      setEditingDonation(null);
    } else {
      addDonation(donation);
      // Switch to the year of the new donation
      if (donation.taxYear !== selectedYear) {
        setSelectedYear(donation.taxYear);
      }
    }
  }

  return (
    <div className="min-h-screen bg-irs-50">
      {/* Header */}
      <header className="bg-irs-900 text-white print:bg-white print:text-black">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              It&rsquo;s Deductible
            </h1>
            <p className="text-irs-300 text-sm print:text-gray-500">
              Charitable Donation Tracker for Tax Preparation
            </p>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <button
              onClick={() => setShowValuation(true)}
              className="px-4 py-2 bg-irs-700 hover:bg-irs-600 text-white rounded text-sm transition-colors border border-irs-600"
            >
              Value Reference
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-irs-600 text-irs-200 hover:bg-irs-800 rounded text-sm transition-colors"
            >
              Print
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Donation Form */}
        <DonationForm
          onSubmit={handleSubmit}
          editingDonation={editingDonation}
          onCancelEdit={() => setEditingDonation(null)}
        />

        {/* Year filter + actions bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-irs-700">Tax Year:</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="border border-irs-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-irs-400 print:hidden"
            >
              {taxYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <span className="text-irs-400 text-sm hidden print:inline">
              {selectedYear}
            </span>
          </div>
          <ExportCSV donations={filteredDonations} taxYear={selectedYear} />
        </div>

        {/* Summary + Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Summary donations={filteredDonations} taxYear={selectedYear} />
          </div>
          <div className="lg:col-span-2">
            <DonationTable
              donations={filteredDonations}
              onEdit={setEditingDonation}
              onDelete={deleteDonation}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-irs-200 mt-12 py-6 text-center text-xs text-irs-400 print:hidden">
        <p>
          It&rsquo;s Deductible &mdash; Open-source donation tracker.
          All data stored locally in your browser.
        </p>
        <p className="mt-1">
          Not tax advice. Consult a qualified tax professional for guidance.
        </p>
      </footer>

      {/* Valuation Modal */}
      <ValuationModal
        isOpen={showValuation}
        onClose={() => setShowValuation(false)}
      />
    </div>
  );
}

export default App;

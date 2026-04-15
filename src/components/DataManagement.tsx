import { useRef } from 'react';
import type { DonationRecord } from '../types/donation';

const STORAGE_KEY = 'its-deductible-records-v2';

interface DataManagementProps {
  onImport: () => void; // signal parent to reload data
}

export function DataManagement({ onImport }: DataManagementProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExportJSON() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;

    const records: DonationRecord[] = JSON.parse(data);
    const exportData = {
      app: 'its-deductible',
      version: 2,
      exportedAt: new Date().toISOString(),
      recordCount: records.length,
      records,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `its-deductible-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);

        // Validate structure
        let records: DonationRecord[];
        if (raw.app === 'its-deductible' && Array.isArray(raw.records)) {
          records = raw.records;
        } else if (Array.isArray(raw)) {
          records = raw;
        } else {
          alert('Invalid backup file. Expected an It\'s Deductible JSON export.');
          return;
        }

        // Basic validation of records
        if (records.length > 0 && (!records[0].organization || !records[0].items)) {
          alert('Invalid data format. Records must have organization and items fields.');
          return;
        }

        const action = window.confirm(
          `Import ${records.length} donation record${records.length !== 1 ? 's' : ''}?\n\n` +
          'Choose OK to REPLACE all current data, or Cancel to abort.\n\n' +
          'Tip: Export a backup first if you want to keep your current data.'
        );

        if (action) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
          onImport();
        }
      } catch {
        alert('Could not read file. Make sure it\'s a valid JSON backup.');
      }

      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExportJSON}
        className="px-3 py-2 text-xs border border-irs-200 text-irs-500 rounded hover:bg-irs-50 active:bg-irs-100 transition-colors"
      >
        Backup Data
      </button>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-3 py-2 text-xs border border-irs-200 text-irs-500 rounded hover:bg-irs-50 active:bg-irs-100 transition-colors"
      >
        Restore Data
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportJSON}
        className="hidden"
      />
    </div>
  );
}

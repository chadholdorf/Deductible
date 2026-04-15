import { useState, useEffect, useCallback } from 'react';
import type { DonationRecord } from '../types/donation';
import { SAMPLE_RECORDS } from '../data/sampleData';

const STORAGE_KEY = 'its-deductible-records-v2';

function loadRecords(): DonationRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Corrupted — fall through to defaults
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_RECORDS));
  return SAMPLE_RECORDS;
}

function saveRecords(records: DonationRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function useDonations() {
  const [records, setRecords] = useState<DonationRecord[]>(loadRecords);

  useEffect(() => {
    saveRecords(records);
  }, [records]);

  const addRecord = useCallback((record: Omit<DonationRecord, 'id'>) => {
    setRecords(prev => [{ ...record, id: crypto.randomUUID() }, ...prev]);
  }, []);

  const updateRecord = useCallback((id: string, updates: Omit<DonationRecord, 'id'>) => {
    setRecords(prev => prev.map(r => (r.id === id ? { ...updates, id } : r)));
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  }, []);

  const reloadRecords = useCallback(() => {
    setRecords(loadRecords());
  }, []);

  return { records, addRecord, updateRecord, deleteRecord, reloadRecords };
}

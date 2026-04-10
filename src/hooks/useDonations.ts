import { useState, useEffect, useCallback } from 'react';
import type { Donation } from '../types/donation';
import { SAMPLE_DONATIONS } from '../data/sampleData';

const STORAGE_KEY = 'its-deductible-donations';

function loadDonations(): Donation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Corrupted data — fall through to defaults
  }
  // First load: seed with sample data
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_DONATIONS));
  return SAMPLE_DONATIONS;
}

function saveDonations(donations: Donation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(donations));
}

export function useDonations() {
  const [donations, setDonations] = useState<Donation[]>(loadDonations);

  useEffect(() => {
    saveDonations(donations);
  }, [donations]);

  const addDonation = useCallback((donation: Omit<Donation, 'id'>) => {
    const newDonation: Donation = {
      ...donation,
      id: crypto.randomUUID(),
    };
    setDonations(prev => [newDonation, ...prev]);
  }, []);

  const updateDonation = useCallback((id: string, updates: Partial<Omit<Donation, 'id'>>) => {
    setDonations(prev =>
      prev.map(d => (d.id === id ? { ...d, ...updates } : d))
    );
  }, []);

  const deleteDonation = useCallback((id: string) => {
    setDonations(prev => prev.filter(d => d.id !== id));
  }, []);

  return { donations, addDonation, updateDonation, deleteDonation };
}

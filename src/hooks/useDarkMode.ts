import { useState, useEffect } from 'react';

const STORAGE_KEY = 'its-deductible-dark-mode';

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(dark));
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return { dark, toggleDark: () => setDark(d => !d) };
}

import { useState, useRef, useEffect } from 'react';

interface CharityResult {
  ein: number;
  strein: string;
  name: string;
  city: string;
  state: string;
  address: string;
  ntee_code: string;
}

interface CharityLookupProps {
  onSelect: (name: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function CharityLookup({ onSelect, isOpen, onClose }: CharityLookupProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CharityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
      setSearched(false);
    }
  }, [isOpen]);

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `https://projects.propublica.org/nonprofits/api/v2/search.json?q=${encodeURIComponent(q)}&c_code%5Bid%5D=3`,
        { signal: controller.signal }
      );
      const data = await res.json();
      setResults((data.organizations ?? []).slice(0, 20));
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch();
  }

  function handleSelect(org: CharityResult) {
    onSelect(org.name);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-start sm:justify-center sm:pt-12 md:pt-16">
      <div className="bg-white dark:bg-gray-800 rounded-t-xl sm:rounded-xl shadow-xl w-full sm:max-w-xl sm:mx-4 h-[85vh] sm:h-auto sm:max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
              501(c)(3) Charity Lookup
            </h2>
            <button onClick={onClose}
              className="flex items-center justify-center w-10 h-10 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xl leading-none">
              &times;
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Verify an organization's tax-exempt status against the IRS database. Data from ProPublica Nonprofit Explorer.
          </p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by name (e.g., Goodwill, Red Cross)"
              className="flex-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-irs-400 min-h-[44px]"
            />
            <button
              onClick={handleSearch}
              disabled={!query.trim() || loading}
              className="px-4 py-2.5 bg-irs-700 text-white rounded-lg text-sm font-medium hover:bg-irs-800 disabled:opacity-50 min-h-[44px]"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1">
          {loading && (
            <div className="p-6 text-center text-gray-400 dark:text-gray-500">
              <div className="animate-spin inline-block w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-irs-600 rounded-full mb-2"></div>
              <p className="text-sm">Searching IRS database...</p>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="p-6 text-center text-gray-400 dark:text-gray-500">
              <p className="text-sm">No 501(c)(3) organizations found.</p>
              <p className="text-xs mt-1">Try a different name or check the spelling.</p>
            </div>
          )}

          {!loading && results.map(org => (
            <button
              key={org.ein}
              onClick={() => handleSelect(org)}
              className="w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 transition-colors min-h-[52px]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded text-[10px] font-bold flex-shrink-0">
                      501(c)(3)
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                      {org.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {[org.city, org.state].filter(Boolean).join(', ')}
                    {org.address && <span className="ml-1 text-gray-400">— {org.address}</span>}
                  </div>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-mono flex-shrink-0 mt-1">
                  EIN: {org.strein}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 text-center text-[10px] text-gray-400 dark:text-gray-500">
            Data from ProPublica Nonprofit Explorer / IRS Exempt Organizations database
          </div>
        )}
      </div>
    </div>
  );
}

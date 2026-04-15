import { useState, useEffect, useRef } from 'react';
import type { Donation, DonationCategory } from '../types/donation';
import { CATEGORY_LABELS } from '../types/donation';
import type { ValuationItem } from '../types/donation';
import valuationGuide from '../data/valuationGuide.json';
import { findNearbyDonationPlaces } from '../utils/nearbyPlaces';
import type { NearbyPlace } from '../utils/nearbyPlaces';

const guide = valuationGuide as ValuationItem[];

const VALUATION_CATEGORY_MAP: Partial<Record<DonationCategory, string[]>> = {
  clothing: ["Men's Clothing", "Women's Clothing", "Children's Clothing"],
  household: ['Household Items'],
  electronics: ['Electronics'],
  furniture: ['Furniture'],
  appliances: ['Appliances'],
  books_media_toys: ['Books, Media & Toys'],
};

type NearbyStatus = 'idle' | 'locating' | 'searching' | 'done' | 'error';

interface DonationFormProps {
  onSubmit: (donation: Omit<Donation, 'id'>) => void;
  editingDonation?: Donation | null;
  onCancelEdit?: () => void;
}

export function DonationForm({ onSubmit, editingDonation, onCancelEdit }: DonationFormProps) {
  const [organization, setOrganization] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<DonationCategory>('cash');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [description, setDescription] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [suggestedRange, setSuggestedRange] = useState<{ low: number; high: number } | null>(null);

  // Nearby lookup state
  const [nearbyStatus, setNearbyStatus] = useState<NearbyStatus>('idle');
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [nearbyError, setNearbyError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingDonation) {
      setOrganization(editingDonation.organization);
      setDate(editingDonation.date);
      setCategory(editingDonation.category);
      setEstimatedValue(String(editingDonation.estimatedValue));
      setDescription(editingDonation.description);
      setSelectedItem('');
      setSuggestedRange(null);
    }
  }, [editingDonation]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleFindNearby() {
    setNearbyError('');
    setNearbyPlaces([]);
    setShowDropdown(false);
    setNearbyStatus('locating');

    let coords: GeolocationCoordinates;
    try {
      coords = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          pos => resolve(pos.coords),
          err => reject(err),
          { timeout: 10000 }
        );
      });
    } catch {
      setNearbyStatus('error');
      setNearbyError('Location access denied. Please allow location access and try again.');
      return;
    }

    setNearbyStatus('searching');
    try {
      const places = await findNearbyDonationPlaces(coords.latitude, coords.longitude);
      if (places.length === 0) {
        setNearbyStatus('error');
        setNearbyError('No donation centers found nearby. Try typing a name manually.');
      } else {
        setNearbyPlaces(places);
        setNearbyStatus('done');
        setShowDropdown(true);
      }
    } catch {
      setNearbyStatus('error');
      setNearbyError('Search failed. Check your connection and try again.');
    }
  }

  function handleSelectPlace(place: NearbyPlace) {
    setOrganization(place.name);
    setShowDropdown(false);
    setNearbyStatus('idle');
    if (place.address && !description) {
      setDescription(place.address);
    }
  }

  const availableItems = VALUATION_CATEGORY_MAP[category]
    ? guide.filter(g => VALUATION_CATEGORY_MAP[category]!.includes(g.category))
    : [];

  function handleItemSelect(itemName: string) {
    setSelectedItem(itemName);
    const match = guide.find(
      g => g.item === itemName && VALUATION_CATEGORY_MAP[category]?.includes(g.category)
    );
    if (match) {
      setSuggestedRange({ low: match.low, high: match.high });
      if (!estimatedValue) {
        setEstimatedValue(String(Math.round((match.low + match.high) / 2)));
      }
    } else {
      setSuggestedRange(null);
    }
  }

  function handleAcceptMid() {
    if (suggestedRange) setEstimatedValue(String(Math.round((suggestedRange.low + suggestedRange.high) / 2)));
  }
  function handleAcceptLow() {
    if (suggestedRange) setEstimatedValue(String(suggestedRange.low));
  }
  function handleAcceptHigh() {
    if (suggestedRange) setEstimatedValue(String(suggestedRange.high));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!organization.trim() || !date || !estimatedValue) return;
    const taxYear = new Date(date + 'T00:00:00').getFullYear();
    onSubmit({
      organization: organization.trim(),
      date,
      category,
      estimatedValue: parseFloat(estimatedValue),
      description: description.trim(),
      taxYear,
    });
    setOrganization('');
    setDate('');
    setCategory('cash');
    setEstimatedValue('');
    setDescription('');
    setSelectedItem('');
    setSuggestedRange(null);
    setNearbyStatus('idle');
    setNearbyPlaces([]);
  }

  function handleCancel() {
    setOrganization('');
    setDate('');
    setCategory('cash');
    setEstimatedValue('');
    setDescription('');
    setSelectedItem('');
    setSuggestedRange(null);
    setNearbyStatus('idle');
    setNearbyPlaces([]);
    onCancelEdit?.();
  }

  const isSearching = nearbyStatus === 'locating' || nearbyStatus === 'searching';

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-irs-200 rounded-lg p-6 print:hidden">
      <h2 className="text-lg font-semibold text-irs-800 mb-4 border-b border-irs-100 pb-2">
        {editingDonation ? 'Edit Donation' : 'Add Donation'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Organization Name with nearby lookup */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-irs-700 mb-1">
            Organization Name <span className="text-red-500">*</span>
          </label>
          <div className="relative" ref={dropdownRef}>
            <div className="flex gap-2">
              <input
                type="text"
                value={organization}
                onChange={e => setOrganization(e.target.value)}
                className="flex-1 border border-irs-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-irs-400 focus:border-transparent"
                placeholder="e.g., Goodwill Industries"
                required
                autoComplete="off"
              />
              <button
                type="button"
                onClick={handleFindNearby}
                disabled={isSearching}
                title="Find nearby donation centers"
                className="flex-shrink-0 px-3 py-2 border border-irs-300 rounded text-sm text-irs-600 hover:bg-irs-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
              >
                {isSearching ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-irs-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    {nearbyStatus === 'locating' ? 'Locating…' : 'Searching…'}
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Find Nearby
                  </>
                )}
              </button>
            </div>

            {/* Error message */}
            {nearbyStatus === 'error' && nearbyError && (
              <p className="mt-1.5 text-xs text-amber-600">{nearbyError}</p>
            )}

            {/* Results dropdown */}
            {showDropdown && nearbyPlaces.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-irs-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                <div className="px-3 py-2 border-b border-irs-100 text-xs text-irs-400 font-medium">
                  {nearbyPlaces.length} donation centers found nearby
                </div>
                {nearbyPlaces.map(place => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => handleSelectPlace(place)}
                    className="w-full text-left px-3 py-2.5 hover:bg-irs-50 transition-colors border-b border-irs-50 last:border-0"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-sm font-medium text-irs-800">{place.name}</span>
                      {place.distance != null && (
                        <span className="text-xs text-irs-400 flex-shrink-0 mt-0.5">
                          {place.distance} mi
                        </span>
                      )}
                    </div>
                    {place.address && (
                      <div className="text-xs text-irs-400 mt-0.5">{place.address}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-irs-700 mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border border-irs-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-irs-400 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-irs-700 mb-1">Category</label>
          <select
            value={category}
            onChange={e => {
              setCategory(e.target.value as DonationCategory);
              setSelectedItem('');
              setSuggestedRange(null);
            }}
            className="w-full border border-irs-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-irs-400 focus:border-transparent bg-white"
          >
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {availableItems.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-irs-700 mb-1">
              Item Preset <span className="text-irs-400 font-normal">(optional)</span>
            </label>
            <select
              value={selectedItem}
              onChange={e => handleItemSelect(e.target.value)}
              className="w-full border border-irs-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-irs-400 focus:border-transparent bg-white"
            >
              <option value="">— Select item for FMV suggestion —</option>
              {availableItems.map((item, i) => (
                <option key={`${item.category}-${item.item}-${i}`} value={item.item}>
                  {item.item} (${item.low}–${item.high}/{item.unit})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-irs-700 mb-1">
            Estimated Fair Market Value <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-irs-400 text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={estimatedValue}
              onChange={e => setEstimatedValue(e.target.value)}
              className="w-full border border-irs-200 rounded pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-irs-400 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>
          {suggestedRange && (
            <div className="mt-1.5 text-xs text-irs-600 bg-irs-50 rounded p-2 flex flex-wrap items-center gap-2">
              <span>Suggested FMV: ${suggestedRange.low}–${suggestedRange.high}</span>
              <button type="button" onClick={handleAcceptLow}
                className="px-2 py-0.5 bg-irs-200 hover:bg-irs-300 rounded text-irs-700 transition-colors">
                ${suggestedRange.low}
              </button>
              <button type="button" onClick={handleAcceptMid}
                className="px-2 py-0.5 bg-irs-200 hover:bg-irs-300 rounded text-irs-700 transition-colors">
                ${Math.round((suggestedRange.low + suggestedRange.high) / 2)}
              </button>
              <button type="button" onClick={handleAcceptHigh}
                className="px-2 py-0.5 bg-irs-200 hover:bg-irs-300 rounded text-irs-700 transition-colors">
                ${suggestedRange.high}
              </button>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-irs-700 mb-1">
            Description / Notes
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full border border-irs-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-irs-400 focus:border-transparent resize-y"
            placeholder="Describe items, condition, quantity..."
          />
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          className="px-5 py-2 bg-irs-700 text-white rounded hover:bg-irs-800 transition-colors text-sm font-medium"
        >
          {editingDonation ? 'Update Donation' : 'Add Donation'}
        </button>
        {editingDonation && (
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2 border border-irs-300 text-irs-600 rounded hover:bg-irs-50 transition-colors text-sm"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

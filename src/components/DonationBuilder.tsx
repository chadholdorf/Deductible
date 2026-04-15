import { useState, useEffect, useRef } from 'react';
import type { DonationCategory, DonationItem, DonationRecord, ValuationItem } from '../types/donation';
import { CATEGORY_LABELS } from '../types/donation';
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

interface DonationBuilderProps {
  editingRecord?: DonationRecord | null;
  onSave: (record: Omit<DonationRecord, 'id'>) => void;
  onCancel: () => void;
}

const EMPTY_ITEM = {
  category: 'clothing' as DonationCategory,
  itemName: '',
  quantity: 1,
  unitValue: '',
  description: '',
  selectedPreset: '',
  suggestedRange: null as { low: number; high: number } | null,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function DonationBuilder({ editingRecord, onSave, onCancel }: DonationBuilderProps) {
  const [items, setItems] = useState<DonationItem[]>(editingRecord?.items ?? []);
  const [organization, setOrganization] = useState(editingRecord?.organization ?? '');
  const [date, setDate] = useState(editingRecord?.date ?? '');
  const [errors, setErrors] = useState<string[]>([]);

  // Item form state
  const [form, setForm] = useState({ ...EMPTY_ITEM });

  // Nearby lookup
  const [nearbyStatus, setNearbyStatus] = useState<NearbyStatus>('idle');
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [nearbyError, setNearbyError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingRecord) {
      setItems(editingRecord.items);
      setOrganization(editingRecord.organization);
      setDate(editingRecord.date);
    }
  }, [editingRecord]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const availablePresets = VALUATION_CATEGORY_MAP[form.category]
    ? guide.filter(g => VALUATION_CATEGORY_MAP[form.category]!.includes(g.category))
    : [];

  function handlePresetChange(presetName: string) {
    const match = guide.find(
      g => g.item === presetName && VALUATION_CATEGORY_MAP[form.category]?.includes(g.category)
    );
    setForm(f => ({
      ...f,
      selectedPreset: presetName,
      itemName: presetName || f.itemName,
      suggestedRange: match ? { low: match.low, high: match.high } : null,
      unitValue: match && !f.unitValue
        ? String(Math.round((match.low + match.high) / 2))
        : f.unitValue,
    }));
  }

  function handleCategoryChange(cat: DonationCategory) {
    setForm({ ...EMPTY_ITEM, category: cat });
  }

  function handleAddItem() {
    if (!form.itemName.trim() || !form.unitValue || Number(form.unitValue) <= 0) return;
    const newItem: DonationItem = {
      id: crypto.randomUUID(),
      category: form.category,
      itemName: form.itemName.trim(),
      quantity: Math.max(1, Math.round(form.quantity)),
      unitValue: parseFloat(form.unitValue),
      description: form.description.trim(),
    };
    setItems(prev => [...prev, newItem]);
    setForm({ ...EMPTY_ITEM, category: form.category }); // keep category for rapid entry
  }

  function handleRemoveItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function handleSave() {
    const errs: string[] = [];
    if (items.length === 0) errs.push('Add at least one item to the list.');
    if (!organization.trim()) errs.push('Organization name is required.');
    if (!date) errs.push('Date is required.');
    setErrors(errs);
    if (errs.length) return;

    const taxYear = new Date(date + 'T00:00:00').getFullYear();
    onSave({ organization: organization.trim(), date, taxYear, items });
  }

  // Nearby lookup
  async function handleFindNearby() {
    setNearbyError('');
    setNearbyPlaces([]);
    setShowDropdown(false);
    setNearbyStatus('locating');
    let coords: GeolocationCoordinates;
    try {
      coords = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(pos => resolve(pos.coords), reject, { timeout: 10000 });
      });
    } catch {
      setNearbyStatus('error');
      setNearbyError('Location access denied. Allow location access and try again.');
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
  }

  const runningTotal = items.reduce((sum, i) => sum + i.quantity * i.unitValue, 0);
  const isSearching = nearbyStatus === 'locating' || nearbyStatus === 'searching';
  const canAddItem = form.itemName.trim() && form.unitValue && Number(form.unitValue) > 0;

  return (
    <div className="bg-white border border-irs-200 rounded-lg overflow-hidden print:hidden">
      {/* Header */}
      <div className="bg-irs-800 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">
            {editingRecord ? 'Edit Donation List' : 'New Donation List'}
          </h2>
          <p className="text-irs-300 text-xs mt-0.5">Add items below, then choose where and when you donated.</p>
        </div>
        {items.length > 0 && (
          <div className="text-right">
            <div className="text-irs-300 text-xs">Running Total</div>
            <div className="text-xl font-bold font-mono">{formatCurrency(runningTotal)}</div>
          </div>
        )}
      </div>

      {/* ── STEP 1: Add Items ── */}
      <div className="p-6 border-b border-irs-100">
        <h3 className="text-sm font-semibold text-irs-700 mb-3 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-irs-700 text-white text-xs font-bold">1</span>
          Add Items
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-irs-600 mb-1">Category</label>
            <select
              value={form.category}
              onChange={e => handleCategoryChange(e.target.value as DonationCategory)}
              className="w-full border border-irs-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-irs-400"
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {availablePresets.length > 0 ? (
            <div>
              <label className="block text-xs font-medium text-irs-600 mb-1">Item</label>
              <select
                value={form.selectedPreset}
                onChange={e => handlePresetChange(e.target.value)}
                className="w-full border border-irs-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-irs-400"
              >
                <option value="">— Select or type below —</option>
                {availablePresets.map((item, i) => (
                  <option key={`${item.category}-${item.item}-${i}`} value={item.item}>
                    {item.item} (${item.low}–${item.high}/{item.unit})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-irs-600 mb-1">Item Name</label>
              <input
                type="text"
                value={form.itemName}
                onChange={e => setForm(f => ({ ...f, itemName: e.target.value }))}
                className="w-full border border-irs-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-irs-400"
                placeholder="Describe the item"
              />
            </div>
          )}

          {availablePresets.length > 0 && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-irs-600 mb-1">Custom Item Name <span className="text-irs-400">(optional — overrides preset)</span></label>
              <input
                type="text"
                value={form.itemName}
                onChange={e => setForm(f => ({ ...f, itemName: e.target.value }))}
                className="w-full border border-irs-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-irs-400"
                placeholder={form.selectedPreset || 'Item description'}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-irs-600 mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
              className="w-full border border-irs-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-irs-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-irs-600 mb-1">
              Value per item
              {form.suggestedRange && (
                <span className="text-irs-400 font-normal ml-1">
                  (suggested ${form.suggestedRange.low}–${form.suggestedRange.high})
                </span>
              )}
            </label>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2 text-irs-400 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.unitValue}
                  onChange={e => setForm(f => ({ ...f, unitValue: e.target.value }))}
                  className="w-full border border-irs-200 rounded pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-irs-400"
                  placeholder="0.00"
                />
              </div>
              {form.suggestedRange && (
                <div className="flex gap-1">
                  {[form.suggestedRange.low, Math.round((form.suggestedRange.low + form.suggestedRange.high) / 2), form.suggestedRange.high].map(v => (
                    <button key={v} type="button"
                      onClick={() => setForm(f => ({ ...f, unitValue: String(v) }))}
                      className="px-2 py-1.5 bg-irs-100 hover:bg-irs-200 rounded text-xs text-irs-700 transition-colors">
                      ${v}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {form.unitValue && form.quantity > 1 && (
              <p className="mt-1 text-xs text-irs-400">
                Subtotal: {formatCurrency(parseFloat(form.unitValue || '0') * form.quantity)}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-irs-600 mb-1">Notes <span className="text-irs-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-irs-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-irs-400"
              placeholder="Condition, color, brand..."
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddItem}
          disabled={!canAddItem}
          className="mt-3 px-4 py-2 bg-irs-600 text-white rounded hover:bg-irs-700 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add to List
        </button>
      </div>

      {/* ── Item List ── */}
      {items.length > 0 && (
        <div className="p-6 border-b border-irs-100 bg-irs-50/40">
          <h3 className="text-sm font-semibold text-irs-700 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-irs-700 text-white text-xs font-bold">2</span>
              Your List
              <span className="text-irs-400 font-normal">({items.length} item{items.length !== 1 ? 's' : ''})</span>
            </span>
            <span className="font-mono font-bold text-irs-800">{formatCurrency(runningTotal)}</span>
          </h3>
          <div className="space-y-1">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-white rounded border border-irs-100 px-3 py-2 text-sm">
                <span className="flex-shrink-0 px-1.5 py-0.5 bg-irs-100 text-irs-600 rounded text-xs">
                  {CATEGORY_LABELS[item.category]}
                </span>
                <span className="flex-1 text-irs-800 min-w-0 truncate">
                  {item.quantity > 1 && <span className="text-irs-500 mr-1">{item.quantity}×</span>}
                  {item.itemName}
                  {item.description && <span className="text-irs-400 ml-1 text-xs">— {item.description}</span>}
                </span>
                <span className="flex-shrink-0 font-mono text-irs-700 font-medium">
                  {formatCurrency(item.quantity * item.unitValue)}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="flex-shrink-0 text-irs-300 hover:text-red-500 transition-colors ml-1"
                  title="Remove item"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end">
            <div className="text-sm text-irs-500">
              Total: <span className="font-mono font-bold text-irs-800 text-base">{formatCurrency(runningTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Where & When ── */}
      <div className="p-6 border-b border-irs-100">
        <h3 className="text-sm font-semibold text-irs-700 mb-3 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-irs-700 text-white text-xs font-bold">
            {items.length > 0 ? '3' : '2'}
          </span>
          Where &amp; When
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-irs-600 mb-1">
              Organization <span className="text-red-400">*</span>
            </label>
            <div className="relative" ref={dropdownRef}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={organization}
                  onChange={e => setOrganization(e.target.value)}
                  className="flex-1 border border-irs-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-irs-400"
                  placeholder="e.g., Goodwill Industries"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={handleFindNearby}
                  disabled={isSearching}
                  className="flex-shrink-0 px-3 py-2 border border-irs-300 rounded text-sm text-irs-600 hover:bg-irs-50 transition-colors disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                >
                  {isSearching ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      {nearbyStatus === 'locating' ? 'Locating…' : 'Searching…'}
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Find Nearby
                    </>
                  )}
                </button>
              </div>

              {nearbyStatus === 'error' && nearbyError && (
                <p className="mt-1 text-xs text-amber-600">{nearbyError}</p>
              )}

              {showDropdown && nearbyPlaces.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-irs-200 rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto">
                  <div className="px-3 py-2 border-b border-irs-100 text-xs text-irs-400 font-medium">
                    {nearbyPlaces.length} donation centers nearby
                  </div>
                  {nearbyPlaces.map(place => (
                    <button key={place.id} type="button" onClick={() => handleSelectPlace(place)}
                      className="w-full text-left px-3 py-2.5 hover:bg-irs-50 transition-colors border-b border-irs-50 last:border-0">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-sm font-medium text-irs-800">{place.name}</span>
                        {place.distance != null && (
                          <span className="text-xs text-irs-400 flex-shrink-0 mt-0.5">{place.distance} mi</span>
                        )}
                      </div>
                      {place.address && <div className="text-xs text-irs-400 mt-0.5">{place.address}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-irs-600 mb-1">
              Donation Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-irs-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-irs-400"
            />
          </div>

          {items.length > 0 && organization && date && (
            <div className="flex items-end">
              <div className="text-sm text-irs-500 pb-2">
                Total to save: <span className="font-mono font-bold text-irs-800">{formatCurrency(runningTotal)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          <ul className="list-disc list-inside space-y-0.5">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="p-6 flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2 bg-irs-700 text-white rounded hover:bg-irs-800 transition-colors text-sm font-medium"
        >
          {editingRecord ? 'Update Donation' : 'Save Donation'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 border border-irs-300 text-irs-600 rounded hover:bg-irs-50 transition-colors text-sm"
        >
          {editingRecord ? 'Cancel' : 'Discard'}
        </button>
      </div>
    </div>
  );
}

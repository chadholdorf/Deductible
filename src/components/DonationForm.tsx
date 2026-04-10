import { useState, useEffect } from 'react';
import type { Donation, DonationCategory } from '../types/donation';
import { CATEGORY_LABELS } from '../types/donation';
import type { ValuationItem } from '../types/donation';
import valuationGuide from '../data/valuationGuide.json';

const guide = valuationGuide as ValuationItem[];

const VALUATION_CATEGORY_MAP: Partial<Record<DonationCategory, string[]>> = {
  clothing: ["Men's Clothing", "Women's Clothing", "Children's Clothing"],
  household: ['Household Items'],
  electronics: ['Electronics'],
  furniture: ['Furniture'],
  appliances: ['Appliances'],
  books_media_toys: ['Books, Media & Toys'],
};

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

  const availableItems = VALUATION_CATEGORY_MAP[category]
    ? guide.filter(g => VALUATION_CATEGORY_MAP[category]!.includes(g.category))
    : [];

  function handleItemSelect(itemName: string) {
    setSelectedItem(itemName);
    const match = guide.find(g =>
      g.item === itemName && VALUATION_CATEGORY_MAP[category]?.includes(g.category)
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
    if (suggestedRange) {
      setEstimatedValue(String(Math.round((suggestedRange.low + suggestedRange.high) / 2)));
    }
  }

  function handleAcceptLow() {
    if (suggestedRange) {
      setEstimatedValue(String(suggestedRange.low));
    }
  }

  function handleAcceptHigh() {
    if (suggestedRange) {
      setEstimatedValue(String(suggestedRange.high));
    }
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

    // Reset
    setOrganization('');
    setDate('');
    setCategory('cash');
    setEstimatedValue('');
    setDescription('');
    setSelectedItem('');
    setSuggestedRange(null);
  }

  function handleCancel() {
    setOrganization('');
    setDate('');
    setCategory('cash');
    setEstimatedValue('');
    setDescription('');
    setSelectedItem('');
    setSuggestedRange(null);
    onCancelEdit?.();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-irs-200 rounded-lg p-6 print:hidden">
      <h2 className="text-lg font-semibold text-irs-800 mb-4 border-b border-irs-100 pb-2">
        {editingDonation ? 'Edit Donation' : 'Add Donation'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-irs-700 mb-1">
            Organization Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={organization}
            onChange={e => setOrganization(e.target.value)}
            className="w-full border border-irs-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-irs-400 focus:border-transparent"
            placeholder="e.g., Goodwill Industries"
            required
          />
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

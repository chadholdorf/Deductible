export type DonationCategory =
  | 'cash'
  | 'clothing'
  | 'household'
  | 'electronics'
  | 'furniture'
  | 'appliances'
  | 'books_media_toys'
  | 'vehicle'
  | 'mileage'
  | 'other';

/** IRS standard mileage rate for charitable service (per mile) */
export const CHARITY_MILEAGE_RATE = 0.14;

export type ItemCondition = 'high' | 'good' | 'fair' | 'poor';

export const CONDITION_LABELS: Record<ItemCondition, string> = {
  high: 'High',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

export interface DonationItem {
  id: string;
  category: DonationCategory;
  itemName: string;
  quantity: number;
  unitValue: number;
  description: string;
  condition?: ItemCondition;
}

/** One donation trip — items given to one organization on one date */
export interface DonationRecord {
  id: string;
  organization: string;
  date: string; // YYYY-MM-DD
  taxYear: number;
  items: DonationItem[];
}

export function recordTotal(record: DonationRecord): number {
  return record.items.reduce((sum, item) => sum + item.quantity * item.unitValue, 0);
}

export interface ValuationItem {
  category: string;
  item: string;
  low: number;
  high: number;
  unit: string;
}

export const CATEGORY_LABELS: Record<DonationCategory, string> = {
  cash: 'Cash',
  clothing: 'Clothing',
  household: 'Household Items',
  electronics: 'Electronics',
  furniture: 'Furniture',
  appliances: 'Appliances',
  books_media_toys: 'Books, Media & Toys',
  vehicle: 'Vehicle',
  mileage: 'Volunteer Mileage',
  other: 'Other',
};

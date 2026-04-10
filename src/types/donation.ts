export type DonationCategory =
  | 'cash'
  | 'clothing'
  | 'household'
  | 'electronics'
  | 'furniture'
  | 'appliances'
  | 'books_media_toys'
  | 'vehicle'
  | 'other';

export interface Donation {
  id: string;
  organization: string;
  date: string; // ISO date string YYYY-MM-DD
  category: DonationCategory;
  estimatedValue: number;
  description: string;
  taxYear: number;
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
  other: 'Other',
};

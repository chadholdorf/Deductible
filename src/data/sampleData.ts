import type { DonationRecord } from '../types/donation';

export const SAMPLE_RECORDS: DonationRecord[] = [
  {
    id: 'sample-1',
    organization: 'Goodwill Industries',
    date: '2024-03-15',
    taxYear: 2024,
    items: [
      { id: 's1-1', category: 'clothing', itemName: "Men's Dress Shirt", quantity: 3, unitValue: 8, description: '' },
      { id: 's1-2', category: 'clothing', itemName: "Men's Jeans", quantity: 2, unitValue: 8, description: '' },
      { id: 's1-3', category: 'clothing', itemName: 'Winter Jacket', quantity: 1, unitValue: 22, description: '' },
    ],
  },
  {
    id: 'sample-2',
    organization: 'Salvation Army',
    date: '2024-06-22',
    taxYear: 2024,
    items: [
      { id: 's2-1', category: 'furniture', itemName: 'Bed Frame (full/queen)', quantity: 1, unitValue: 65, description: 'Good condition' },
      { id: 's2-2', category: 'furniture', itemName: 'Nightstand', quantity: 2, unitValue: 20, description: '' },
    ],
  },
  {
    id: 'sample-3',
    organization: 'Local Public Library',
    date: '2024-09-10',
    taxYear: 2024,
    items: [
      { id: 's3-1', category: 'books_media_toys', itemName: 'Hardcover Book', quantity: 12, unitValue: 3, description: '' },
      { id: 's3-2', category: 'books_media_toys', itemName: 'DVD Movie', quantity: 8, unitValue: 2, description: '' },
    ],
  },
  {
    id: 'sample-4',
    organization: 'Habitat for Humanity ReStore',
    date: '2024-11-02',
    taxYear: 2024,
    items: [
      { id: 's4-1', category: 'appliances', itemName: 'Microwave', quantity: 1, unitValue: 25, description: 'Working' },
      { id: 's4-2', category: 'appliances', itemName: 'Vacuum Cleaner (upright)', quantity: 1, unitValue: 35, description: '' },
      { id: 's4-3', category: 'appliances', itemName: 'Coffee Maker', quantity: 1, unitValue: 12, description: '' },
    ],
  },
  {
    id: 'sample-5',
    organization: 'United Way',
    date: '2024-12-28',
    taxYear: 2024,
    items: [
      { id: 's5-1', category: 'cash', itemName: 'Cash Donation', quantity: 1, unitValue: 250, description: 'Year-end contribution — check #1042' },
    ],
  },
  {
    id: 'sample-6',
    organization: 'Vietnam Veterans of America',
    date: '2023-04-18',
    taxYear: 2023,
    items: [
      { id: 's6-1', category: 'household', itemName: 'Dish Set (service for 8)', quantity: 1, unitValue: 22, description: '' },
      { id: 's6-2', category: 'household', itemName: 'Bath Towel', quantity: 6, unitValue: 3, description: '' },
      { id: 's6-3', category: 'household', itemName: 'Bed Sheets (set)', quantity: 2, unitValue: 8, description: '' },
    ],
  },
  {
    id: 'sample-7',
    organization: 'Goodwill Industries',
    date: '2023-08-05',
    taxYear: 2023,
    items: [
      { id: 's7-1', category: 'electronics', itemName: 'Laptop Computer', quantity: 1, unitValue: 75, description: 'Dell, 2019' },
      { id: 's7-2', category: 'electronics', itemName: 'Keyboard / Mouse', quantity: 1, unitValue: 8, description: 'Wireless' },
    ],
  },
  {
    id: 'sample-8',
    organization: 'St. Vincent de Paul',
    date: '2023-12-20',
    taxYear: 2023,
    items: [
      { id: 's8-1', category: 'clothing', itemName: 'Winter Jacket', quantity: 1, unitValue: 28, description: "Women's" },
      { id: 's8-2', category: 'clothing', itemName: 'Casual Dress', quantity: 3, unitValue: 10, description: '' },
      { id: 's8-3', category: 'clothing', itemName: 'Dress Shoes', quantity: 2, unitValue: 13, description: "Women's" },
      { id: 's8-4', category: 'clothing', itemName: 'Handbag', quantity: 1, unitValue: 15, description: '' },
    ],
  },
];

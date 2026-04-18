# It's Deductible

**Free, open-source charitable donation tracker for tax preparation. A local replacement for Intuit's ItsDeductible (shut down Oct 2025).**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with React](https://img.shields.io/badge/Built_with-React-61DAFB.svg)](https://react.dev)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/chadholdorf/deductible/pulls)

## What is this?

Intuit's ItsDeductible was a popular free tool that helped taxpayers track charitable donations and estimate fair market values throughout the year. It was shut down in October 2025, leaving millions of users without a simple way to log donations for tax time.

**It's Deductible** is a free, open-source replacement. It runs entirely in your browser with no accounts, no cloud storage, and no data collection. Your donation data stays on your device in localStorage. Period.

## How It Works

### 1. Start a New Donation

Click **New Donation** to begin. Each donation represents one trip to a donation center.

### 2. Search and Add Items

Type in the search box to find items from the built-in valuation guide (269 items with FMV ranges). The app auto-fills the category, item name, suggested value range, and condition. Changing the condition (High/Good/Fair/Poor) automatically updates the suggested value. You can also browse by category or enter items manually. Edit any item in the list before saving.

### 3. Pick Where and When

Enter the organization name — recently used orgs appear as quick-select options. Use **Find Nearby** to search for local donation centers via OpenStreetMap (text you've typed is used as a search hint), or use **501(c)(3)** to verify an organization's tax-exempt status via ProPublica. Add the charity's address if your non-cash total exceeds $500 (required for Form 8283). The date defaults to today.

### 4. Save

Click **Save Donation** and the whole list is stored. Repeat throughout the year.

### 5. Review and Export

At year end, review your history sorted by date, amount, or charity. The **Tax Insights** panel shows totals by category, estimated tax savings by bracket, itemizing vs. standard deduction guidance, and IRS threshold warnings. Export your data:

- **CSV** — full detail for your tax preparer or Google Sheets
- **TurboTax (.txf)** — import directly into TurboTax
- **PDF** — formatted "YTD Charitable Deductions" report with Non-Cash and Cash sections
- **Backup / Restore** — full JSON export and import for safekeeping

## Features

- **Donation list builder** — step-by-step flow: add items, then assign organization and date
- **Built-in FMV valuation guide** — 269 items across 8 categories, updated to 2025 Salvation Army/Goodwill values
- **Item search** — filters the entire guide as you type
- **Inline item editing** — edit any item in the list before saving
- **Smart presets** — auto-suggest FMV ranges with low/mid/high quick-pick buttons
- **Condition → value mapping** — changing High/Good/Fair/Poor instantly updates the suggested value
- **Volunteer mileage** — built-in IRS charitable mileage rate ($0.14/mile)
- **Nearby donation center lookup** — uses your location + typed text via OpenStreetMap and Nominatim
- **501(c)(3) verification** — search the IRS database via ProPublica Nonprofit Explorer
- **Recent organizations** — previously used org names appear as quick-select when you focus the field
- **Organization address** — stored per donation, auto-filled from lookup, shown in reports (required for Form 8283)
- **Tax year filtering** — view any past year's donations separately
- **Estimated savings** — live on the homepage hero card, bracket selector persists across sessions
- **Tax Insights panel** — collapsible, includes savings calculator, standard deduction comparison, IRS warnings
- **Tiered IRS warnings** — contextual alerts at $250 (receipt required), $500 (Form 8283), and $5,000 (appraisal)
- **Sort tabs** — sort history by date, amount, or charity name (shown when 2+ donations exist)
- **CSV export** — full detail (date, org, address, category, item, condition, qty, value, notes)
- **TXF export** — TurboTax-compatible format with IRS codes 488 (cash) and 489 (non-cash)
- **PDF report** — matches the ItsDeductible "YTD Charitable Deductions" format with org addresses
- **JSON backup/restore** — full data export and import
- **Edit and delete** — any saved donation
- **Dark mode** — respects system preference, toggleable
- **Mobile-first** — responsive design with 44px+ touch targets
- **Zero backend** — all data in localStorage, no accounts, no tracking

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm (included with Node.js)

### Install and Run

```bash
git clone https://github.com/chadholdorf/Deductible.git
cd Deductible
npm install
npm run dev
```

The app will be available at `http://localhost:5173/`.

### Build for Production

```bash
npm run build
```

Output goes to the `dist/` directory. Deploy anywhere that serves static files.

## Deploy

### Vercel (recommended)

1. Push the repo to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Deploy with default settings — no configuration needed

### GitHub Pages

This repo includes a GitHub Actions workflow that auto-deploys on push to `main`.

1. Go to **Settings > Pages** in your GitHub repo
2. Under **Source**, select **GitHub Actions**
3. Push to `main` and the workflow handles the rest

## Data and Privacy

All data stays in your browser's localStorage. There is no backend, no database, no analytics, no cookies, no tracking.

- **One user per browser** — whoever opens the app sees the same data
- **Not synced across devices** — Chrome on your laptop and Safari on your phone are separate
- **Clearable** — if you clear browser data, donations are gone (use Backup Data first)

**Tip:** Use **Backup Data** periodically to export a JSON file and save it to Google Drive or Dropbox.

## Value Reference Data

The built-in FMV guide (`src/data/valuationGuide.json`) contains 269 items across 8 categories:

| Category | Items |
|---|---|
| Men's Clothing | 32 |
| Women's Clothing | 38 |
| Children's Clothing | 20 |
| Furniture | 36 |
| Household Items | 36 |
| Electronics | 28 |
| Appliances | 32 |
| Books, Media & Toys | 47 |

Values are aligned with 2025 published guides from the Salvation Army, Goodwill, and IRS Publication 561.

> **Important:** These are guidelines. The IRS requires you to determine fair market value based on each item's specific condition. Consult a qualified tax professional when in doubt.

## Tech Stack

- [React](https://react.dev) 18 + [TypeScript](https://www.typescriptlang.org/) (strict)
- [Vite](https://vitejs.dev) for builds
- [Tailwind CSS](https://tailwindcss.com) for styling
- localStorage for all persistence
- [OpenStreetMap Overpass API](https://overpass-api.de/) + [Nominatim](https://nominatim.org/) for nearby search
- [ProPublica Nonprofit Explorer API](https://projects.propublica.org/nonprofits/) for 501(c)(3) lookup
- No backend, no database, no auth

## What to Build Next

1. **Photo/receipt capture** — attach a photo of the receipt for audit trail
2. **Recurring donations** — auto-populate for regular giving
3. **Multi-year trend view** — year-over-year donation comparison chart
4. **PWA support** — offline-capable with service worker for use at donation centers
5. **FMV guide updates** — mechanism to refresh valuation data beyond 2025

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Make your changes and commit
4. Push to your fork: `git push origin my-feature`
5. Open a pull request

Keep PRs focused on a single change. If adding valuation items, include a source for the FMV ranges.

## License

[MIT](LICENSE)

## Disclaimer

This software is provided for informational purposes only. It is **not tax advice**. The fair market values in the built-in guide are estimates based on publicly available donation value guidelines and may not reflect the actual value of your specific items. Always consult a qualified tax professional for guidance on charitable deductions. The authors are not responsible for any tax filing decisions made using this tool.

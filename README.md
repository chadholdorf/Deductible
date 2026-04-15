# It's Deductible

**Free, open-source charitable donation tracker for tax preparation. A local replacement for Intuit's ItsDeductible (shut down Oct 2025).**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with React](https://img.shields.io/badge/Built_with-React-61DAFB.svg)](https://react.dev)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/chadholdorf/deductible/pulls)

## What is this?

Intuit's ItsDeductible was a popular free tool that helped taxpayers track charitable donations and estimate fair market values throughout the year. It was shut down in October 2025, leaving millions of users without a simple way to log donations for tax time.

**It's Deductible** is a free, open-source replacement. It runs entirely in your browser with no accounts, no cloud storage, and no data collection. Your donation data stays on your device in localStorage. Period.

## How It Works

The app follows a simple workflow that mirrors how people actually donate:

### 1. Start a New Donation List

Click "Start New Donation List" to begin. Each list represents one trip to a donation center.

### 2. Search and Add Items

Type in the search box to find items from the built-in valuation guide (269 items with FMV ranges). The app auto-fills the category, item name, suggested value, and lets you set the condition (High/Good/Fair/Poor) and quantity. You can also enter items manually.

Keep clicking "Add to List" for each item. The running total updates as you go.

### 3. Pick Where and When

Once your item list is complete, enter the organization name (or use "Find Nearby" to search for local donation centers via OpenStreetMap) and the date.

### 4. Save

Click "Save Donation" and the whole list is stored. Repeat throughout the year as you make more donations.

### 5. Review and Export

At year end, your Summary panel shows totals by category, estimated tax savings based on your bracket, and IRS threshold warnings (Form 8283, appraisal requirements). You can:

- **Export CSV** for your tax preparer or to open in Google Sheets
- **Print Report** to get a formatted "YTD Charitable Deductions" summary matching the original ItsDeductible report format, split into Non-Cash and Cash sections with subtotals per charity

## Features

- **Donation list builder** with a step-by-step flow: add items, then assign organization and date
- **Built-in FMV valuation guide** with 269 items across 8 categories, updated to 2025 Salvation Army/Goodwill values
- **Item search** that filters the entire guide as you type
- **Smart presets** that auto-suggest fair market value ranges with low/mid/high quick-pick buttons
- **Item condition tracking** (High, Good, Fair, Poor) per item
- **Nearby donation center lookup** using your location and OpenStreetMap data
- **Tax year filtering** with running totals by category
- **Tax Insights panel** with estimated savings by bracket, itemizing vs. standard deduction guidance, Form 8283 and appraisal warnings
- **CSV export** with full detail (date, org, category, item, condition, qty, value, notes)
- **Print report** matching the ItsDeductible "YTD Charitable Deductions" format
- **Edit and delete** any saved donation
- **Mobile-friendly** responsive design with 44px+ touch targets
- **Sample data included** (8 donations across 2023-2024) so the app is useful on first load
- **Zero backend** — all data in localStorage, no accounts, no tracking

## Screenshots

> Add screenshots here

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm (included with Node.js)

### Install and Run

```bash
git clone https://github.com/chadholdorf/deductible.git
cd deductible
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

> **Note:** For GitHub Pages, update the `GITHUB_PAGES` env var handling in `vite.config.ts` if your repo name differs from `deductible`.

## Data and Privacy

All data stays in your browser's localStorage. There is no backend, no database, no analytics, no cookies, no tracking.

- **One user per browser** — whoever opens the app sees the same data
- **Not synced across devices** — Chrome on your laptop and Safari on your phone are separate
- **Clearable** — if you clear browser data, donations are gone (export CSV first as a backup)

**Tip:** Periodically export the CSV and save it to Google Drive or Dropbox as a backup.

## Value Reference Data

The built-in FMV guide at `src/data/valuationGuide.json` contains 269 items across 8 categories:

- Men's Clothing (32 items)
- Women's Clothing (38 items)
- Children's Clothing (20 items)
- Furniture (36 items)
- Household Items (36 items)
- Electronics (28 items)
- Appliances (32 items)
- Books, Media & Toys (47 items)

Values are aligned with 2025 published guides from the Salvation Army, Goodwill, and IRS Publication 561 for items in good, used condition.

> **Important:** These values are guidelines. The IRS requires you to determine the fair market value of each donated item based on its specific condition. When in doubt, consult a qualified tax professional.

## Tech Stack

- [React](https://react.dev) 18 + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev) for builds
- [Tailwind CSS](https://tailwindcss.com) for styling
- localStorage for persistence
- [OpenStreetMap Overpass API](https://overpass-api.de/) for nearby search (no API key needed)
- No backend, no database, no auth

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Make your changes and commit
4. Push to your fork: `git push origin my-feature`
5. Open a pull request

Keep PRs focused on a single change. If adding new valuation items, include a source for the FMV ranges.

## License

[MIT](LICENSE)

## Disclaimer

This software is provided for informational purposes only. It is **not tax advice**. The fair market values in the built-in guide are estimates based on publicly available donation value guidelines and may not reflect the actual value of your specific items. Always consult a qualified tax professional for guidance on charitable deductions. The authors are not responsible for any tax filing decisions made using this tool.

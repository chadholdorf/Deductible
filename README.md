# It's Deductible

**Free, open-source charitable donation tracker for tax preparation.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with React](https://img.shields.io/badge/Built_with-React-61DAFB.svg)](https://react.dev)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/chadholdorf/deductible/pulls)

## What is this?

Intuit's ItsDeductible was a popular free tool that helped taxpayers track charitable donations and estimate fair market values throughout the year. It was shut down in October 2025, leaving millions of users without a simple way to log donations for tax time.

**It's Deductible** is a free, open-source replacement. It runs entirely in your browser with no accounts, no cloud storage, and no data collection. Your donation data stays on your device in localStorage. Period.

## Features

- **Donation logging** with organization name, date, category, estimated fair market value, and notes
- **Built-in FMV valuation guide** with 250+ items based on Salvation Army and Goodwill donation value guidelines
- **Smart item presets** that auto-suggest fair market value ranges when you pick a category and item
- **Searchable value reference modal** so you can browse the full guide before adding items
- **Tax year filtering** to view and manage donations across multiple years
- **Running totals** broken down by category with a grand total
- **Edit and delete** any donation entry
- **CSV export** for easy import into tax prep software
- **Print-friendly summary** with clean print CSS for paper records
- **Mobile-friendly** responsive design
- **Sample data included** so the app is useful on first load

## Screenshots

> Add screenshots here

## Getting Started (Local)

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm (included with Node.js)

### Install and run

```bash
git clone https://github.com/chadholdorf/deductible.git
cd deductible
npm install
npm run dev
```

The app will be available at `http://localhost:5173/deductible/`.

### Build for production

```bash
npm run build
```

Output goes to the `dist/` directory.

## Deploy to GitHub Pages

This repo includes a GitHub Actions workflow that automatically builds and deploys to GitHub Pages on every push to `main`.

### Setup steps

1. Fork or push this repo to your GitHub account
2. Go to **Settings > Pages** in your repository
3. Under **Source**, select **GitHub Actions**
4. Push a commit to `main` (or re-run the workflow manually)
5. Your site will be live at `https://<your-username>.github.io/deductible/`

The workflow file is at `.github/workflows/deploy.yml`. It installs dependencies, builds the project, and deploys the `dist/` folder.

> **Note:** The `base` path in `vite.config.ts` is set to `/deductible/`. If your repo has a different name, update the `base` value to match.

## How to Use

1. **Add a donation**: Fill out the form at the top of the page with the organization name, date, category, and estimated value. Pick an item preset to get a suggested FMV range, or enter your own value.

2. **Browse the value guide**: Click the "Value Reference" button in the header to open a searchable modal with 250+ items and their fair market value ranges.

3. **View by tax year**: Use the tax year dropdown to switch between years. Totals update automatically.

4. **Edit or delete**: Click "Edit" on any row to modify it, or "Delete" to remove it.

5. **Export for tax prep**: Click "Export CSV" to download a spreadsheet of all donations for the selected tax year. Import this into TurboTax, H&R Block, or hand it to your accountant.

6. **Print a summary**: Click "Print" for a clean, printer-friendly view of your donation records.

## Value Reference Data

The built-in FMV guide lives in `src/data/valuationGuide.json`. It contains 250+ items across 8 categories:

- Men's Clothing
- Women's Clothing
- Children's Clothing
- Furniture
- Household Items
- Electronics
- Appliances
- Books, Media & Toys

Values are based on published Salvation Army and Goodwill donation value guidelines for items in good, used condition. Each entry includes a low and high fair market value range.

> **Important:** These values are guidelines only and should not be treated as tax advice. The IRS requires you to determine the fair market value of each donated item. When in doubt, consult a qualified tax professional.

## Tech Stack

- [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev) for builds
- [Tailwind CSS](https://tailwindcss.com) for styling
- localStorage for data persistence
- No backend, no database, no accounts

## Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Make your changes and commit them
4. Push to your fork: `git push origin my-feature`
5. Open a pull request

Please keep PRs focused on a single change. If you're adding new valuation items, include a source for the FMV ranges.

## License

[MIT](LICENSE)

## Disclaimer

This software is provided for informational purposes only. It is **not tax advice**. The fair market values in the built-in guide are estimates based on publicly available donation value guidelines and may not reflect the actual value of your specific items. Always consult a qualified tax professional for guidance on charitable deductions. The authors of this software are not responsible for any tax filing decisions made using this tool.

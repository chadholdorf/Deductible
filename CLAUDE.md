# It's Deductible — ItsDeductible Revival

## Stack
- React 18 + TypeScript (strict) — Vite 6.0.3 SPA
- Tailwind CSS 3.4
- No database — 100% client-side, localStorage only
- No backend — zero-trust privacy model, all data stays on device
- External APIs: OpenStreetMap Overpass (nearby donation centers), ProPublica Nonprofit Explorer (501(c)(3) verification)
- Deployed to GitHub Pages (via Actions) or Vercel

## Data Model (localStorage key: `its-deductible-records-v2`)
- **DonationRecord** — id, organization, date, taxYear, items[]
- **DonationItem** — id, category, itemName, quantity, unitValue, description, condition (high/good/fair/poor)
- **Categories:** cash, clothing, household, electronics, furniture, appliances, books_media_toys, vehicle, mileage, other
- **Valuation guide:** static JSON (`src/data/valuationGuide.json`) with 269 items from 2025 Salvation Army/Goodwill rates
- **Sample data:** 8 pre-loaded donations in `src/data/sampleData.ts`

## Key Decisions
- Item-first workflow: add items to list, then assign org/date at save
- Mode-based UI in App.tsx (view/building/editing) — no router
- Single custom hook `useDonations()` for all CRUD + localStorage sync
- Dark mode via `useDarkMode()` hook (respects system preference)
- Mobile-first responsive design with 44px+ touch targets
- No auth, no cloud sync — intentional privacy-first design
- Mileage rate hardcoded at $0.14 (CHARITY_MILEAGE_RATE)

## Key Files
- `src/App.tsx` — root component, mode switching, all UI state
- `src/components/DonationBuilder.tsx` — largest component (31KB), step-by-step donation flow
- `src/components/CharityLookup.tsx` — OSM + ProPublica integration
- `src/components/ExportCSV.tsx`, `TXFExport.tsx`, `PrintReport.tsx` — export formats
- `src/components/ValuationModal.tsx` — FMV lookup from guide
- `src/hooks/useDonations.ts` — CRUD + persistence

## Features Complete
- Donation builder with valuation guide search (269 items)
- Nearby donation center finder (OpenStreetMap)
- 501(c)(3) charity verification (ProPublica)
- Export: CSV, TXF (TurboTax), PDF print report, JSON backup/restore
- Tax insights: savings by bracket, Form 8283 warnings, appraisal warnings, itemize vs. standard deduction
- Dark mode, sort tabs, category quick-add

## What to Build Next
1. **Photo/receipt capture** — document donations for audit trail
2. **Recurring donations** — auto-populate for regular giving
3. **Multi-year trend view** — year-over-year donation comparison chart
4. **FMV guide updates** — mechanism to refresh valuation data beyond 2025
5. **PWA support** — offline-capable with service worker for field use at donation centers
6. **Date range filtering** — beyond just tax year filter

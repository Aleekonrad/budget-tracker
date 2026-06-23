# Budget Tracker

A clean, responsive personal **budget tracker** that helps you log income and
expenses, visualize where your money goes, and track spending against monthly
category budgets.

**Live demo:** _(add your Vercel link here once deployed)_

## Features

- Add income and expense transactions (amount, category, date, note)
- Month selector with at-a-glance summary cards (income, expenses, balance, savings rate)
- Donut chart of spending by category (Recharts)
- Income vs. expenses bar chart across recent months
- Per-category budget progress bars with over-budget highlighting
- Transaction list with one-click delete
- Data persists in the browser via `localStorage`

## Tech stack

- **React 18** (Vite)
- **Recharts** for data visualization
- **Tailwind CSS** for styling

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

## Build for production

```bash
npm run build
```

The optimized site is output to `dist/`.

---

Built by Alessandro Konrad Tosto.

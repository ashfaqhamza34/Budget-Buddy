# Budget Buddy

A mobile-first expense tracker with an AI-powered financial advisor, built for global use across any currency.

## Features

- **Multi-currency support** — set your currency and locale on first launch; all amounts formatted correctly throughout
- **Expense & income logging** — track spending by category with notes and dates
- **Custom categories** — not limited to preset categories; create and manage your own
- **Multi-item subscription tracking** — log Netflix, Spotify, CapCut, and other subscriptions as individual line-items that roll up into one consolidated total, with a clear breakdown ("Includes: Netflix, Spotify")
- **Recurring transactions** — mark rent, subscriptions, or salary as repeating (weekly/monthly/yearly); auto-generates entries on schedule, including retroactively for missed periods
- **Monthly budgeting** — set an overall budget and per-category sub-budgets, with visual progress and over-budget warnings
- **AI Financial Advisor** — a Gemini-powered chatbot that references your actual spending data to answer questions like "Can I afford this?" or "Where am I overspending?"
- **Category breakdown & visual dashboard** — see exactly where your money goes each month
- **Filterable history** — search and filter past transactions by category or date range

## Tech Stack

- **Frontend:** React + TypeScript, Vite, Tailwind CSS, Recharts
- **Backend:** Express (Node.js)
- **AI:** Google Gemini API (`gemini-2.5-flash`), handled entirely server-side — API key never exposed to the client
- **Protection:** Rate-limited AI chat endpoint (`express-rate-limit`)

## Privacy

All financial data is stored locally on-device (localStorage) — nothing is uploaded or shared. Only AI chat requests reach the backend, and no personal financial data is stored server-side.

## Disclaimer

This app provides budgeting assistance and AI-generated suggestions for informational purposes only. It is not a substitute for professional financial advice.

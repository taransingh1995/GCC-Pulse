# GCC Pulse (MVP)

A lightweight, deployable web dashboard for GCC **ratings actions**, **loan/bond deal tracking**, and a **geo/markets brief**.
Designed for **hybrid workflows**: it supports public sources plus **paste-to-parse** from paid terminals (Bloomberg/Reuters/Debtwire/LoanConnector/FT).

## What’s included (v0.1)
- Ratings Watch (GCC sovereigns + watchlist issuers)
- Deals Radar (Loans + Bonds/Sukuk)
- Geo & Markets Brief feed
- Paste-to-Parse: converts pasted text into structured items
- Auto-refresh while open + “New since last visit” highlighting
- Local-first storage (browser localStorage) with import/export JSON

## Deploy to Vercel (no login)
1) Create a GitHub repo and push this code
2) In Vercel: **New Project** → Import repo → Deploy
3) Your app URL will look like: `https://gcc-pulse-<yourname>.vercel.app`

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Notes / limitations
- This MVP intentionally avoids scraping paywalled terminals.
- Public-source ingestion is conservative; you can add sources in Settings.

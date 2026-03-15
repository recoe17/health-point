# Company Financial Dashboard

A financial dashboard built with **Next.js**, **TypeScript**, **Tailwind CSS**, and **Neon** (serverless Postgres) for monthly and daily reports, Excel/CSV import, and persisted data.

## Tech Stack

- **Next.js 14** – React framework with App Router
- **TypeScript** – Type-safe JavaScript
- **Tailwind CSS** – Styling
- **Neon** – Serverless PostgreSQL
- **Recharts** – Charts in detail modals
- **xlsx** – Excel/CSV parsing (server-side)

## Getting Started

1. **Clone and install**
   ```bash
   git clone https://github.com/YOUR_USERNAME/health-point-dashboard.git
   cd health-point-dashboard
   npm install
   ```

2. **Environment (optional – for database)**
   - Copy `.env.example` to `.env.local`
   - Get a connection string from [Neon](https://neon.tech): create a project, then copy the connection string
   - Set in `.env.local`:
     ```
     DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
     ```

3. **Initialize the database (only when using Neon)**
   - Start the app: `npm run dev`
   - Call once to create the table:  
     `PUT http://localhost:3000/api/reports`  
     (e.g. with curl: `curl -X PUT http://localhost:3000/api/reports`)

4. **Run the app**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Pushing to GitHub

1. Create a new repository on [GitHub](https://github.com/new) (e.g. `health-point-dashboard`).
2. In your project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Company Financial Dashboard with Neon"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/health-point-dashboard.git
   git push -u origin main
   ```
3. Do **not** commit `.env` or `.env.local` – they are in `.gitignore`. Set `DATABASE_URL` in your deployment (e.g. Vercel, Railway) or in GitHub Actions secrets if you use CI.

## Features

- **Monthly Report** – Debtors, Creditors, Inventory, Capex, Loan Movement, Income Statement (clickable for details and charts)
- **Daily Reports** – Cash, Revenue, COGS (clickable for details and charts)
- **Import** – Upload Excel (.xlsx, .xls) or CSV; parse → preview → **Update Dashboard** to apply
- **HealthPoint Daily Revenue** – Parser for “Daily Revenue” style files (Total row → Revenue & COGS)
- **Neon persistence** – Imported data is saved to Postgres and loaded on next visit (when `DATABASE_URL` is set)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── parse-report/   # Excel/CSV import
│   │   └── reports/        # GET/POST/PUT – load/save/init DB
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── DetailModal.tsx
│   ├── FinalDetailsTable.tsx
│   ├── ImportModal.tsx
│   ├── MetricCard.tsx
│   └── ReportsSection.tsx
├── lib/
│   ├── db.ts              # Neon helpers
│   └── parseImport.ts     # Client import API
└── types/
    └── dashboard.ts
```

## Database (Neon)

- Table: `report_data` (`report_type`: `monthly` | `daily`, `data`: JSON text, `updated_at`)
- **GET** `/api/reports?type=monthly|daily` – load saved report data
- **POST** `/api/reports` – body `{ type, data }` – save after import
- **PUT** `/api/reports` – create table (run once after setting `DATABASE_URL`)

Without `DATABASE_URL`, the app still runs; import data is only kept in memory for the session.

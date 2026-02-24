# CRM Segmentation Tools – Project TODO

> Auto-generated: 2026-02-24  
> Source of truth: `project-brief/Text/scope-of-work.md` & `project-brief/Text/Segementationtools.md`  
> Compared against existing screens in `src/app` and `src/components`

---

## Legend

- ✅ = Done / screen or logic already exists
- 🟡 = Partially done (UI mockup exists but logic is static / incomplete)
- ❌ = Not yet started

---

## 1. Authentication & Session

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1.1 | Login page UI | ✅ | `src/app/login/page.tsx` |
| 1.2 | NextAuth credential auth (email + password) | ✅ | `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts` |
| 1.3 | Registration API | ✅ | `src/app/api/register/route.ts` |
| 1.4 | Middleware – protect dashboard routes | 🟡 | `src/middleware.ts` protects `/dashboard` but **not** `/everpro-sync` and future routes |
| 1.5 | Redirect logged-in user away from `/login` | ❌ | Brief TODO #1 – back-button / manual URL should redirect to dashboard |
| 1.6 | Logout action | ✅ | `src/app/login/actions.ts` |

---

## 2. Layout & Navigation

| # | Item | Status | Notes |
|---|------|--------|-------|
| 2.1 | Sidebar / AppShell component | ✅ | `src/components/layout/AppShell.tsx` |
| 2.2 | Sidebar as reusable dynamic component | 🟡 | Exists but nav links mostly point to `/dashboard`; needs dynamic `href` per page |
| 2.3 | Move inline SVGs to separate files | ❌ | Brief TODO #3 |
| 2.4 | Replace `fixed` positioning with `flex` | ✅ | Already uses flex |
| 2.5 | Remove Tailwind CSS warnings | ❌ | Brief TODO #4 / #11 |

---

## 3. Segment Builder (Core Feature)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 3.1 | Segment Builder page (UI shell) | 🟡 | `src/app/dashboard/page.tsx` – static mockup with hardcoded cards |
| 3.2 | Filter: AND / OR logic toggle | 🟡 | AND badges shown statically; no interactive toggle |
| 3.3 | Filter: Brand (Reglow / Amura SKU list) | ❌ | SKU list defined in brief but not in code |
| 3.4 | Filter: Product Purchased (SKU) | ❌ | |
| 3.5 | Filter: Order Volume & Value (Jumlah Pcs, Harga, Total Transaksi, etc.) | ❌ | |
| 3.6 | Filter: Order Details (No Order, Jenis Paket, Jenis Transaksi, Tujuan Rek, Ekspedisi) | ❌ | |
| 3.7 | Filter: Timeframe – Tanggal Input | 🟡 | Static date shown; no date-picker |
| 3.8 | Filter: Timeframe – Tanggal Pengiriman | ❌ | |
| 3.9 | Filter: Demographics – Nama Lengkap, No HP/WA | ❌ | |
| 3.10 | Filter: Demographics – Location (Alamat, Kelurahan, Kecamatan, Kota/Kab, Provinsi) | 🟡 | "Jabodetabek" chip shown statically |
| 3.11 | Filter: Engagement Status – Total Order Frequency | ❌ | |
| 3.12 | Filter: Engagement Status – Jenis Cust (New / Repeat / Loyal) | ❌ | |
| 3.13 | Filter: Management – Nama CS | ❌ | |
| 3.14 | Filter: Management – Sumber Leads | ❌ | |
| 3.15 | No duplicate customers in result set | ❌ | Backend logic needed |
| 3.16 | Real-time / near real-time result after sync & filter | ❌ | |
| 3.17 | Handle large dataset without crash / timeout | ❌ | |
| 3.18 | Save Segment button (persist to DB) | ❌ | Button exists on UI but no backend wiring |
| 3.19 | Marketing cost input setting on segment page | ❌ | Brief TODO #7 (default Rp 610/cust) |

---

## 4. Dashboard & Summary

| # | Item | Status | Notes |
|---|------|--------|-------|
| 4.1 | Audience Summary sidebar (matching users count) | 🟡 | Static "1,240" shown |
| 4.2 | Est. Campaign Cost card (users × Rp 610) | 🟡 | Static "Rp 2.450.000" shown; not calculated dynamically |
| 4.3 | Dashboard with charts / sales mockups | ❌ | Brief TODO #8 – needs chart UI (e.g. Chart.js / Recharts) |

---

## 5. Everpro Sync (Engagement Data)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 5.1 | Everpro Sync page UI | ✅ | `src/app/everpro-sync/page.tsx` |
| 5.2 | CSV import UI (drag & drop + preview) | ✅ | `src/components/everpro/CsvImport.tsx` |
| 5.3 | CSV → Database persistence | ❌ | Brief TODO #2 – parsing works but no save-to-DB |
| 5.4 | Template import fields: No HP, Nama Customer, Tanggal terakhir blast | 🟡 | Headers match but save logic missing |
| 5.5 | Identify blast-eligible customers by unique HP | ❌ | |

---

## 6. Export Data

| # | Item | Status | Notes |
|---|------|--------|-------|
| 6.1 | Export button on Segment Builder | 🟡 | Button exists, no functionality |
| 6.2 | Export CSV – Amura template (`OrdersExportAmura.xlsx` format) | ❌ | |
| 6.3 | Export CSV – Reglow template (`OrdersExportReglow` format) | ❌ | |
| 6.4 | Mandatory export columns: Nama Customer, Nomor WhatsApp, Nama CS | ❌ | |

---

## 7. Campaign Page

| # | Item | Status | Notes |
|---|------|--------|-------|
| 7.1 | Campaign page route | ❌ | No `src/app/campaign/page.tsx` |
| 7.2 | Default table showing created segments | ❌ | Brief TODO #9 |

---

## 8. API Integration (Perpack)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 8.1 | API key / auth setup with Perpack | ❌ | Waiting for IT Sinergi |
| 8.2 | Pull transaction data from Perpack | ❌ | Brief TODO #13 |
| 8.3 | Pull product data from Perpack | ❌ | |
| 8.4 | Sync logic to match use case | ❌ | Brief TODO #13 |

---

## 9. User & Profile Management

| # | Item | Status | Notes |
|---|------|--------|-------|
| 9.1 | Profile page | ❌ | Brief TODO #5 |
| 9.2 | User management page (CRUD) | ❌ | Brief TODO #6 |
| 9.3 | Prisma User model | ✅ | `prisma/schema.prisma` – basic model exists |
| 9.4 | Team Management module | ❌ | Mentioned in Week 3-4 scope |

---

## 10. Settings Page

| # | Item | Status | Notes |
|---|------|--------|-------|
| 10.1 | Settings page route | ❌ | Nav link exists in sidebar but points to `/dashboard` |
| 10.2 | Currency setting (IDR, etc.) | ❌ | Brief TODO #10 |
| 10.3 | Favicon / logo upload setting | ❌ | Brief TODO #10 |

---

## 11. Database & Infrastructure

| # | Item | Status | Notes |
|---|------|--------|-------|
| 11.1 | PostgreSQL via Prisma | ✅ | Schema + seed exist |
| 11.2 | DB models for transactions, segments, products, campaigns | ❌ | Only `User` model exists |
| 11.3 | Prisma config warning fix | ❌ | Brief TODO #12 – `datasource url` deprecation |

---

## 12. Code Quality & DevOps

| # | Item | Status | Notes |
|---|------|--------|-------|
| 12.1 | Remove all file / code warnings | ❌ | Brief TODO #11 |
| 12.2 | ESLint Prisma warning ignore | ❌ | Brief TODO #12 |
| 12.3 | Internal testing | ❌ | Week 5 milestone |
| 12.4 | Production deployment to Sinergi server | ❌ | Week 5 milestone |
| 12.5 | Post-deploy monitoring & bug fixing | ❌ | Week 6 milestone |

---

## Quick Summary

| Category | ✅ Done | 🟡 Partial | ❌ Not Started | Total |
|----------|---------|------------|---------------|-------|
| Auth & Session | 3 | 1 | 1 | 5 |
| Layout & Nav | 2 | 1 | 2 | 5 |
| Segment Builder | 0 | 4 | 13 | 17 |
| Dashboard & Summary | 0 | 2 | 1 | 3 |
| Everpro Sync | 2 | 1 | 2 | 5 |
| Export Data | 0 | 1 | 3 | 4 |
| Campaign | 0 | 0 | 2 | 2 |
| API Integration | 0 | 0 | 4 | 4 |
| User & Profile | 1 | 0 | 3 | 4 |
| Settings | 0 | 0 | 3 | 3 |
| Database & Infra | 1 | 0 | 2 | 3 |
| Code Quality | 0 | 0 | 5 | 5 |
| **TOTAL** | **9** | **10** | **41** | **60** |

# CRM Segmentation Tools – Project TODO

> Updated: 2026-02-24
> Source of truth: `project-brief/Text/scope-of-work.md` & `project-brief/Text/Segementationtools.md`
> Compared against existing screens in `src/app` and `src/components`

---

## Legend

- ✅ = Done
- 🟡 = Partially done (UI exists but logic is static / incomplete)
- ❌ = Not yet started
- 🚫 = Cancelled / Removed

---

## 1. Authentication & Session

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1.1 | Login page UI | ✅ | Redesigned to match brief mockup (split-screen layout) |
| 1.2 | NextAuth credential auth (email + password) | ✅ | `src/lib/auth.ts` — JWT strategy, no adapter |
| 1.3 | Registration API | ✅ | `src/app/api/register/route.ts` |
| 1.4 | Middleware – protect all authenticated routes | ✅ | Protects segment-builder, everpro-sync, campaign, users, profile, settings |
| 1.5 | Redirect logged-in user away from `/login` | ✅ | Middleware handles this |
| 1.6 | Logout action (server-side cookie clear) | ✅ | Fixed: was importing client-only `signOut`, now clears cookies server-side |
| 1.7 | Block inactive users from logging in | ✅ | `authorize()` checks `user.isActive` |
| 1.8 | SessionProvider for client components | ✅ | `src/app/providers.tsx` wraps root layout |

---

## 2. Layout & Navigation

| # | Item | Status | Notes |
|---|------|--------|-------|
| 2.1 | Sidebar / AppShell component | ✅ | `src/components/layout/AppShell.tsx` |
| 2.2 | Sidebar with dynamic nav (correct routes per page) | ✅ | Links: Segment Builder, Campaigns, Everpro Sync, Users, Settings |
| 2.3 | Sign out button in sidebar | ✅ | Moved into sidebar footer |
| 2.4 | User card links to profile | ✅ | Clicking user card goes to `/profile` |
| 2.5 | Move inline SVGs to separate files | ❌ | |
| 2.6 | Remove Tailwind CSS warnings | ❌ | |

---

## 3. Segment Builder (Core Feature)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 3.1 | Segment Builder page (UI shell) | 🟡 | `src/app/segment-builder/page.tsx` – static mockup |
| 3.2 | Filter: AND / OR logic toggle | 🟡 | AND badges shown statically |
| 3.3 | Filter: Brand (Reglow / Amura SKU list) | ❌ | |
| 3.4 | Filter: Product Purchased (SKU) | ❌ | |
| 3.5 | Filter: Order Volume & Value | ❌ | |
| 3.6 | Filter: Order Details | ❌ | |
| 3.7 | Filter: Timeframe – Tanggal Input | 🟡 | Static date shown |
| 3.8 | Filter: Timeframe – Tanggal Pengiriman | ❌ | |
| 3.9 | Filter: Demographics – Nama, No HP | ❌ | |
| 3.10 | Filter: Demographics – Location | 🟡 | Static chip shown |
| 3.11 | Filter: Engagement – Order Frequency | ❌ | |
| 3.12 | Filter: Engagement – Jenis Cust | ❌ | |
| 3.13 | Filter: Management – Nama CS | ❌ | |
| 3.14 | Filter: Management – Sumber Leads | ❌ | |
| 3.15 | No duplicate customers in result | ❌ | |
| 3.16 | Real-time result after sync & filter | ❌ | |
| 3.17 | Handle large dataset | ❌ | |
| 3.18 | Save Segment (persist to DB) | ❌ | |
| 3.19 | Marketing cost input setting | ✅ | Now in Settings page |

---

## 4. Dashboard & Summary

| # | Item | Status | Notes |
|---|------|--------|-------|
| 4.1 | Dashboard page | 🚫 | **CANCELLED** – client doesn't need dashboard |
| 4.2 | Audience Summary sidebar | 🟡 | Static on segment-builder page |
| 4.3 | Est. Campaign Cost card | 🟡 | Static on segment-builder page |

---

## 5. Everpro Sync (Engagement Data)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 5.1 | Everpro Sync page UI | ✅ | `src/app/everpro-sync/page.tsx` |
| 5.2 | CSV import UI | ✅ | `src/components/everpro/CsvImport.tsx` |
| 5.3 | CSV → Database persistence | ❌ | EverproContact model exists in schema |
| 5.4 | Template import fields | 🟡 | Headers match but save logic missing |
| 5.5 | Identify blast-eligible customers | ❌ | |

---

## 6. Export Data

| # | Item | Status | Notes |
|---|------|--------|-------|
| 6.1 | Export button on Segment Builder | 🟡 | Button exists, no functionality |
| 6.2 | Export CSV – Amura template | ❌ | |
| 6.3 | Export CSV – Reglow template | ❌ | |
| 6.4 | Mandatory export columns | ❌ | |

---

## 7. Campaign Page

| # | Item | Status | Notes |
|---|------|--------|-------|
| 7.1 | Campaign page route | ❌ | Nav link exists in sidebar |
| 7.2 | Default table showing segments | ❌ | Campaign model exists in DB |

---

## 8. API Integration (Perpack)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 8.1 | API key / auth setup | ❌ | Waiting for IT Sinergi |
| 8.2 | Pull transaction data | ❌ | PerpackTransaction model exists in DB |
| 8.3 | Pull product data | ❌ | |
| 8.4 | Sync logic | ❌ | |

---

## 9. User & Profile Management

| # | Item | Status | Notes |
|---|------|--------|-------|
| 9.1 | Profile page | ✅ | `src/app/profile/page.tsx` – edit name, email, password |
| 9.2 | User management page (CRUD) | ✅ | `src/app/users/page.tsx` – table, create/edit modal, toggle active |
| 9.3 | Users API (GET, POST, PATCH, DELETE) | ✅ | `src/app/api/users/route.ts` & `[id]/route.ts` |
| 9.4 | Prisma User model (role, isActive, avatar) | ✅ | Updated schema |

---

## 10. Settings Page

| # | Item | Status | Notes |
|---|------|--------|-------|
| 10.1 | Settings page route | ✅ | `src/app/settings/page.tsx` |
| 10.2 | Currency setting (IDR, USD, EUR, SGD, MYR) | ✅ | Dropdown with symbol preview |
| 10.3 | Favicon upload | ✅ | Upload to `/public/uploads` |
| 10.4 | Logo upload | ✅ | Upload to `/public/uploads` |
| 10.5 | Marketing cost per customer | ✅ | Input with live calculation preview |
| 10.6 | Settings API (GET, PUT, upload) | ✅ | `src/app/api/settings/` |

---

## 11. Database & Infrastructure

| # | Item | Status | Notes |
|---|------|--------|-------|
| 11.1 | PostgreSQL via Prisma | ✅ | |
| 11.2 | User model (expanded) | ✅ | role, isActive, avatar fields |
| 11.3 | AppSettings model | ✅ | Currency, logo, favicon, marketing cost |
| 11.4 | Segment model | ✅ | With JSON filters field |
| 11.5 | Campaign model | ✅ | Linked to Segment + User |
| 11.6 | EverproContact model | ✅ | phoneNumber as unique identifier |
| 11.7 | PerpackTransaction model | ✅ | Full transaction fields from brief |
| 11.8 | Prisma migration applied | ✅ | `db push --force-reset` + seed |
| 11.9 | @types/bcryptjs installed | ✅ | |

---

## 12. Code Quality & DevOps

| # | Item | Status | Notes |
|---|------|--------|-------|
| 12.1 | Remove all file / code warnings | ❌ | |
| 12.2 | ESLint Prisma warning ignore | ❌ | |
| 12.3 | Internal testing | ❌ | Week 5 milestone |
| 12.4 | Production deployment | ❌ | Week 5 milestone |
| 12.5 | Post-deploy monitoring | ❌ | Week 6 milestone |

---

## Quick Summary

| Category | ✅ Done | 🟡 Partial | ❌ Not Started | 🚫 Cancelled | Total |
|----------|---------|------------|---------------|-------------|-------|
| Auth & Session | 8 | 0 | 0 | 0 | 8 |
| Layout & Nav | 4 | 0 | 2 | 0 | 6 |
| Segment Builder | 1 | 4 | 12 | 0 | 17 |
| Dashboard | 0 | 2 | 0 | 1 | 3 |
| Everpro Sync | 2 | 1 | 2 | 0 | 5 |
| Export Data | 0 | 1 | 3 | 0 | 4 |
| Campaign | 0 | 0 | 2 | 0 | 2 |
| API Integration | 0 | 0 | 4 | 0 | 4 |
| User & Profile | 4 | 0 | 0 | 0 | 4 |
| Settings | 6 | 0 | 0 | 0 | 6 |
| Database & Infra | 9 | 0 | 0 | 0 | 9 |
| Code Quality | 0 | 0 | 5 | 0 | 5 |
| **TOTAL** | **34** | **8** | **30** | **1** | **73** |

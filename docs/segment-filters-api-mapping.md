# Segment Filters - API Field Mapping & Questions

**Tanggal:** 17 Maret 2026  
**Untuk:** Tim Backend WMS API  
**Dari:** Tim Frontend CRM

---

## Overview

Dokumen ini berisi mapping filter yang ada di Segment Builder dengan field dari WMS API. Beberapa field masih missing atau perlu klarifikasi dari tim BE.

---

## 1. Brand Filter 🔵

**Deskripsi:** Filter berdasarkan brand produk

| Filter UI | WMS API Field | Data Type | Contoh Value | Status |
|-----------|---------------|-----------|--------------|--------|
| Brands (multi-select) | `client_name` | string | "Reglow", "Amura", "Purela" | ✅ OK |
| - | `client_id` | number | 1, 2, 3 | ✅ OK |

**Query Parameter Support:**
- ✅ `client_id` - Single value only

---

## 2. Historical Transaction Filter 🟢

**Deskripsi:** Filter berdasarkan transaksi, produk, dan pembayaran

| Filter UI | WMS API Field | Data Type | Contoh Value | Status |
|-----------|---------------|-----------|--------------|--------|
| SKU (multi-select dropdown) | **From** `/v1/open/products/list` | string | "RG-RJ-20", "AM-NC-10" | ✅ OK |
| - | `product_summary` (orders) | string (comma-separated) | "1 RG-RJ-20,1 RG-IW-20,1 RG-PG-20" | ✅ Parsed |
| Min/Max Quantity | `qty` | number | 7 | ✅ OK |
| Min/Max Amount | `amount` | number | 385000 | ✅ OK |
| Jenis Transaksi | `payment_method` | string | "COD", "Transfer" | ✅ OK |
| - | `payment_status` | string | "cod", "transfer" | ✅ OK |
| - | `is_cod` | boolean | true, false | ✅ OK |
| Ekspedisi | `courier` | string | "Lion Parcel", "JNE Express" | ✅ OK |
| - | `courier_label` | string | "REGPACK", "REG" | ✅ OK |

**Query Parameter Support:**
- ❌ Tidak ada parameter untuk filter ini di orders endpoint
- Client-side filtering required

**✅ Update:** 
- SKU list sekarang diambil dari `/v1/open/products/list?client_id={id}&bundle=false&status=published`
- Filter dropdown menampilkan semua SKU published dari semua brand
- Transaction summary dihitung berdasarkan jumlah **unique SKU** di `product_summary`
- Parser: `parseProductSummary()` → array of `{qty, sku}`
- Counter: `getUniqueSkuCount()` → jumlah SKU berbeda per order

**❓ Pertanyaan untuk BE:**
1. ~~Apakah `product_summary` bisa dipisah menjadi array of SKU di response?~~ **RESOLVED** - Parsing di client-side
2. Format `product_summary` apakah selalu "qty SKU,qty SKU"? → **Sudah dikonfirmasi**
3. Apakah ada field lain untuk total unique items per order?

---

## 3. Timeframe Filter 🔷

**Deskripsi:** Filter berdasarkan tanggal transaksi

| Filter UI | WMS API Field | Data Type | Contoh Value | Status |
|-----------|---------------|-----------|--------------|--------|
| Tanggal Input (dari) | `created_at` | datetime | "2025-12-25T13:36:34+07:00" | ✅ OK |
| Tanggal Input (sampai) | `created_at` | datetime | "2025-12-25T13:36:34+07:00" | ❌ No end_date param |
| - | `order_at` | datetime | "2025-12-25T13:36:33+07:00" | ✅ OK |
| - | `leads_at` | datetime | "2025-12-25T13:36:33+07:00" | ✅ OK |
| Tanggal Pengiriman (dari) | ❌ MISSING | datetime | - | ❌ Field tidak ada |
| Tanggal Pengiriman (sampai) | ❌ MISSING | datetime | - | ❌ Field tidak ada |

**Query Parameter Support:**
- ✅ `start_date` - Format: YYYY-MM-DD HH:MM:SS
- ❌ `end_date` - Tidak tersedia

**❓ Pertanyaan untuk BE:**
1. **URGENT:** Apakah bisa ditambahkan parameter `end_date` untuk filter range?
2. **URGENT:** Apakah ada field `shipping_date` atau `delivery_date`?
3. Field mana yang lebih akurat untuk filter "tanggal order": `created_at` atau `order_at`?
4. Format `start_date` apakah harus include time atau cukup YYYY-MM-DD?

---

## 4. Demographics Filter 🟣

**Deskripsi:** Filter berdasarkan data customer

| Filter UI | WMS API Field | Data Type | Contoh Value | Status |
|-----------|---------------|-----------|--------------|--------|
| Nama Customer | `customer_name` | string | "Mei Lie" | ✅ OK |
| No HP/WhatsApp | `customer_phone` | string | "6285824901911" | ✅ OK |
| Email | `customer_email` | string | "" | ⚠️ Sering kosong |
| Alamat Lengkap | `customer_address` | string | "Perumahan Dinas..." | ✅ OK |
| Provinsi | `customer_province` | string | "Maluku" | ✅ OK |
| Kota/Kabupaten | `customer_city` | string | "Kota Ambon" | ✅ OK |
| Kecamatan | `customer_district` | string | "Sirimau" | ✅ OK |
| Kelurahan | `customer_sub_district` | string | "" | ⚠️ Sering kosong |
| Kode Lokasi BPS | `customer_location_id` | string | "81.71.02" | ✅ OK (not used) |
| Kode Pos | `customer_postcode` | string | "" | ⚠️ Sering kosong |

**Query Parameter Support:**
- ✅ `search` - Search by customer name or phone (single keyword)

**❓ Pertanyaan untuk BE:**
1. Parameter `search` bisa match field apa aja? (name, phone, email, address?)
2. Apakah support multiple keywords atau hanya single keyword?
3. Apakah search case-sensitive?
4. Kenapa `customer_email` dan `customer_sub_district` sering kosong?

---

## 5. Engagement — Customer History Filter 🟡

**Deskripsi:** Filter berdasarkan behavior dan history customer

| Filter UI | WMS API Field | Data Type | Contoh Value | Status |
|-----------|---------------|-----------|--------------|--------|
| Jenis Customer | `customer_type` | string | "new", "repeat", "loyal" | ✅ OK |
| Customer ID | `customer_id` | number | 1178665 | ✅ OK |
| Min Order Frequency | ❌ CALCULATED | number | - | ⚠️ Harus aggregasi |
| Max Order Frequency | ❌ CALCULATED | number | - | ⚠️ Harus aggregasi |

**Query Parameter Support:**
- ❌ Tidak ada parameter untuk filter ini

**❓ Pertanyaan untuk BE:**
1. **IMPORTANT:** Bagaimana cara query order frequency per customer?
2. Apakah `customer_id` unique identifier yang stabil untuk aggregasi?
3. Apakah ada field atau endpoint untuk get total orders per customer?
4. Definisi "new", "repeat", "loyal" berapa order?

---

## 6. Engagement — Management Filter 🔴

**Deskripsi:** Filter berdasarkan CS dan lead source

| Filter UI | WMS API Field | Data Type | Contoh Value | Status |
|-----------|---------------|-----------|--------------|--------|
| Nama CS | `customer_service` | string | "Tri Rahayu Widayanti" | ✅ OK |
| - | `customer_service_id` | number | 91 | ✅ OK |
| Sumber Leads | `ads_platform_name` | string | "FB BCA", "Meta PRD" | ✅ OK |
| - | `ads_platform_id` | number | 22 | ✅ OK |

**Query Parameter Support:**
- ❌ Tidak ada parameter untuk filter ini di orders endpoint
- ✅ Ada endpoint terpisah: `/v1/open/admin/customer-services`
- ✅ Ada endpoint terpisah: `/v1/open/social-commerce/ads-platform`

**❓ Pertanyaan untuk BE:**
1. Apakah ada parameter untuk filter by CS atau ads platform di orders endpoint?

---

## 7. Engagement Status Filter 🟡

**Deskripsi:** Filter berdasarkan aktivitas kontak dari Everpro (bukan dari WMS)

| Filter UI | Data Source | Data Type | Status |
|-----------|-------------|-----------|--------|
| Show Only Not Contacted | Local DB (`EverproContact`) | boolean | ✅ OK |
| Last Contact Date Range | Local DB (`lastBlastDate`) | datetime | ✅ OK |
| Integration Status | Local DB | status | ✅ OK |

**Query Parameter Support:**
- N/A (data dari database lokal, bukan WMS API)

---

## Current WMS API Endpoints Used

### 1. Orders Endpoint

**Endpoint:** `GET /v1/open/social-commerce/orders`

| Parameter | Type | Required | Contoh | Keterangan |
|-----------|------|----------|--------|------------|
| `page` | number | ✅ | 1 | Nomor halaman |
| `length` | number | ✅ | 100 | Jumlah records per page (max: 250) |
| `start_date` | string | ❌ | "2025-12-25 00:00:00" | Filter dari tanggal ini |
| `status` | string | ❌ | "process" | Filter by status order |
| `search` | string | ❌ | "628xxx" | Keyword search |
| `client_id` | number | ❌ | 1 | Filter by brand ID |

### 2. Products Endpoint (NEW) ✨

**Endpoint:** `GET /v1/open/products/list`

| Parameter | Type | Required | Contoh | Keterangan |
|-----------|------|----------|--------|------------|
| `client_id` | number | ❌ | 2 | Filter by brand ID |
| `bundle` | boolean | ❌ | false | Filter bundle/non-bundle products |
| `status` | string | ❌ | "published" | Filter by product status |
| `page` | number | ❌ | 1 | Nomor halaman |
| `length` | number | ❌ | 50 | Jumlah records per page |

**Usage:** Digunakan untuk populate SKU dropdown di Historical Transaction filter. Fetch semua brands untuk mendapatkan complete product list.

---

## Summary: Field Status

| Status | Count | Description |
|--------|-------|-------------|
| ✅ OK | 29 | Field tersedia dan berfungsi (termasuk SKU dari products API) |
| ⚠️ Perlu Klarifikasi | 4 | Field ada tapi perlu penjelasan |
| ❌ Missing | 3 | Field tidak tersedia di API |

---

## Priority Questions untuk Tim BE

### 🔴 URGENT (Blocking):
1. **End Date Parameter:** Apakah bisa ditambahkan `end_date` parameter untuk filter date range?
2. **Shipping Date Field:** Apakah ada field tanggal pengiriman/delivery di response?
3. **Order Frequency:** Bagaimana cara query/aggregate total orders per customer?

### 🟡 Important (Nice to have):
4. ~~**Product Summary Parsing:**~~ **RESOLVED** - SKU list dari `/v1/open/products/list`, parsing client-side
5. **Search Functionality:** Parameter `search` bisa match field apa saja?
6. **Additional Filters:** Apakah ada parameter untuk filter by CS, ads_platform, expedition, payment_method?

### 🟢 Low Priority (For optimization):
7. **Empty Fields:** Kenapa `customer_email`, `customer_sub_district`, `customer_postcode` sering kosong?
8. **Data Quality:** Apakah ada validasi untuk `customer_phone` format?
9. **Pagination Limit:** Apakah length max 250 bisa dinaikkan untuk reduce API calls?

---

## Current Implementation Note

**Saat ini untuk Audience Summary:**
- Hardcoded filter: `status=process` (hanya order yang sudah diproses)
- Client-side filtering untuk field yang tidak ada query parameter
- Phone number matching menggunakan multiple format variants (62xxx, 08xxx, raw digits)
- Everpro engagement data di-cross reference berdasarkan phone number
- **SKU dropdown:** Fetch dari `/v1/open/products/list` untuk semua brands (published, non-bundle)
- **Transaction summary:** Dihitung berdasarkan jumlah unique SKU di `product_summary` menggunakan parser

---

## Contact

**Frontend Team:**  
- File yang perlu update kalau ada perubahan API:
  - `/src/lib/wms-api.ts` - API client & query builder
  - `/src/app/api/segments/preview/route.ts` - Segment preview logic
  - `/src/app/segment/new/page.tsx` - UI filter builder

**Request:** Mohon feedback untuk questions di atas agar kami bisa optimize filtering di segment builder.

---

**Last Updated:** 17 Maret 2026

# Export Columns Reference

## Overview

Dokumen ini menjelaskan semua kolom yang ada dalam Excel export hasil segmentasi atau direct export by brand.

## Format Kolom

### 1. Kolom Standard (Semua Brand)

Kolom-kolom dasar yang ada di setiap export:

| No | Kolom | Deskripsi | Format | Contoh |
|----|-------|-----------|--------|--------|
| 1 | Nomor Order | Reference number | Text | 4260318062560 |
| 2 | Tanggal Input | Tanggal order dibuat | DD/MM/YYYY | 18/03/2026 |
| 3 | Tanggal Process | Tanggal order diproses | DD/MM/YYYY | 18/03/2026 |
| 4 | Nama CS | Customer Service | Text | Nur Aeni |
| 5 | Sumber Leads | Platform ads | Text | SV KCT |
| 6 | Jenis Cust | Customer type | Text | new/renew/loyal |
| 7 | Jenis Paket | Courier label | Text | REGPACK |
| 8 | Nama Lengkap | Customer name | Text | Mercia Yud. S |
| 9 | No HP/Wa | Phone number | Text | 6281258429845 |
| 10 | Alamat Lengkap | Full address | Text | Jalan parit pangeran... |
| 11 | Kelurahan /Desa | Sub-district | Text | Siantan Hulu |
| 12 | Kecamatan | District | Text | Pontianak Utara |
| 13 | Kota/Kab | City | Text | Kota Pontianak |
| 14 | Provinsi | Province | Text | Kalimantan Barat |

### 2. Kolom Produk REGLOW (30 kolom)

Kolom 15-44 berisi quantity per produk Reglow:

| No | Kolom | Produk | Keterangan |
|----|-------|--------|------------|
| 15 | RGDC | Day Cream | |
| 16 | RGTN | Toner | |
| 17 | RGFW | Face Wash | |
| 18 | RGPCH | Pouch | |
| 19 | RGSM | Serum | |
| 20 | RGSR | Sunscreen | |
| 21 | RGNC | Night Cream | |
| 22 | RGMO | Moisturizer | |
| 23 | RGTH | Toner Hydrating | |
| 24 | RGFF | Facial Foam | |
| 25 | RGAS | Anti-aging Serum | |
| 26 | RGSS | Skin Serum | |
| 27 | DCNEW | Day Cream New | |
| 28 | TRNEW | Toner New | |
| 29 | FWNEW | Face Wash New | |
| 30 | SRNEW | Sunscreen New | |
| 31 | NCNEW | Night Cream New | |
| 32 | RGPS | Post Serum | |
| 33 | BUTND4 | Bundling ND4 | |
| 34 | BUTNB4 | Bundling NB4 | |
| 35 | BUTSP4 | Bundling SP4 | |
| 36 | BUTPP4 | Bundling PP4 | |
| 37 | BUTTR4 | Bundling TR4 | |
| 38 | BL50 | Bundle 50 | |
| 39 | BL180 | Bundle 180 | |
| 40 | RGSP50 | Special Pack 50 | |
| 41 | RGGG50 | Gift Set 50 | |
| 42 | RGPSY | Psychology Set | |
| 43 | RGLBS | Lab Series | |
| 44 | OTHER | Other products | |

### 3. Kolom Produk AMURA (23 kolom)

Kolom 15-37 berisi quantity per produk Amura:

| No | Kolom | Produk | Keterangan |
|----|-------|--------|------------|
| 15 | AMNG | Night Gel | |
| 16 | AMVC | Vitamin C | |
| 17 | AMPA | Papaya | |
| 18 | AMDSP | Day SPF | |
| 19 | AMAMP | Ampoule | |
| 20 | AMHMP | Hemp | |
| 21 | AMTS | Toner Spray | |
| 22 | AMSY | Syrup | |
| 23 | AMDC | Day Cream | |
| 24 | AMNC | Night Cream | |
| 25 | AMSYTON | Syton | |
| 26 | AMRT | Retinol | |
| 27 | AMRNP | Renew Plus | |
| 28 | AMHG | Hydrogel | |
| 29 | AMEGC | EGC | |
| 30 | AMBRT | Brightening | |
| 31 | AMESP | Essence SPF | |
| 32 | AMGL | Glow | |
| 33 | AMSS | Sun Screen | |
| 34 | AMBND | Bundle | |
| 35 | TAS | Tas/Bag | |
| 36 | SCR | Scrub | |
| 37 | AM-CMN | Common | |

### 4. Kolom Financial (8 kolom)

Kolom financial yang ada di akhir (setelah kolom produk):

| No | Kolom | Deskripsi | Format | Contoh |
|----|-------|-----------|--------|--------|
| 1 | Jumlah Pcs | Total quantity | Number | 2 |
| 2 | Harga Barang | Item price | Number | 178000 |
| 3 | Note | Order notes | Text | 2 GOLD |
| 4 | Eksepedisi | Courier name | Text | Lion Parcel |
| 5 | Ongkir | Shipping fee | Number | 39600 |
| 6 | Type Transaksi | COD/Transfer | Text | COD |
| 7 | Payment Method | Payment method | Text | LION COD |
| 8 | Disc Barang | Item discount | Number | 0 |
| 9 | Discount Ongkir | Shipping discount | Number | 92 |
| 10 | Cod Fee | COD fee | Number | 7492 |
| 11 | Total Transaksi | Grand total | Number | 225000 |
| 12 | Other Amount | Other fees | Number | 0 |

## Total Kolom Count

- **Reglow Export:** 14 (standard) + 30 (products) + 12 (financial) = **56 kolom**
- **Amura Export:** 14 (standard) + 23 (products) + 12 (financial) = **49 kolom**

## Contoh Data Mapping

### Reglow Example

**WMS API Response:**
```json
{
  "reference_no": "4260318062567",
  "created_at": "2026-03-18T13:37:32+07:00",
  "order_at": "2026-03-18T13:37:31+07:00",
  "customer_service": "Siti Salamah",
  "ads_platform_name": "FB BCA",
  "customer_type": "renew",
  "courier_label": "Regular",
  "customer_name": "Yustina",
  "customer_phone": "6282239177087",
  "customer_address": "Jln lorong Klinik Join...",
  "customer_sub_district": "Bintuni Timur",
  "customer_district": "Bintuni",
  "customer_city": "Teluk Bintuni",
  "customer_province": "Papua Barat",
  "product_summary": "1 RG-SP-50,1 RG-PG-20,1 RG-AH-100,1 RG-TR,1 RG-SL-30",
  "qty": 9,
  "amount": 495000,
  "note": "BUNDLING REGLOW 495",
  "courier": "JNE",
  "shipping_fee": 183000,
  "is_cod": true,
  "payment_method": "COD",
  "discount_amount": 0,
  "discount_shipping_fee": 16000,
  "cod_fee": 0,
  "other_amount": 22803
}
```

**Excel Output:**
| Nomor Order | Tanggal Input | ... | RGSP50 | RGPG | ... | Total Transaksi |
|-------------|---------------|-----|--------|------|-----|-----------------|
| 4260318062567 | 18/03/2026 | ... | 1 | 1 | ... | 662000 |

### Amura Example

**WMS API Response:**
```json
{
  "reference_no": "4260318062560",
  "created_at": "2026-03-18T13:30:12+07:00",
  "customer_name": "Mercia Yud. S",
  "product_summary": "2 AM-NG-20",
  "qty": 2,
  "amount": 178000,
  "shipping_fee": 39600,
  "cod_fee": 7492
}
```

**Excel Output:**
| Nomor Order | ... | AMNG | AMVC | ... | Total Transaksi |
|-------------|-----|------|------|-----|-----------------|
| 4260318062560 | ... | 2 | 0 | ... | 225000 |

## Formula Calculations

### Total Transaksi
```
Total Transaksi = Harga Barang + Ongkir + Cod Fee - Disc Barang - Discount Ongkir
```

**Example:**
```
178000 + 39600 + 7492 - 0 - 92 = 225000
```

## Product Parsing Rules

### ⚠️ Important: SKU Mapping Strategy (Updated 2026)

**WMS API menggunakan full SKU codes** yang berbeda dari kolom template Excel.

**Problem:**
- WMS API: `RG-CEH-100` (Ceramides Expert Hydrating Toner)
- Template column: `RGTH` (Toner Hydrating)

**Solution:** Export menggunakan **explicit SKU mapping table**

Lihat detail lengkap di [product-parser.md](./product-parser.md)

### SKU to Column Mapping

| WMS SKU | Template Column | Description |
|---------|----------------|-------------|
| RG-CEH-100 | RGTH | Ceramides Hydrating → Toner Hydrating |
| RG-AH-100 | RGTH | Old hydrating variant → Toner Hydrating |
| RG-IW-20 | RGNC | Intensive Whitening → Night Cream |
| RG-PG-20 | RGSM | Perfect Glowing → Serum |
| RG-CB-30 | RGMO | Ceramide Barrier → Moisturizer |
| RG-SL-30 | RGSR | Sunscreen Luxury → Sunscreen |
| RG-PCH | RGPCH | Pouch (direct match) |
| RG-SPC-90 | RGFW | Skin Purifying Cleansing → Face Wash |
| RG-TE-20 | OTHER | Triple Exfoliate → OTHER |
| RG-UGSM | OTHER | Ultimate Glow Sheetmask → OTHER |
| RG-DA-15 | OTHER | Double Action Spot Gel → OTHER |
| RG-SCR | RGSR | Old scrub code → Sunscreen |
| RG-RJ-20 | OTHER | Unknown/discontinued product |

### Pattern Recognition (Legacy Products)

Product summary format: `{qty} {BRAND}-{CODE}-{VARIANT}`

**Examples:**
- `"2 AM-NG-20"` → AMNG = 2
- `"1 RG-SP-50"` → RGSP50 = 1
- `"1 RG-TR"` → RGTR = 1 (no variant)

### Multiple Products

Split by comma:
```
"1 RG-SP-50,1 RG-PG-20,1 RG-TR"
→ RGSP50=1, RGPG=1, RGTR=1
```

### Special Cases

1. **Bundling:** Product summary contains multiple items
2. **Variants:** Number suffix (50, 100, 20, etc.)
3. **Unknown products:** Map to "OTHER" column (Reglow only)

## Template Requirements

### Reglow Template (OrdersExportReglow.xlsx)

Must have columns in this order:
1. Standard columns (14)
2. Product columns RGDC through OTHER (30)
3. Financial columns (12)

### Amura Template (OrdersExportAmura.xlsx)

Must have columns in this order:
1. Standard columns (14)
2. Product columns AMNG through AM-CMN (23)
3. Financial columns (12)

## Usage in Code

### Reading Columns

```typescript
// Get all column headers
const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];

// Expected for Reglow: 56 columns
// Expected for Amura: 49 columns
```

### Writing Data

```typescript
const row = {
  "Nomor Order": order.reference_no,
  "Tanggal Input": formatDateIndonesian(order.created_at),
  // ... standard columns
  ...productColumns, // Brand-specific products
  "Jumlah Pcs": order.qty,
  // ... financial columns
};

const worksheet = XLSX.utils.json_to_sheet([row]);
```

## Validation

### Data Validation Rules

1. **Nomor Order:** Must be unique, non-empty
2. **Dates:** Must be valid DD/MM/YYYY format
3. **Phone:** Must start with 62 or 08
4. **Product quantities:** Must be numbers ≥ 0
5. **Financial amounts:** Must be numbers ≥ 0
6. **Total Transaksi:** Must match calculation

### Common Issues

1. **Missing products:** Will show 0 in all product columns
2. **Unknown product codes:** Ignored in parsing
3. **Invalid dates:** Will show original timestamp
4. **Negative amounts:** Shown as-is (possible refund/adjustment)

---

**Created:** 19 Maret 2026  
**Last Updated:** 19 Maret 2026  
**Status:** ✅ Production Ready

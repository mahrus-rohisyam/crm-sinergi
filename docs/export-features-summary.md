# Export Features - Summary

## Dua Jenis Export yang Tersedia

Sistem CRM Sinergi menyediakan **2 cara** untuk export data ke Excel:

### 1. 📊 Segment Export (Export Hasil Segmentasi)
**Untuk:** Export hasil filter/segmentasi yang sudah dibuat

**Cara pakai:**
- Buat segment dengan berbagai filter di dashboard
- Klik tombol Download pada segment yang sudah dibuat
- File Excel otomatis terdownload dengan format sesuai brand

**Lokasi:** Dashboard utama (`/`) → Klik icon download pada segment

**Dokumentasi:** [segment-export.md](./segment-export.md)

**Keunggulan:**
- ✅ Support semua jenis filter (brand, timeframe, demographics, transaction, engagement)
- ✅ Data enrichment dengan Everpro engagement data
- ✅ Bisa save & reuse segment untuk export berkali-kali
- ✅ Preview results sebelum export
- ✅ Template otomatis sesuai brand di filter

**Use Case:**
- Export customer yang belum dihubungi dari brand tertentu
- Export high-value customers dari Jakarta
- Export repeat customers dari periode tertentu
- Export dengan kombinasi filter kompleks

---

### 2. 🏷️ WMS Orders Export by Brand  
**Untuk:** Export semua orders langsung by brand (tanpa filter)

**Cara pakai:**
- Akses page WMS Export (`/wms-export`)
- Pilih brand (Amura / Reglow / Purela)
- Optional: Tambah filter date & status
- Klik Export Orders

**Lokasi:** `/wms-export`

**Dokumentasi:** [wms-orders-export.md](./wms-orders-export.md)

**Keunggulan:**
- ✅ Simple & cepat untuk bulk export
- ✅ Tidak perlu buat segment dulu
- ✅ Langsung dari WMS API
- ✅ Support basic filters (date, status)

**Use Case:**
- Export semua orders Amura untuk reporting
- Backup data bulanan per brand
- Quick export untuk analisis ad-hoc

---

## Perbandingan

| Fitur | Segment Export | WMS Orders Export |
|-------|----------------|-------------------|
| **Endpoint** | `/api/segments/[id]/export` | `/api/wms/orders/export` |
| **UI Location** | Dashboard (`/`) | `/wms-export` |
| **Requirement** | Harus buat segment dulu | Langsung bisa export |
| **Filter Support** | ✅ Semua filter (brand, demo, transaction, engagement) | ⚠️ Basic (brand, date, status only) |
| **Engagement Data** | ✅ Include (jika ada engagement filter) | ❌ Tidak include |
| **Template Selection** | 🤖 Auto dari brand filter | 🤖 Auto dari brand pilihan |
| **Preview** | ✅ Available | ❌ Tidak ada |
| **Reusable** | ✅ Save segment untuk reuse | ❌ Harus input filter lagi |
| **Best For** | Complex filtering & segmentation | Quick bulk export by brand |

---

## File Templates

Kedua fitur menggunakan template yang sama di `/public/templates/`:

```
public/templates/
├── OrdersExportAmura.xlsx    # Template untuk brand Amura
├── OrdersExportReglow.xlsx   # Template untuk brand Reglow
└── OrdersExportPurela.xlsx   # Template untuk brand Purela (opsional)
```

---

## Kolom-Kolom Export

### Standard Columns (Semua Export)

Order ID, Reference No, Customer Name, Customer Phone, Customer Email, Customer Type, Province, City, District, Sub District, Address, Brand, Product, Qty, Amount, Discount, Shipping Fee, COD Fee, Payment Method, Payment Status, Is COD, Courier, Courier Label, AWB, Customer Service, CS ID, Ads Platform, Ads Platform ID, Warehouse ID, Note, Status, Status Fulfillment, Status External, Created At, Order At, Leads At

### Extra Columns (Segment Export dengan Engagement Filter)

Last Contact, Blast Status, Engagement Status

---

## Tech Stack

**Backend:**
- Next.js API Routes
- Prisma (Database ORM)
- WMS API Client
- XLSX library untuk Excel manipulation

**Frontend:**
- React Hooks (custom hooks)
- Loading states & error handling
- File download handling

**Dependencies:**
```json
{
  "xlsx": "^0.18.5",
  "@prisma/client": "^6.19.2",
  "next": "16.1.6"
}
```

---

## Quick Start

### 1. Setup Templates

Pastikan template files ada:

```bash
ls public/templates/
# Output harus ada:
# OrdersExportAmura.xlsx
# OrdersExportReglow.xlsx
```

### 2. Environment Variables

```env
WMS_API_KEY=your_api_key
WMS_API_BASE_URL=https://wms-api.sinergisuperapp.com
DATABASE_URL=postgresql://...
```

### 3. Test Segment Export

```bash
# 1. Buat segment di dashboard
# 2. Klik download button
# 3. Check downloaded file
```

### 4. Test WMS Export

```bash
# Visit http://localhost:3000/wms-export
# Select brand, set filters, click export
```

---

## API Endpoints

### Segment Export
```
GET /api/segments/{segmentId}/export
```

**Response:** Excel file download

**Example:**
```bash
curl -OJ "http://localhost:3000/api/segments/clx123abc/export"
```

### WMS Orders Export
```
GET /api/wms/orders/export?brand={brand}&start_date={date}&status={status}
```

**Parameters:**
- `brand` (required): Amura, Reglow, atau Purela
- `start_date` (optional): YYYY-MM-DD
- `status` (optional): order status

**Response:** Excel file download

**Example:**
```bash
curl -OJ "http://localhost:3000/api/wms/orders/export?brand=Amura&start_date=2026-01-01"
```

---

## Error Handling

Kedua fitur memiliki comprehensive error handling:

| Error | Status | Handling |
|-------|--------|----------|
| Template not found | 404 | Error message dengan nama template |
| No orders found | 404 | Message "No orders found" |
| Invalid brand | 400 | List supported brands |
| Server error | 500 | Error details for debugging |
| Network timeout | 500 | Automatic retry (3x) |

---

## Performance Considerations

### Segment Export
- **Pagination:** Auto-fetch all pages
- **Enrichment:** Bulk query untuk Everpro data
- **Memory:** Efficient streaming processing
- **Time:** ~10-30 seconds untuk 1000-5000 orders

### WMS Export
- **Pagination:** Batch fetching (100 per page)
- **Time:** ~5-20 seconds untuk 1000-5000 orders
- **Progress:** Console logs untuk tracking

---

## Troubleshooting

### Problem: Export sangat lambat

**Solusi:**
- Check WMS API response time
- Reduce date range jika terlalu besar
- Check network connection

### Problem: File tidak terdownload

**Solusi:**
- Check browser console untuk errors
- Verify popup blocker tidak block download
- Try different browser

### Problem: Excel file corrupt

**Solusi:**
- Verify template file valid
- Clear browser cache
- Re-export dengan smaller date range

---

## Development

### Add New Brand Template

1. Create template file:
   ```bash
   cp public/templates/OrdersExportAmura.xlsx \
      public/templates/OrdersExportNewBrand.xlsx
   ```

2. Update brand mapping di `src/lib/wms-api.ts`:
   ```typescript
   const brandMap: Record<string, number> = {
     "Reglow": 1,
     "Amura": 2,
     "Purela": 3,
     "NewBrand": 4, // Add new brand
   };
   ```

3. Test export dengan new brand

### Add New Export Column

1. Update template Excel (add column header)

2. Update export route:
   ```typescript
   const rows = orders.map((order) => ({
     // ... existing columns
     "New Column": order.new_field, // Add new field
   }));
   ```

3. Verify output Excel has new column

---

## Related Documentation

- [Segment Export Detail](./segment-export.md)
- [WMS Orders Export Detail](./wms-orders-export.md)
- [WMS API Documentation](./WMS-API-Documentation.md)
- [Segment Filters API Mapping](./segment-filters-api-mapping.md)

---

**Last Updated:** 19 Maret 2026  
**Status:** ✅ Production Ready

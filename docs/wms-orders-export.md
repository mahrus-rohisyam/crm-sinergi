# WMS Orders Export by Brand

## Overview

This feature allows you to export **all WMS orders** directly by brand to Excel using brand-specific templates. This is useful for bulk data export without creating a segment first.

> **Note:** If you want to export **filtered/segmented customers** (with specific filters like date range, demographics, engagement status, etc.), use the [Segment Export](./segment-export.md) feature instead.

## When to Use

- **Use this feature** when you need to export all orders for a specific brand
- **Use [Segment Export](./segment-export.md)** when you want to export filtered results from a saved segment

## Files Created

### 1. API Endpoint
**File:** `/src/app/api/wms/orders/export/route.ts`

**Endpoint:** `GET /api/wms/orders/export`

**Query Parameters:**
- `brand` (required): Brand name - "Amura", "Reglow", or "Purela"
- `start_date` (optional): Filter orders from this date onwards (YYYY-MM-DD format)
- `status` (optional): Filter by order status

**Response:** Excel file download with brand-specific formatting

**Example Usage:**
```bash
# Export all Amura orders
curl "http://localhost:3000/api/wms/orders/export?brand=Amura" -o amura_orders.xlsx

# Export Reglow orders from a specific date
curl "http://localhost:3000/api/wms/orders/export?brand=Reglow&start_date=2026-01-01" -o reglow_orders.xlsx

# Export with status filter
curl "http://localhost:3000/api/wms/orders/export?brand=Amura&status=completed" -o amura_completed.xlsx
```

### 2. React Hook
**File:** `/src/hooks/useOrdersExport.ts`

**Hook:** `useOrdersExport()`

**Returns:**
- `exportOrders(filters)`: Function to trigger export
- `isExporting`: Boolean indicating if export is in progress
- `error`: Error message if export fails

**Example Usage:**
```tsx
import { useOrdersExport } from "@/hooks/useOrdersExport";

function MyComponent() {
  const { exportOrders, isExporting, error } = useOrdersExport();

  const handleExport = async () => {
    const result = await exportOrders({
      brand: "Amura",
      start_date: "2026-01-01",
      status: "completed"
    });
    
    if (result.success) {
      console.log("Export completed successfully");
    }
  };

  return (
    <button onClick={handleExport} disabled={isExporting}>
      {isExporting ? "Exporting..." : "Export Orders"}
    </button>
  );
}
```

### 3. UI Page
**File:** `/src/app/wms-export/page.tsx`

**Route:** `/wms-export`

A complete UI page with:
- Brand selection (radio buttons)
- Date filter input
- Status filter input
- Export button with loading state
- Error handling and user feedback

**Access:** Navigate to `http://localhost:3000/wms-export`

## Templates

The system uses brand-specific Excel templates located in `/public/templates/`:

- `OrdersExportAmura.xlsx` - Template for Amura brand
- `OrdersExportReglow.xlsx` - Template for Reglow brand

### Template Structure

All templates should have the following columns (order doesn't matter as the system generates new sheets):

| Column Name | Description | Example |
|------------|-------------|---------|
| Order ID | Unique order identifier | ORD-12345 |
| Reference No | Reference number | REF-001 |
| Customer Name | Full customer name | John Doe |
| Customer Phone | Phone number | +628123456789 |
| Customer Email | Email address | john@example.com |
| Customer Type | new, repeat, or loyal | new |
| Province | Province name | DKI Jakarta |
| City | City name | Jakarta Selatan |
| District | District name | Kebayoran Baru |
| Sub District | Sub-district name | Senayan |
| Address | Full address | Jl. Example No. 1 |
| Brand | Brand name | Amura |
| Product | Product SKU/summary | PROD-001 |
| Qty | Quantity | 2 |
| Amount | Order amount | 150000 |
| Discount | Discount amount | 10000 |
| Shipping Fee | Shipping cost | 15000 |
| COD Fee | Cash on delivery fee | 5000 |
| Payment Method | Payment method | Transfer |
| Payment Status | Payment status | Paid |
| Is COD | Yes/No | No |
| Courier | Courier service | JNE |
| Courier Label | Courier label | JNE REG |
| AWB | Airway bill number | AWB-123 |
| Customer Service | CS name | Jane Smith |
| CS ID | CS identifier | CS-001 |
| Ads Platform | Advertising platform | Instagram |
| Ads Platform ID | Platform ID | ADS-001 |
| Warehouse ID | Warehouse identifier | WH-001 |
| Note | Order notes | Special instructions |
| Status | Order status | completed |
| Status Fulfillment | Fulfillment status | delivered |
| Status External | External status | - |
| Created At | Creation timestamp | 2026-03-19T10:00:00Z |
| Order At | Order timestamp | 2026-03-19T10:00:00Z |
| Leads At | Lead timestamp | 2026-03-19T09:00:00Z |

## How It Works

1. **User selects brand** (Amura, Reglow, or Purela)
2. **System determines template** based on brand selection
3. **Fetches orders from WMS API** using the brand's `client_id`:
   - Amura: client_id = 2
   - Reglow: client_id = 1  
   - Purela: client_id = 3
4. **Applies filters** (date, status) if provided
5. **Loads template** from `/public/templates/`
6. **Generates Excel file** with order data
7. **Downloads file** to user's browser

## Brand Mapping

The system uses the following brand to client_id mapping (defined in `/src/lib/wms-api.ts`):

```typescript
const brandMap: Record<string, number> = {
  "Reglow": 1,
  "Amura": 2,
  "Purela": 3,
};
```

## Error Handling

The system handles various error scenarios:

- **Missing brand parameter**: Returns 400 error
- **Invalid brand**: Returns 400 error with list of supported brands
- **Template not found**: Returns 404 error
- **No orders found**: Returns 404 error
- **WMS API errors**: Returns 500 error with details
- **Network errors**: Frontend displays error message to user

## Integration Points

### With WMS API
- Uses `fetchWMSOrders()` function from `/src/lib/wms-api.ts`
- Supports pagination to fetch all orders
- Passes brand's `client_id` as filter parameter

### With Template System
- Reads Excel templates from `/public/templates/`
- Uses `xlsx` library for Excel file manipulation
- Preserves template formatting (though regenerates with new data)

## Testing

### Manual Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/wms-export`

3. Test scenarios:
   - Export Amura orders (all)
   - Export Reglow orders with date filter
   - Export with invalid filters
   - Check downloaded file format

### API Testing

```bash
# Test basic export
curl -OJ "http://localhost:3000/api/wms/orders/export?brand=Amura"

# Test with date filter
curl -OJ "http://localhost:3000/api/wms/orders/export?brand=Reglow&start_date=2026-01-01"

# Test error handling - missing brand
curl "http://localhost:3000/api/wms/orders/export"

# Test error handling - invalid brand
curl "http://localhost:3000/api/wms/orders/export?brand=InvalidBrand"
```

## Future Enhancements

Potential improvements:

1. **Template customization**: Allow users to upload custom templates
2. **Scheduled exports**: Automate regular exports
3. **Email delivery**: Send exports via email
4. **Multiple brands**: Export multiple brands in one file
5. **Custom columns**: Let users select which columns to export
6. **Format options**: Support CSV, PDF, or other formats
7. **Export history**: Track and store previous exports
8. **Preview**: Show preview before exporting

## Troubleshooting

### Common Issues

**Problem**: Template not found error
- **Solution**: Ensure template files exist in `/public/templates/` directory
- Check filename matches pattern: `OrdersExport{Brand}.xlsx`

**Problem**: No orders found
- **Solution**: 
  - Check date filters aren't too restrictive
  - Verify brand has orders in WMS system
  - Check WMS API connectivity

**Problem**: Export hangs or times out
- **Solution**:
  - Check network connection to WMS API
  - Large datasets may take time - be patient
  - Check server logs for errors

**Problem**: Downloaded file is corrupted
- **Solution**:
  - Verify template file is valid Excel format
  - Check xlsx library is installed: `npm install xlsx`
  - Clear browser cache and retry

## Dependencies

Required npm packages:
- `xlsx` (^0.18.5) - Excel file handling
- `next` - Next.js framework
- Standard Node.js modules: `fs/promises`, `path`

## Environment Variables

Required in `.env` or `.env.local`:

```env
WMS_API_KEY=your_api_key_here
WMS_API_BASE_URL=https://wms-api.sinergisuperapp.com
```

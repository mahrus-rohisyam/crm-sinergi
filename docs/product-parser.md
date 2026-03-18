# Product Parser Documentation

## Overview

Product parser adalah utility untuk parsing `product_summary` field dari WMS API dan mapping ke kolom-kolom produk individual dalam Excel export. Setiap brand (Reglow, Amura) memiliki set produk yang berbeda.

## Product Summary Format

WMS API mengembalikan produk dalam format `product_summary`:

```
"2 AM-NG-20"                                    // Single product
"1 RG-SP-50,1 RG-PG-20,1 RG-TR"                // Multiple products
"1 RG-SP-50,1 RG-PG-20,1 RG-AH-100,1 RG-TR,1 RG-SL-30,1 RG-RJ-20,1 RG-IW-20,1 RG-PCH,1 RG-SR"
```

Format pattern: `{quantity} {BRAND}-{CODE}-{VARIANT}`
- Quantity: angka (1, 2, 3, dst)
- Brand: AM (Amura) atau RG (Reglow)
- Code: kode produk (NG, SP, TR, dll)
- Variant: optional, biasanya angka (20, 50, 100, dst)

## Product Code Mapping

### Reglow Products

| Full Code | Short Code | Product Name | Notes |
|-----------|------------|--------------|-------|
| RG-DC | RGDC | Day Cream | |
| RG-TN | RGTN | Toner | |
| RG-FW | RGFW | Face Wash | |
| RG-PCH | RGPCH | Pouch | |
| RG-SM | RGSM | Serum | |
| RG-SR | RGSR | Sunscreen | |
| RG-NC | RGNC | Night Cream | |
| RG-MO | RGMO | Moisturizer | |
| RG-TH | RGTH | Toner Hydrating | |
| RG-FF | RGFF | Facial Foam | |
| RG-AS | RGAS | Anti-aging Serum | |
| RG-SS | RGSS | Skin Serum | |
| DC-NEW | DCNEW | Day Cream New | |
| TR-NEW | TRNEW | Toner New | |
| FW-NEW | FWNEW | Face Wash New | |
| SR-NEW | SRNEW | Sunscreen New | |
| NC-NEW | NCNEW | Night Cream New | |
| RG-PS | RGPS | Post Serum | |
| BUT-ND4 | BUTND4 | Bundling ND4 | |
| BUT-NB4 | BUTNB4 | Bundling NB4 | |
| BUT-SP4 | BUTSP4 | Bundling SP4 | |
| BUT-PP4 | BUTPP4 | Bundling PP4 | |
| BUT-TR4 | BUTTR4 | Bundling TR4 | |
| BL-50 | BL50 | Bundle 50 | |
| BL-180 | BL180 | Bundle 180 | |
| RG-SP-50 | RGSP50 | Special Pack 50 | With variant |
| RG-GG-50 | RGGG50 | Gift Set 50 | With variant |
| RG-PSY | RGPSY | Psychology Set | |
| RG-LBS | RGLBS | Lab Series | |
| OTHER | OTHER | Other products | Catch-all |

### Amura Products

| Full Code | Short Code | Product Name | Notes |
|-----------|------------|--------------|-------|
| AM-NG | AMNG | Night Gel | |
| AM-VC | AMVC | Vitamin C | |
| AM-PA | AMPA | Papaya | |
| AM-DSP | AMDSP | Day SPF | |
| AM-AMP | AMAMP | Ampoule | |
| AM-HMP | AMHMP | Hemp | |
| AM-TS | AMTS | Toner Spray | |
| AM-SY | AMSY | Syrup | |
| AM-DC | AMDC | Day Cream | |
| AM-NC | AMNC | Night Cream | |
| AM-SYTON | AMSYTON | Syton | |
| AM-RT | AMRT | Retinol | |
| AM-RNP | AMRNP | Renew Plus | |
| AM-HG | AMHG | Hydrogel | |
| AM-EGC | AMEGC | EGC | |
| AM-BRT | AMBRT | Brightening | |
| AM-ESP | AMESP | Essence SPF | |
| AM-GL | AMGL | Glow | |
| AM-SS | AMSS | Sun Screen | |
| AM-BND | AMBND | Bundle | |
| TAS | TAS | Tas/Bag | |
| SCR | SCR | Scrub | |
| AM-CMN | AM-CMN | Common | |

## Parse Logic

### Step 1: Split by comma
```
"1 RG-SP-50,1 RG-PG-20" -> ["1 RG-SP-50", "1 RG-PG-20"]
```

### Step 2: Extract quantity and code
```
"1 RG-SP-50" -> { quantity: 1, fullCode: "RG-SP-50" }
```

### Step 3: Generate short code
```
"RG-SP-50" -> "RGSP50"  (brand + code + variant)
"RG-TR" -> "RGTR"       (brand + code, no variant)
```

### Step 4: Store in result map
```typescript
{
  "RG-SP-50": 1,
  "RGSP50": 1,
  "RG-PG-20": 1,
  "RGPG": 1  // Note: might be mapped to RGPG20 depending on product list
}
```

## Usage Examples

### Example 1: Single Product

**Input:**
```json
{
  "product_summary": "2 AM-NG-20"
}
```

**Parse Result:**
```typescript
{
  "AM-NG-20": 2,
  "AMNG": 2
}
```

**Excel Output:**
| AMNG | AMVC | AMPA | ... |
|------|------|------|-----|
| 2    | 0    | 0    | ... |

### Example 2: Multiple Products

**Input:**
```json
{
  "product_summary": "1 RG-SP-50,1 RG-PG-20,1 RG-TR"
}
```

**Parse Result:**
```typescript
{
  "RG-SP-50": 1,
  "RGSP50": 1,
  "RG-PG-20": 1,
  "RGPG": 1,
  "RG-TR": 1,
  "RGTR": 1
}
```

**Excel Output:**
| RGSP50 | RGPG | RGTR | ... |
|--------|------|------|-----|
| 1      | 1    | 1    | ... |

### Example 3: Bundle (from real data)

**Input:**
```json
{
  "product_summary": "1 RG-SP-50,1 RG-PG-20,1 RG-AH-100,1 RG-TR,1 RG-SL-30,1 RG-RJ-20,1 RG-IW-20,1 RG-PCH,1 RG-SR",
  "note": "BUNDLING REGLOW 495 FREE TONER, FACIAL FOAM, SERUM, POCH"
}
```

**Parse Result:**
```typescript
{
  "RG-SP-50": 1,
  "RGSP50": 1,
  "RG-PG-20": 1,
  // ... (other products)
  "RG-PCH": 1,
  "RGPCH": 1,
  "RG-SR": 1,
  "RGSR": 1
}
```

## Code Implementation

### Parser Function

```typescript
export function parseProductSummary(productSummary: string): ProductQuantities {
  const products: ProductQuantities = {};
  
  if (!productSummary || productSummary.trim() === "") {
    return products;
  }
  
  const items = productSummary.split(",");
  
  for (const item of items) {
    const trimmed = item.trim();
    const match = trimmed.match(/^(\d+)\s+([A-Z]{2}-[A-Z]+(?:-\d+)?)/);
    
    if (match) {
      const quantity = parseInt(match[1], 10);
      const productCode = match[2];
      
      products[productCode] = (products[productCode] || 0) + quantity;
      
      const shortCode = generateShortCode(productCode);
      if (shortCode) {
        products[shortCode] = (products[shortCode] || 0) + quantity;
      }
    }
  }
  
  return products;
}
```

### Column Generator

```typescript
// For Reglow
const reglowColumns = getReglowProductColumns();
const productData = reglowColumns.reduce((acc, col) => {
  acc[col] = productQuantities[col] || 0;
  return acc;
}, {});

// For Amura
const amuraColumns = getAmuraProductColumns();
const productData = amuraColumns.reduce((acc, col) => {
  acc[col] = productQuantities[col] || 0;
  return acc;
}, {});
```

## Testing

### Unit Test Cases

```typescript
// Test 1: Single product
const result1 = parseProductSummary("2 AM-NG-20");
// Expected: { "AM-NG-20": 2, "AMNG": 2 }

// Test 2: Multiple products
const result2 = parseProductSummary("1 RG-SP-50,1 RG-PG-20");
// Expected: { "RG-SP-50": 1, "RGSP50": 1, "RG-PG-20": 1, "RGPG": 1 }

// Test 3: No variant products
const result3 = parseProductSummary("1 RG-TR,1 RG-PCH");
// Expected: { "RG-TR": 1, "RGTR": 1, "RG-PCH": 1, "RGPCH": 1 }

// Test 4: Empty string
const result4 = parseProductSummary("");
// Expected: {}

// Test 5: Duplicate products (accumulate)
const result5 = parseProductSummary("2 AM-NG-20,3 AM-NG-20");
// Expected: { "AM-NG-20": 5, "AMNG": 5 }
```

## Edge Cases

### 1. Non-standard Format
**Input:** `"AMNG 2"` (reversed order)
**Result:** Not parsed (returns empty)
**Reason:** Regex expects quantity first

### 2. Missing Quantity
**Input:** `"AM-NG-20"`
**Result:** Not parsed
**Reason:** Quantity is required

### 3. Invalid Characters
**Input:** `"1 AM_NG_20"`
**Result:** Not parsed
**Reason:** Regex expects dashes, not underscores

### 4. Mixed Case
**Input:** `"1 am-ng-20"`
**Result:** Not parsed
**Reason:** Regex expects uppercase

### 5. Extra Spaces
**Input:** `"1  AM-NG-20"` (double space)
**Result:** Parsed successfully
**Reason:** `\s+` matches multiple spaces

## Maintenance

### Adding New Products

1. **Add to product columns list:**
```typescript
export function getReglowProductColumns(): string[] {
  return [
    // ... existing products
    "RGNEWPROD", // Add new product code
  ];
}
```

2. **No code changes needed** - parser automatically handles new products if they follow the naming convention

3. **Update documentation** - add to product mapping table

### Changing Product Codes

If WMS changes product codes:

1. Update regex pattern if format changes
2. Update `generateShortCode()` logic if mapping changes
3. Update product column lists
4. Test with real data

## Integration Points

### With Export Endpoints

Both segment export and WMS orders export use this parser:

```typescript
// In export route
import { parseProductSummary, getReglowProductColumns } from "@/lib/product-parser";

const rows = orders.map((order) => {
  const productQuantities = parseProductSummary(order.product_summary);
  
  const productColumns = getReglowProductColumns().reduce((acc, col) => {
    acc[col] = productQuantities[col] || 0;
    return acc;
  }, {});
  
  return {
    ...baseData,
    ...productColumns,
    ...financialData,
  };
});
```

### With Excel Templates

Templates should have columns matching the product codes:

**Reglow Template:** RGDC, RGTN, RGFW, RGPCH, ... (all 30+ columns)

**Amura Template:** AMNG, AMVC, AMPA, AMDSP, ... (all 23+ columns)

## Performance Considerations

- **Regex complexity:** O(n) where n is product_summary length
- **Split operations:** O(m) where m is number of products
- **Overall:** O(n × m), very fast for typical order sizes
- **Memory:** Minimal - just stores product quantities map

## Future Enhancements

1. **Smart product matching** - fuzzy matching for typos
2. **Product aliases** - support multiple codes for same product
3. **Validation** - warn about unknown product codes
4. **Analytics** - track which products appear most often
5. **Dynamic columns** - generate columns based on actual products in dataset

---

**Created:** 19 Maret 2026  
**Status:** ✅ Production Ready

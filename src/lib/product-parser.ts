/**
 * Product Parser for WMS Order Export
 * Parses product_summary field and maps to individual product columns
 */

export type ProductQuantities = Record<string, number>;

/**
 * Parse product_summary string to extract product codes and quantities
 * Examples:
 * - "2 AM-NG-20" -> { "AM-NG-20": 2, "AMNG": 2 }
 * - "1 RG-SP-50,1 RG-PG-20" -> { "RG-SP-50": 1, "RG-PG-20": 1, "RGSP50": 1, "RGPG": 1 }
 */
export function parseProductSummary(productSummary: string): ProductQuantities {
  const products: ProductQuantities = {};

  if (!productSummary || productSummary.trim() === "") {
    return products;
  }

  // Split by comma for multiple products
  const items = productSummary.split(",");

  for (const item of items) {
    const trimmed = item.trim();
    // Match pattern: "quantity product-code" or "quantity product-code-variant"
    // Examples: "2 AM-NG-20", "1 RG-SP-50", "1 RG-TR"
    const match = trimmed.match(/^(\d+)\s+([A-Z]{2}-[A-Z]+(?:-\d+)?)/);

    if (match) {
      const quantity = parseInt(match[1], 10);
      const productCode = match[2]; // e.g., "AM-NG-20" or "RG-TR"

      // Store with full code
      products[productCode] = (products[productCode] || 0) + quantity;

      // Generate short code for column mapping
      const shortCode = generateShortCode(productCode);
      if (shortCode) {
        products[shortCode] = (products[shortCode] || 0) + quantity;
      }
    }
  }

  return products;
}

/**
 * Generate short code from full product code for column mapping
 * Maps full SKU codes to template column names
 * 
 * Examples:
 * - "RG-PCH" -> "RGPCH"  
 * - "RG-CEH-100" -> "RGCEH100" (then falls back to OTHER if not in template)
 * - "AM-NG-20" -> "AMNG"
 */
function generateShortCode(productCode: string): string | null {
  // Direct mapping for known products to template columns
  const SKU_TO_COLUMN: Record<string, string> = {
    // Current Reglow products (from WMS API)
    "RG-TE-20": "OTHER",      // Triple Exfoliate - not in standard columns
    "RG-SL-30": "RGSR",       // Sunscreen Luxury → Sunscreen
    "RG-DA-15": "OTHER",      // Double Action - not in standard columns  
    "RG-CEH-100": "RGTH",     // Ceramides Expert Hydrating Toner → Toner Hydrating
    "RG-CB-30": "RGMO",       // Ceramide Barrier Moisturizer → Moisturizer
    "RG-IW-20": "RGNC",       // Intensive Whitening Night Cream → Night Cream
    "RG-PG-20": "RGSM",       // Perfect Glowing Serum → Serum
    "RG-UGSM": "OTHER",       // Ultimate Glow Sheetmask - not in standard columns
    "RG-PCH": "RGPCH",        // Pouch
    "RG-SPC-90": "RGFW",      // Skin Purifying Cleansing → Face Wash
    
    // Old/Historical Reglow products (may appear in old orders)
    "RG-AH-100": "RGTH",      // Assumed: Hydrating Toner variant
    "RG-SCR": "RGSR",         // Scrub → Sunscreen/Scrub column
    "RG-SR": "RGSR",          // Sunscreen
    "RG-RJ-20": "OTHER",      // Unknown product
    "RG-DC": "RGDC",          // Day Cream
    "RG-TN": "RGTN",          // Toner
    "RG-FW": "RGFW",          // Face Wash
    "RG-SM": "RGSM",          // Serum
    "RG-NC": "RGNC",          // Night Cream
    "RG-MO": "RGMO",          // Moisturizer
    "RG-TH": "RGTH",          // Toner Hydrating
    "RG-FF": "RGFF",          // Facial Foam
    "RG-AS": "RGAS",          // Anti-aging Serum
    "RG-SS": "RGSS",          // Skin Serum
    
    // Amura products
    "AM-NG-20": "AMNG",       // Night Gel
    "AM-NG-30": "AMNG",       // Night Gel 30ml
    "AM-VC": "AMVC",          // Vitamin C
    "AM-PA": "AMPA",          // Papaya
  };
  
  // Check direct mapping first
  if (SKU_TO_COLUMN[productCode]) {
    return SKU_TO_COLUMN[productCode];
  }
  
  // Try without variant (e.g., RG-AH-100 → RG-AH)
  const withoutVariant = productCode.replace(/-\d+$/, '');
  if (withoutVariant !== productCode && SKU_TO_COLUMN[withoutVariant]) {
    return SKU_TO_COLUMN[withoutVariant];
  }
  
  // Fallback: generate code from pattern
  const parts = productCode.split("-");
  if (parts.length < 2) return "OTHER";

  const brand = parts[0]; // AM or RG
  const code = parts[1]; // NG, SP, TR, etc.
  const variant = parts[2]; // 20, 50, etc. (optional)

  if (variant) {
    // Has variant number: AM-NG-20 -> AMNG, RG-SP-50 -> RGSP50
    return `${brand}${code}${variant}`;
  } else {
    // No variant: RG-TR -> RGTR, RG-PCH -> RGPCH
    return `${brand}${code}`;
  }
}

/**
 * Get all Reglow product columns
 */
export function getReglowProductColumns(): string[] {
  return [
    "RGDC",
    "RGTN",
    "RGFW",
    "RGPCH",
    "RGSM",
    "RGSR",
    "RGNC",
    "RGMO",
    "RGTH",
    "RGFF",
    "RGAS",
    "RGSS",
    "DCNEW",
    "TRNEW",
    "FWNEW",
    "SRNEW",
    "NCNEW",
    "RGPS",
    "BUTND4",
    "BUTNB4",
    "BUTSP4",
    "BUTPP4",
    "BUTTR4",
    "BL50",
    "BL180",
    "RGSP50",
    "RGGG50",
    "RGPSY",
    "RGLBS",
    "OTHER",
  ];
}

/**
 * Get all Amura product columns
 */
export function getAmuraProductColumns(): string[] {
  return [
    "AMNG",
    "AMVC",
    "AMPA",
    "AMDSP",
    "AMAMP",
    "AMHMP",
    "AMTS",
    "AMSY",
    "AMDC",
    "AMNC",
    "AMSYTON",
    "AMRT",
    "AMRNP",
    "AMHG",
    "AMEGC",
    "AMBRT",
    "AMESP",
    "AMGL",
    "AMSS",
    "AMBND",
    "TAS",
    "SCR",
    "AM-CMN",
  ];
}

/**
 * Format date to Indonesian format
 */
export function formatDateIndonesian(dateString: string): string {
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

import * as XLSX from "xlsx";

/**
 * Parsed Everpro contact from CSV/XLSX file
 */
export type EverproContactData = {
  phoneNumber: string; // normalized format for matching
  customerName: string;
  lastBlastDate: Date | null;
  rawPhoneNumber: string; // original from file for debugging
};

/**
 * Result of parsing operation
 */
export type ParseResult = {
  success: boolean;
  contacts: EverproContactData[];
  totalRows: number;
  errors: string[];
};

/**
 * Normalize phone number to consistent format for matching
 * Handles multiple input formats:
 * - "85158029917" → "6285158029917"
 * - "085158029917" → "6285158029917"
 * - "6285158029917" → "6285158029917"
 * - "+6285158029917" → "6285158029917"
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // If starts with 0, replace with 62
  if (digits.startsWith("0")) {
    return "62" + digits.substring(1);
  }

  // If doesn't start with 62, add it
  if (!digits.startsWith("62")) {
    return "62" + digits;
  }

  // Already in correct format
  return digits;
}

/**
 * Try multiple phone number formats for matching
 * Returns array of possible formats to check against database
 */
export function getPhoneNumberVariants(phone: string): string[] {
  const normalized = normalizePhoneNumber(phone);
  const variants = [normalized];

  // Add version without country code (0-prefixed)
  if (normalized.startsWith("62")) {
    variants.push("0" + normalized.substring(2));
  }

  // Add version without 0 or 62 prefix (raw digits after country/trunk code)
  const rawDigits = normalized.startsWith("62")
    ? normalized.substring(2)
    : normalized.startsWith("0")
      ? normalized.substring(1)
      : normalized;
  variants.push(rawDigits);

  return [...new Set(variants)]; // deduplicate
}

/**
 * Parse date from various formats commonly used in Everpro exports
 * Supports:
 * - DD/MM/YYYY (Indonesian standard)
 * - YYYY-MM-DD (ISO)
 * - MM/DD/YYYY (US format)
 * - Excel serial date numbers
 */
export function parseEverproDate(dateValue: unknown): Date | null {
  if (!dateValue) return null;

  // Handle Excel serial date number
  if (typeof dateValue === "number") {
    // Excel dates are days since 1900-01-01 (with 1900 leap year bug)
    const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
    const msPerDay = 24 * 60 * 60 * 1000;
    return new Date(excelEpoch.getTime() + dateValue * msPerDay);
  }

  // Handle string dates
  if (typeof dateValue === "string") {
    const trimmed = dateValue.trim();
    if (!trimmed) return null;

    // Try DD/MM/YYYY format (most common in Indonesia)
    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) return date;
    }

    // Try ISO format or other standard formats
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) return date;
  }

  // Handle Date objects
  if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
    return dateValue;
  }

  return null;
}

/**
 * Parse Everpro CSV content
 * Expected columns: no_telp, nama_customer, tanggal_terakhir_blast
 */
export function parseEverproCSV(csvContent: string): ParseResult {
  const errors: string[] = [];
  const contacts: EverproContactData[] = [];

  try {
    const lines = csvContent.split("\n").filter((line) => line.trim());
    if (lines.length === 0) {
      return {
        success: false,
        contacts: [],
        totalRows: 0,
        errors: ["File is empty"],
      };
    }

    // Parse header
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const phoneIndex = header.findIndex((h) =>
      ["no_telp", "no_hp", "phone", "phone_number", "hp", "nomor"].includes(h),
    );
    const nameIndex = header.findIndex((h) =>
      ["nama_customer", "customer_name", "nama", "name", "customer"].includes(
        h,
      ),
    );
    const dateIndex = header.findIndex((h) =>
      [
        "tanggal_terakhir_blast",
        "terakhir_blast",
        "last_blast",
        "tanggal",
      ].includes(h),
    );

    if (phoneIndex === -1) {
      errors.push("Missing phone number column (expected: no_telp)");
      return { success: false, contacts: [], totalRows: 0, errors };
    }
    if (nameIndex === -1) {
      errors.push("Missing customer name column (expected: nama_customer)");
      return { success: false, contacts: [], totalRows: 0, errors };
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(",").map((v) => v.trim());
      const rawPhone = values[phoneIndex] || "";
      const name = values[nameIndex] || "";
      const dateValue = dateIndex !== -1 ? values[dateIndex] : null;

      if (!rawPhone) {
        errors.push(`Row ${i + 1}: Missing phone number`);
        continue;
      }

      if (!name) {
        errors.push(`Row ${i + 1}: Missing customer name`);
        continue;
      }

      try {
        const phoneNumber = normalizePhoneNumber(rawPhone);
        const lastBlastDate = parseEverproDate(dateValue);

        contacts.push({
          phoneNumber,
          customerName: name,
          lastBlastDate,
          rawPhoneNumber: rawPhone,
        });
      } catch (err) {
        errors.push(
          `Row ${i + 1}: Failed to parse - ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return {
      success: contacts.length > 0,
      contacts,
      totalRows: lines.length - 1, // excluding header
      errors,
    };
  } catch (error) {
    return {
      success: false,
      contacts: [],
      totalRows: 0,
      errors: [
        `CSV parsing failed: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }
}

/**
 * Parse Everpro Excel file (XLSX/XLS)
 * Expected columns: no_telp, nama_customer, tanggal_terakhir_blast
 */
export function parseEverproExcel(buffer: Buffer): ParseResult {
  const errors: string[] = [];
  const contacts: EverproContactData[] = [];

  try {
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

    // Use first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return {
        success: false,
        contacts: [],
        totalRows: 0,
        errors: ["Workbook has no sheets"],
      };
    }

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    if (data.length === 0) {
      return {
        success: false,
        contacts: [],
        totalRows: 0,
        errors: ["Sheet is empty"],
      };
    }

    // Find column names (flexible matching)
    const firstRow = data[0] as Record<string, unknown>;
    const columns = Object.keys(firstRow);

    const phoneColumn = columns.find((c) =>
      /no_?telp|no_?hp|phone_?number|phone|hp|nomor/i.test(c),
    );
    const nameColumn = columns.find((c) =>
      /nama_?customer|customer_?name|nama|name|customer/i.test(c),
    );
    const dateColumn = columns.find((c) =>
      /tanggal_?terakhir_?blast|terakhir_?blast|last_?blast|tanggal/i.test(c),
    );

    if (!phoneColumn) {
      errors.push(
        "Missing phone number column (expected: no_telp, no_hp, phone, etc.)",
      );
      return { success: false, contacts: [], totalRows: 0, errors };
    }
    if (!nameColumn) {
      errors.push(
        "Missing customer name column (expected: nama_customer, nama, name, etc.)",
      );
      return { success: false, contacts: [], totalRows: 0, errors };
    }

    // Parse each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as Record<string, unknown>;
      const rawPhone = String(row[phoneColumn] || "").trim();
      const name = String(row[nameColumn] || "").trim();
      const dateValue = dateColumn ? row[dateColumn] : null;

      if (!rawPhone) {
        errors.push(`Row ${i + 2}: Missing phone number`);
        continue;
      }

      if (!name) {
        errors.push(`Row ${i + 2}: Missing customer name`);
        continue;
      }

      try {
        const phoneNumber = normalizePhoneNumber(rawPhone);
        const lastBlastDate = parseEverproDate(dateValue);

        contacts.push({
          phoneNumber,
          customerName: name,
          lastBlastDate,
          rawPhoneNumber: rawPhone,
        });
      } catch (err) {
        errors.push(
          `Row ${i + 2}: Failed to parse - ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return {
      success: contacts.length > 0,
      contacts,
      totalRows: data.length,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      contacts: [],
      totalRows: 0,
      errors: [
        `Excel parsing failed: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }
}

/**
 * Parse Everpro file (auto-detect CSV or Excel based on extension)
 */
export function parseEverproFile(
  buffer: Buffer,
  fileName: string,
): ParseResult {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    const csvContent = buffer.toString("utf-8");
    return parseEverproCSV(csvContent);
  } else if (extension === "xlsx" || extension === "xls") {
    return parseEverproExcel(buffer);
  } else {
    return {
      success: false,
      contacts: [],
      totalRows: 0,
      errors: [`Unsupported file type: ${extension}`],
    };
  }
}

import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
  fetchOrdersEfficiently,
  getBrandClientId,
  buildWMSQueryFromFilters,
  type WMSOrder,
} from "@/lib/wms-api";
import { getPhoneNumberVariants } from "@/lib/everpro-parser";
import {
  parseProductSummary,
  getReglowProductColumns,
  getAmuraProductColumns,
  formatDateIndonesian,
} from "@/lib/product-parser";

type FilterModule = {
  id: string;
  type: string;
  connector: "AND" | "OR";
  config: Record<string, unknown>;
};

type EnrichedOrder = WMSOrder & {
  lastContact?: string | null;
  engagementStatus?: "contacted" | "not_contacted" | "unknown";
  blastStatus?: string;
};

/**
 * Filter enriched order based on engagement_status filter (applied after Everpro enrichment)
 */
function matchesEngagementStatusFilter(
  order: EnrichedOrder,
  config: Record<string, unknown>,
): boolean {
  // Check blast status filter
  const showOnlyNotContacted = config.showOnlyNotContacted as boolean | undefined;
  if (showOnlyNotContacted && order.engagementStatus !== "not_contacted") {
    return false;
  }

  // Check last contact date range
  const dateStart = config.lastContactDateStart as string | undefined;
  const dateEnd = config.lastContactDateEnd as string | undefined;

  if ((dateStart || dateEnd) && order.lastContact) {
    const lastContactDate = new Date(order.lastContact);
    
    if (dateStart) {
      const startDate = new Date(dateStart);
      startDate.setHours(0, 0, 0, 0);
      if (lastContactDate < startDate) return false;
    }
    
    if (dateEnd) {
      const endDate = new Date(dateEnd);
      endDate.setHours(23, 59, 59, 999);
      if (lastContactDate > endDate) return false;
    }
  } else if (dateStart || dateEnd) {
    // No last contact date but filter requires it - exclude
    return false;
  }

  return true;
}

/**
 * Filter WMS order based on a single filter module (client-side filtering)
 */
function matchesFilterCondition(
  order: WMSOrder,
  filter: FilterModule,
): boolean {
  const c = filter.config;

  switch (filter.type) {
    case "brand": {
      const brands = c.brands as string[] | undefined;
      if (!brands || brands.length === 0) return true;
      return brands.some(
        (b) => order.client_name?.toLowerCase() === b.toLowerCase(),
      );
    }
    case "transaction": {
      const skus = c.skus as string[] | undefined;
      if (skus && skus.length > 0) {
        const matches = skus.some(
          (sku) =>
            order.product_summary?.toLowerCase().includes(sku.toLowerCase()),
        );
        if (!matches) return false;
      }

      const minQty = c.minQty ? Number(c.minQty) : undefined;
      const maxQty = c.maxQty ? Number(c.maxQty) : undefined;
      if (minQty !== undefined && order.qty < minQty) return false;
      if (maxQty !== undefined && order.qty > maxQty) return false;

      const minAmount = c.minAmount ? Number(c.minAmount) : undefined;
      const maxAmount = c.maxAmount ? Number(c.maxAmount) : undefined;
      if (minAmount !== undefined && order.amount < minAmount) return false;
      if (maxAmount !== undefined && order.amount > maxAmount) return false;

      // Note: Transaction type filter not available in WMS Order type
      // Skipping transaction type check

      const expeditions = c.expeditions as string[] | undefined;
      if (expeditions && expeditions.length > 0) {
        if (!expeditions.some((exp) => order.courier?.toLowerCase().includes(exp.toLowerCase()))) {
          return false;
        }
      }

      return true;
    }
    case "timeframe": {
      const inputDateStart = c.inputDateStart as string | undefined;
      const inputDateEnd = c.inputDateEnd as string | undefined;
      const shippingDateStart = c.shippingDateStart as string | undefined;
      const shippingDateEnd = c.shippingDateEnd as string | undefined;

      if (inputDateStart || inputDateEnd) {
        const orderDate = new Date(order.created_at);
        if (inputDateStart) {
          const start = new Date(inputDateStart);
          start.setHours(0, 0, 0, 0);
          if (orderDate < start) return false;
        }
        if (inputDateEnd) {
          const end = new Date(inputDateEnd);
          end.setHours(23, 59, 59, 999);
          if (orderDate > end) return false;
        }
      }

      if (shippingDateStart || shippingDateEnd) {
        if (!order.order_at) return false;
        const shippingDate = new Date(order.order_at);
        if (shippingDateStart) {
          const start = new Date(shippingDateStart);
          start.setHours(0, 0, 0, 0);
          if (shippingDate < start) return false;
        }
        if (shippingDateEnd) {
          const end = new Date(shippingDateEnd);
          end.setHours(23, 59, 59, 999);
          if (shippingDate > end) return false;
        }
      }

      return true;
    }
    case "demographics": {
      const customerName = c.customerName as string | undefined;
      if (customerName && !order.customer_name?.toLowerCase().includes(customerName.toLowerCase())) {
        return false;
      }

      const phoneNumber = c.phoneNumber as string | undefined;
      if (phoneNumber && !order.customer_phone?.includes(phoneNumber)) {
        return false;
      }

      const provinces = c.provinces as string[] | undefined;
      if (provinces && provinces.length > 0) {
        if (!provinces.some((p) => order.customer_province?.toLowerCase() === p.toLowerCase())) {
          return false;
        }
      }

      const cities = c.cities as string[] | undefined;
      if (cities && cities.length > 0) {
        if (!cities.some((city) => order.customer_city?.toLowerCase().includes(city.toLowerCase()))) {
          return false;
        }
      }

      const districts = c.districts as string[] | undefined;
      if (districts && districts.length > 0) {
        if (!districts.some((d) => order.customer_district?.toLowerCase().includes(d.toLowerCase()))) {
          return false;
        }
      }

      return true;
    }
    case "engagement_customer": {
      const customerTypes = c.customerTypes as string[] | undefined;
      if (customerTypes && customerTypes.length > 0) {
        if (!customerTypes.some((t) => order.customer_type?.toLowerCase() === t.toLowerCase())) {
          return false;
        }
      }

      // Note: Order frequency filtering would require grouping by customer
      // Not implemented in single-order filtering
      return true;
    }
    case "engagement_management": {
      const csNames = c.csNames as string[] | undefined;
      if (csNames && csNames.length > 0) {
        if (!csNames.some((cs) => order.customer_service?.toLowerCase().includes(cs.toLowerCase()))) {
          return false;
        }
      }

      const leadSources = c.leadSources as string[] | undefined;
      if (leadSources && leadSources.length > 0) {
        if (!leadSources.some((ls) => order.ads_platform_name?.toLowerCase().includes(ls.toLowerCase()))) {
          return false;
        }
      }

      return true;
    }
    default:
      return true;
  }
}

/**
 * Check if an order matches all filters with AND/OR connectors
 */
function matchesAllFilters(
  order: WMSOrder,
  filters: FilterModule[],
): boolean {
  if (filters.length === 0) return true;

  // First filter always applies
  let result = matchesFilterCondition(order, filters[0]);

  // Apply subsequent filters with their connectors
  for (let i = 1; i < filters.length; i++) {
    const filter = filters[i];
    const matches = matchesFilterCondition(order, filter);

    if (filter.connector === "AND") {
      result = result && matches;
    } else {
      // OR
      result = result || matches;
    }
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filters, segmentName } = body as {
      filters: FilterModule[];
      segmentName: string;
    };

    if (!filters || filters.length === 0) {
      return NextResponse.json(
        { error: "No filters provided" },
        { status: 400 }
      );
    }

    console.log(`[Export Preview] Starting full export for segment: ${segmentName}`);

    // Determine brand from filters
    let brand: string | null = null;
    for (const filter of filters) {
      if (filter.type === "brand") {
        const brands = filter.config.brands as string[] | undefined;
        if (brands && brands.length > 0) {
          brand = brands[0]; // Use first brand for template selection
          break;
        }
      }
    }

    // Default to Amura if no brand specified
    if (!brand) {
      brand = "Amura";
    }
    
    console.log(`[Export Preview] Using brand: ${brand}`);

    // Validate brand has client_id mapping
    const clientId = getBrandClientId(brand);
    if (!clientId) {
      return NextResponse.json(
        { error: `Invalid brand: ${brand}. Cannot export without valid brand.` },
        { status: 400 },
      );
    }

    // Determine template file
    const templateFileName = `OrdersExport${brand}.xlsx`;
    const templatePath = path.join(
      process.cwd(),
      "public",
      "templates",
      templateFileName,
    );

    // Check if template exists
    let templateBuffer: Buffer;
    try {
      templateBuffer = await readFile(templatePath);
    } catch {
      return NextResponse.json(
        { error: `Template not found: ${templateFileName}` },
        { status: 404 },
      );
    }

    console.log(`[Export Preview] Template loaded: ${templateFileName}`);

    // Build WMS query parameters
    const wmsQuery = buildWMSQueryFromFilters(filters);
    
    // Fetch ALL matching orders (no limit)
    console.log(`[Export Preview] Fetching all orders from WMS...`);
    const allOrders = await fetchOrdersEfficiently(
      wmsQuery,
      999999 // Very large number to get all records
    );

    console.log(`[Export Preview] Fetched ${allOrders.length} orders from WMS`);

    // Apply client-side filtering (without engagement filter first)
    const filtersWithoutEngagement = filters.filter(f => f.type !== "engagement_status");
    const matchingOrders = allOrders.filter((order) =>
      matchesAllFilters(order, filtersWithoutEngagement),
    );

    console.log(`[Export Preview] ${matchingOrders.length} orders match filters`);

    // Group by customer phone to deduplicate
    const customerMap = new Map<string, EnrichedOrder>();
    for (const order of matchingOrders) {
      const phone = order.customer_phone;
      if (!phone) continue;

      const existing = customerMap.get(phone);
      if (!existing || new Date(order.created_at) > new Date(existing.created_at)) {
        customerMap.set(phone, order);
      }
    }

    let uniqueCustomers = Array.from(customerMap.values());
    console.log(`[Export Preview] ${uniqueCustomers.length} unique customers`);

    // Check if we need Everpro enrichment
    const hasEngagementFilter = filters.some((f) => f.type === "engagement_status");

    if (hasEngagementFilter) {
      console.log(`[Export Preview] Enriching with Everpro data...`);
      
      // Collect phone number variants
      const phoneVariantsMap = new Map<string, string[]>();
      for (const order of uniqueCustomers) {
        const variants = getPhoneNumberVariants(order.customer_phone);
        phoneVariantsMap.set(order.customer_phone, variants);
      }

      const allVariants = Array.from(
        new Set(Array.from(phoneVariantsMap.values()).flat()),
      );

      // Fetch Everpro contacts
      const everproContacts = await prisma.everproContact.findMany({
        where: { phoneNumber: { in: allVariants } },
      });

      const everproMap = new Map(
        everproContacts.map((c) => [c.phoneNumber, c]),
      );

      // Enrich orders
      uniqueCustomers = uniqueCustomers.map((order) => {
        const variants = phoneVariantsMap.get(order.customer_phone) || [];
        let everproContact = null;
        for (const variant of variants) {
          everproContact = everproMap.get(variant);
          if (everproContact) break;
        }

        if (everproContact) {
          return {
            ...order,
            lastContact: everproContact.lastBlastDate?.toISOString() || null,
            engagementStatus:
              everproContact.blastStatus === "Sudah"
                ? "contacted"
                : "not_contacted",
            blastStatus: everproContact.blastStatus,
          };
        }

        return {
          ...order,
          lastContact: null,
          engagementStatus: "unknown" as const,
          blastStatus: undefined,
        };
      });

      // Apply engagement status filtering
      const engagementFilter = filters.find((f) => f.type === "engagement_status");
      if (engagementFilter) {
        uniqueCustomers = uniqueCustomers.filter((order) =>
          matchesEngagementStatusFilter(order, engagementFilter.config),
        );
      }

      console.log(`[Export Preview] ${uniqueCustomers.length} customers after engagement filter`);
    }

    // Sort by most recent order
    uniqueCustomers.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    if (uniqueCustomers.length === 0) {
      console.warn(`[Export Preview] No customers found after filtering`);
      return NextResponse.json(
        { error: "No customers match the filters" },
        { status: 404 },
      );
    }

    // Load template workbook
    console.log(`[Export Preview] Loading template workbook...`);
    const workbook = XLSX.read(templateBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];

    // Convert orders to rows matching brand-specific template structure
    console.log(`[Export Preview] Converting ${uniqueCustomers.length} orders to Excel rows...`);
    const rows = uniqueCustomers.map((order) => {
      // Parse product summary to get individual product quantities
      const productQuantities = parseProductSummary(order.product_summary);

      // Base row data (common for all brands)
      const baseRow = {
        "Nomor Order": order.reference_no,
        "Tanggal Input": formatDateIndonesian(order.created_at),
        "Tanggal Process": formatDateIndonesian(order.order_at),
        "Nama CS": order.customer_service,
        "Sumber Leads": order.ads_platform_name,
        "Jenis Cust": order.customer_type,
        "Jenis Paket": order.courier_label,
        "Nama Lengkap": order.customer_name,
        "No HP/Wa": order.customer_phone,
        "Alamat Lengkap": order.customer_address,
        "Kelurahan /Desa": order.customer_sub_district,
        "Kecamatan": order.customer_district,
        "Kota/Kab": order.customer_city,
        "Provinsi": order.customer_province,
      };

      // Add brand-specific product columns
      let brandProductColumns = {};
      
      if (brand === "Reglow") {
        const reglowColumns = getReglowProductColumns();
        brandProductColumns = reglowColumns.reduce((acc, col) => {
          acc[col] = productQuantities[col] || 0;
          return acc;
        }, {} as Record<string, number>);
      } else if (brand === "Amura") {
        const amuraColumns = getAmuraProductColumns();
        brandProductColumns = amuraColumns.reduce((acc, col) => {
          acc[col] = productQuantities[col] || 0;
          return acc;
        }, {} as Record<string, number>);
      }

      // Add financial and shipping columns
      const financialColumns = {
        "Jumlah Pcs": order.qty,
        "Harga Barang": order.amount,
        "Note": order.note || "",
        "Eksepedisi": order.courier,
        "Ongkir": order.shipping_fee || 0,
        "Type Transaksi": order.is_cod ? "COD" : "Transfer",
        "Payment Method": order.payment_method,
        "Disc Barang": order.discount_amount || 0,
        "Discount Ongkir": order.discount_shipping_fee || 0,
        "Cod Fee": order.cod_fee || 0,
        "Total Transaksi": 
          (order.amount || 0) + 
          (order.shipping_fee || 0) + 
          (order.cod_fee || 0) - 
          (order.discount_amount || 0) - 
          (order.discount_shipping_fee || 0),
        "Other Amount": order.other_amount || 0,
      };

      return {
        ...baseRow,
        ...brandProductColumns,
        ...financialColumns,
      };
    });

    // Create new worksheet with data
    console.log(`[Export Preview] Creating Excel worksheet with ${rows.length} rows...`);
    const newWorksheet = XLSX.utils.json_to_sheet(rows);

    // Replace the sheet in the workbook
    workbook.Sheets[sheetName] = newWorksheet;

    // Write to buffer
    console.log(`[Export Preview] Writing Excel file to buffer...`);
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const sanitizedSegmentName = segmentName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 30);
    const fileName = `${sanitizedSegmentName}_${brand}_${timestamp}.xlsx`;

    console.log(`[Export Preview] Export completed: ${fileName} (${excelBuffer.length} bytes, ${uniqueCustomers.length} customers)`);

    // Return file as download
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error("[Export Preview] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    );
  }
}

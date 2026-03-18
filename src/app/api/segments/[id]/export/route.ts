import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";import {
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
  everproData?: {
    lastBlastDate: Date | null;
    blastStatus: string;
    csName: string | null;
  };
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
 * This handles filters that cannot be applied at WMS API level
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
      if (c.minQty && order.qty < Number(c.minQty)) return false;
      if (c.maxQty && order.qty > Number(c.maxQty)) return false;
      if (c.minAmount && order.amount < Number(c.minAmount)) return false;
      if (c.maxAmount && order.amount > Number(c.maxAmount)) return false;
      if (
        c.transactionType &&
        order.payment_method?.toLowerCase() !==
          (c.transactionType as string).toLowerCase()
      )
        return false;
      const expeditions = c.expeditions as string[] | undefined;
      if (expeditions && expeditions.length > 0) {
        const matches = expeditions.some((exp) =>
          order.courier?.toLowerCase().includes(exp.toLowerCase()),
        );
        if (!matches) return false;
      }
      return true;
    }
    case "timeframe": {
      if (c.inputDateStart) {
        const startDate = new Date(c.inputDateStart as string);
        const orderDate = new Date(order.created_at);
        if (orderDate < startDate) return false;
      }
      if (c.inputDateEnd) {
        const endDate = new Date(c.inputDateEnd as string);
        const orderDate = new Date(order.created_at);
        if (orderDate > endDate) return false;
      }
      return true;
    }
    case "demographics": {
      if (
        c.customerName &&
        !order.customer_name
          ?.toLowerCase()
          .includes((c.customerName as string).toLowerCase())
      )
        return false;
      if (
        c.phoneNumber &&
        !order.customer_phone?.includes(c.phoneNumber as string)
      )
        return false;
      const provinces = c.provinces as string[] | undefined;
      if (
        provinces &&
        provinces.length > 0 &&
        !provinces.some(
          (p) => order.customer_province?.toLowerCase() === p.toLowerCase(),
        )
      )
        return false;
      const cities = c.cities as string[] | undefined;
      if (
        cities &&
        cities.length > 0 &&
        !cities.some(
          (city) => order.customer_city?.toLowerCase() === city.toLowerCase(),
        )
      )
        return false;
      const districts = c.districts as string[] | undefined;
      if (
        districts &&
        districts.length > 0 &&
        !districts.some(
          (d) => order.customer_district?.toLowerCase() === d.toLowerCase(),
        )
      )
        return false;
      return true;
    }
    case "engagement_customer": {
      const custTypes = c.customerTypes as string[] | undefined;
      if (
        custTypes &&
        custTypes.length > 0 &&
        !custTypes.some(
          (t) => order.customer_type?.toLowerCase() === t.toLowerCase(),
        )
      )
        return false;
      return true;
    }
    case "engagement_management": {
      const csNames = c.csNames as string[] | undefined;
      if (
        csNames &&
        csNames.length > 0 &&
        !csNames.some(
          (cs) => order.customer_service?.toLowerCase() === cs.toLowerCase(),
        )
      )
        return false;
      const leadSources = c.leadSources as string[] | undefined;
      if (
        leadSources &&
        leadSources.length > 0 &&
        !leadSources.some(
          (ls) => order.ads_platform_name?.toLowerCase() === ls.toLowerCase(),
        )
      )
        return false;
      return true;
    }
    case "engagement_status": {
      // engagement_status filtering is applied AFTER enrichment
      return true;
    }
    default:
      return true;
  }
}

/**
 * Check if order matches all filters (respecting AND/OR connectors)
 */
function matchesAllFilters(
  order: WMSOrder,
  filters: FilterModule[],
): boolean {
  if (filters.length === 0) return true;

  let result = matchesFilterCondition(order, filters[0]);

  for (let i = 1; i < filters.length; i++) {
    const matches = matchesFilterCondition(order, filters[i]);
    if (filters[i].connector === "OR") {
      result = result || matches;
    } else {
      result = result && matches;
    }
  }

  return result;
}

/**
 * GET /api/segments/[id]/export
 * Export segment results to Excel using brand-specific template
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: segmentId } = await params;
    console.log(`[EXPORT] Starting export for segment ID: ${segmentId}`);

    // Fetch segment from database
    const segment = await prisma.segment.findUnique({
      where: { id: segmentId },
    });

    if (!segment) {
      console.error(`[EXPORT] Segment not found: ${segmentId}`);
      return NextResponse.json(
        { error: "Segment not found" },
        { status: 404 },
      );
    }

    console.log(`[EXPORT] Segment found: ${segment.name} (${segment.resultCount} results)`);

    // Parse filters - handle different structures
    let filters: FilterModule[] = [];
    
    if (Array.isArray(segment.filters)) {
      // Case 1: filters is already an array
      filters = segment.filters as FilterModule[];
    } else if (segment.filters && typeof segment.filters === 'object') {
      const filtersObj = segment.filters as Record<string, unknown>;
      
      if (Array.isArray(filtersObj.filters)) {
        // Case 2: filters wrapped in { filters: [...] }
        filters = filtersObj.filters as FilterModule[];
      } else if ('id' in filtersObj && 'type' in filtersObj) {
        // Case 3: single filter object (no array)
        filters = [filtersObj as FilterModule];
      }
    }
    
    console.log(`[EXPORT] Parsed ${filters.length} filters:`, JSON.stringify(filters));

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
    
    console.log(`[EXPORT] Using brand: ${brand}`);

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

    console.log(`[EXPORT] Template loaded: ${templateFileName}`);

    // Build WMS query params from filters
    const wmsParams = buildWMSQueryFromFilters(filters);
    console.log(`[EXPORT] WMS Query Params:`, JSON.stringify(wmsParams));

    // Fetch orders using segment filters
    console.log(`[EXPORT] Fetching orders from WMS API...`);
    const startTime = Date.now();
    
    const orders = await fetchOrdersEfficiently(wmsParams);
    
    const fetchTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[EXPORT] Fetched ${orders.length} orders from WMS (took ${fetchTime}s)`);

    // Apply client-side filtering for filters not supported by WMS API
    console.log(`[EXPORT] Applying client-side filtering with ${filters.length} filters...`);
    const filteredOrders = orders.filter((order) => matchesAllFilters(order, filters));
    console.log(`[EXPORT] After filtering: ${filteredOrders.length} orders (filtered out ${orders.length - filteredOrders.length} orders)`);

    if (filteredOrders.length === 0) {
      console.warn(`[EXPORT] No orders found after filtering for segment ${segment.name}`);
      return NextResponse.json(
        { error: "No orders found for this segment" },
        { status: 404 },
      );
    }

    // Enrich with Everpro data if there's an engagement filter
    const hasEngagementFilter = filters.some(
      (f) => f.type === "engagement_status",
    );

    let enrichedOrders: EnrichedOrder[] = filteredOrders;

    if (hasEngagementFilter) {
      console.log(`[EXPORT] Enriching with Everpro data...`);
      // Get unique phone numbers
      const phoneNumbers = Array.from(
        new Set(filteredOrders.map((o) => o.customer_phone)),
      );

      // Get all phone variants
      const allVariants = new Set<string>();
      for (const phone of phoneNumbers) {
        const variants = getPhoneNumberVariants(phone);
        variants.forEach((v) => allVariants.add(v));
      }

      console.log(`[EXPORT] Querying ${allVariants.size} phone variants from Everpro DB...`);
      // Query Everpro contacts
      const everproContacts = await prisma.everproContact.findMany({
        where: {
          phoneNumber: {
            in: Array.from(allVariants),
          },
        },
      });
      
      console.log(`[EXPORT] Found ${everproContacts.length} Everpro contacts`);

      // Create lookup map
      const everproMap = new Map(
        everproContacts.map((c) => [c.phoneNumber, c]),
      );

      // Enrich orders
      enrichedOrders = filteredOrders.map((order) => {
        const variants = getPhoneNumberVariants(order.customer_phone);
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
            everproData: {
              lastBlastDate: everproContact.lastBlastDate,
              blastStatus: everproContact.blastStatus,
              csName: everproContact.csName,
            },
          };
        }

        return {
          ...order,
          lastContact: null,
          engagementStatus: "not_contacted",
          blastStatus: "Belum",
        };
      });

      // Apply engagement_status filter
      const engagementFilter = filters.find((f) => f.type === "engagement_status");
      if (engagementFilter) {
        console.log(`[EXPORT] Applying engagement_status filter...`);
        const beforeCount = enrichedOrders.length;
        enrichedOrders = enrichedOrders.filter((order) =>
          matchesEngagementStatusFilter(order, engagementFilter.config),
        );
        console.log(`[EXPORT] After engagement filter: ${enrichedOrders.length} orders (filtered out ${beforeCount - enrichedOrders.length} orders)`);
      }
    }

    if (enrichedOrders.length === 0) {
      console.warn(`[EXPORT] No orders found after enrichment filtering for segment ${segment.name}`);
      return NextResponse.json(
        { error: "No orders match the engagement status filters" },
        { status: 404 },
      );
    }

    // Load template workbook
    console.log(`[EXPORT] Loading template workbook...`);
    const workbook = XLSX.read(templateBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];

    // Convert orders to rows matching brand-specific template structure
    console.log(`[EXPORT] Converting ${enrichedOrders.length} orders to Excel rows...`);
    const rows = enrichedOrders.map((order) => {
      // Parse product summary to get individual product quantities
      const productQuantities = parseProductSummary(order.product_summary);
      console.log(`[EXPORT] Order ${order.reference_no}: product_summary="${order.product_summary}"`);
      console.log(`[EXPORT] Parsed quantities:`, productQuantities);

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
        console.log(`[EXPORT] Reglow product columns mapped:`, brandProductColumns);
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
    console.log(`[EXPORT] Creating Excel worksheet with ${rows.length} rows...`);
    const newWorksheet = XLSX.utils.json_to_sheet(rows);

    // Replace the sheet in the workbook
    workbook.Sheets[sheetName] = newWorksheet;

    // Write to buffer
    console.log(`[EXPORT] Writing Excel file to buffer...`);
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const sanitizedSegmentName = segment.name
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 30);
    const fileName = `${sanitizedSegmentName}_${brand}_${timestamp}.xlsx`;

    console.log(`[EXPORT] Export completed successfully: ${fileName} (${excelBuffer.length} bytes)`);

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
    console.error("[EXPORT] Segment export failed:", error);
    return NextResponse.json(
      {
        error: "Export failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

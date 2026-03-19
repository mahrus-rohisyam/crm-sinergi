import { NextResponse } from "next/server";
import {
  fetchWMSOrders,
  getWMSMetadata,
  buildWMSQueryFromFilters,
  canUseDirectMetadata,
  fetchOrdersEfficiently,
  type WMSOrder,
} from "@/lib/wms-api";
import { prisma } from "@/lib/prisma";
import { getPhoneNumberVariants } from "@/lib/everpro-parser";

type FilterModule = {
  id: string;
  type: string;
  connector: "AND" | "OR";
  config: Record<string, unknown>;
};

type EnrichedCustomer = {
  customerName: string;
  phoneNumber: string;
  lastPurchase: string;
  status: string;
  lastContact?: string | null;
  engagementStatus: "contacted" | "not_contacted" | "unknown";
  blastStatus?: string;
  everproData?: {
    lastBlastDate: Date | null;
    blastStatus: string;
    csName: string | null;
  };
};

/**
 * Enrich customers with Everpro engagement data
 */
async function enrichWithEverproData(
  customers: Array<{
    customerName: string;
    phoneNumber: string;
    lastPurchase: string;
    status: string;
  }>,
): Promise<EnrichedCustomer[]> {
  if (customers.length === 0) return [];

  // Collect all phone number variants for matching
  const phoneVariantsMap = new Map<string, string[]>();
  for (const customer of customers) {
    const variants = getPhoneNumberVariants(customer.phoneNumber);
    phoneVariantsMap.set(customer.phoneNumber, variants);
  }

  // Get all unique phone variants to query
  const allVariants = Array.from(
    new Set(
      Array.from(phoneVariantsMap.values()).flat(),
    ),
  );

  // Query Everpro contacts by phone number (match any variant)
  const everproContacts = await prisma.everproContact.findMany({
    where: {
      phoneNumber: {
        in: allVariants,
      },
    },
  });

  // Create lookup map (phone variant -> Everpro contact)
  const everproMap = new Map(
    everproContacts.map((c) => [c.phoneNumber, c]),
  );

  // Enrich each customer
  return customers.map((customer) => {
    const variants = phoneVariantsMap.get(customer.phoneNumber) || [];
    
    // Try to find Everpro contact using any variant
    let everproContact = null;
    for (const variant of variants) {
      everproContact = everproMap.get(variant);
      if (everproContact) break;
    }

    if (everproContact) {
      return {
        ...customer,
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
    } else {
      // Not found in Everpro - treat as not contacted
      return {
        ...customer,
        lastContact: null,
        engagementStatus: "not_contacted",
        blastStatus: "Belum",
      };
    }
  });
}

/**
 * Filter enriched customer based on engagement_status filter
 */
function matchesEngagementStatusFilter(
  customer: EnrichedCustomer,
  config: Record<string, unknown>,
): boolean {
  // Check blast status filter
  const showOnlyNotContacted = config.showOnlyNotContacted as boolean | undefined;
  if (showOnlyNotContacted && customer.engagementStatus !== "not_contacted") {
    return false;
  }

  // Check last contact date range
  const dateStart = config.lastContactDateStart as string | undefined;
  const dateEnd = config.lastContactDateEnd as string | undefined;

  if ((dateStart || dateEnd) && customer.lastContact) {
    const lastContactDate = new Date(customer.lastContact);
    
    // Check if last contact is within the specified date range
    if (dateStart) {
      const startDate = new Date(dateStart);
      startDate.setHours(0, 0, 0, 0); // Start of day
      if (lastContactDate < startDate) return false;
    }
    
    if (dateEnd) {
      const endDate = new Date(dateEnd);
      endDate.setHours(23, 59, 59, 999); // End of day
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
      if (
        c.expedition &&
        !order.courier
          ?.toLowerCase()
          .includes((c.expedition as string).toLowerCase())
      )
        return false;
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
      // Note: WMS doesn't have shippingDate in the response
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
      // Always return true here, will be filtered later
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

// POST /api/segments/preview — preview segment results from WMS API
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const filters = (body.filters || []) as FilterModule[];

    // Build WMS query params from filters (for API-level filtering where possible)
    const wmsParams = buildWMSQueryFromFilters(filters);

    // Get total count from WMS metadata (no filters)
    const totalMetadata = await getWMSMetadata({ length: 1 });
    const totalCount = totalMetadata.count;

    // Get filtered base count (with status and other WMS-supported filters)
    const baseFilteredMetadata = await getWMSMetadata(wmsParams);
    const baseFilteredCount = baseFilteredMetadata.count;

    // Check if we can use direct metadata for accurate count (filters fully supported by WMS API)
    const useDirectMetadata = canUseDirectMetadata(filters);

    if (useDirectMetadata && filters.length > 0) {
      // FAST PATH: Filters can be handled by WMS API directly
      // Get filtered count from metadata (1 API call, accurate!)
      const filteredMetadata = await getWMSMetadata(wmsParams);
      const matchingCount = filteredMetadata.count;

      // Fetch first page for customer preview list
      const response = await fetchWMSOrders({
        ...wmsParams,
        page: 1,
        length: 50,
      });

      // Deduplicate by phone number
      const seen = new Set<string>();
      const uniqueCustomers: Array<{
        customerName: string;
        phoneNumber: string;
        lastPurchase: string;
        status: string;
      }> = [];

      for (const order of response.data) {
        const key = order.customer_phone;
        if (!seen.has(key) && uniqueCustomers.length < 50) {
          seen.add(key);
          uniqueCustomers.push({
            customerName: order.customer_name,
            phoneNumber: order.customer_phone,
            lastPurchase: order.order_at || order.created_at,
            status: order.status || "pending",
          });
        }
      }

      // Enrich with Everpro data
      let enrichedCustomers = await enrichWithEverproData(uniqueCustomers);

      // Apply engagement_status filter if present
      const engagementFilter = filters.find((f) => f.type === "engagement_status");
      if (engagementFilter) {
        enrichedCustomers = enrichedCustomers.filter((customer) =>
          matchesEngagementStatusFilter(customer, engagementFilter.config),
        );
      }

      const finalMatchingCount = engagementFilter
        ? enrichedCustomers.length
        : matchingCount;

      const percentage =
        totalCount > 0
          ? Math.round((finalMatchingCount / totalCount) * 10000) / 100
          : 0;

      return NextResponse.json({
        matchingCount: finalMatchingCount,
        totalCount,
        percentage,
        customers: enrichedCustomers,
        _meta: {
          method: "direct_metadata",
          accurate: true,
          sampleSize: response.data.length,
          totalPages: filteredMetadata.total_page,
          estimatedApiCallsForFullSync: filteredMetadata.total_page,
          everproEnriched: true,
        },
      });
    }

    // COMPLEX PATH: Filters need client-side filtering
    // Fetch larger sample for better estimation (up to 12,500 records = 50 pages × 250)
    const maxSampleRecords = 12500; // Good balance between accuracy and speed
    const sampleOrders = await fetchOrdersEfficiently(
      wmsParams,
      maxSampleRecords,
    );

    // Apply client-side filtering to get matching orders
    const matchingOrders = sampleOrders.filter((order) =>
      matchesAllFilters(order, filters),
    );

    // Deduplicate by phone number
    const seen = new Set<string>();
    const uniqueCustomers: Array<{
      customerName: string;
      phoneNumber: string;
      lastPurchase: string;
      status: string;
    }> = [];

    for (const order of matchingOrders) {
      const key = order.customer_phone;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCustomers.push({
          customerName: order.customer_name,
          phoneNumber: order.customer_phone,
          lastPurchase: order.order_at || order.created_at,
          status: order.status || "pending",
        });
      }
    }

    // Enrich with Everpro data
    let enrichedCustomers = await enrichWithEverproData(uniqueCustomers);

    // Apply engagement_status filter if present
    const engagementFilter = filters.find((f) => f.type === "engagement_status");
    if (engagementFilter) {
      enrichedCustomers = enrichedCustomers.filter((customer) =>
        matchesEngagementStatusFilter(customer, engagementFilter.config),
      );
    }

    // Calculate estimated matching count based on sample
    const sampleSize = sampleOrders.length;
    const matchingInSample = enrichedCustomers.length;

    let estimatedMatchingCount: number;
    if (filters.length === 0) {
      // No filters - all customers match
      estimatedMatchingCount = totalCount;
    } else if (sampleSize > 0) {
      // Use ratio from sample to estimate matches within filtered base
      const ratio = matchingInSample / sampleSize;
      estimatedMatchingCount = Math.round(baseFilteredCount * ratio);
    } else {
      // Not enough data to estimate
      estimatedMatchingCount = matchingInSample;
    }

    const percentage =
      totalCount > 0
        ? Math.round((estimatedMatchingCount / totalCount) * 10000) / 100
        : 0;

    return NextResponse.json({
      matchingCount: estimatedMatchingCount,
      totalCount: totalCount,
      percentage,
      customers: enrichedCustomers.slice(0, 50), // limit to top 50 for preview
      _meta: {
        method: "sampling",
        accurate: false,
        sampleSize,
        matchingInSample,
        baseFilteredCount, // Count with status & WMS-level filters applied
        samplePercentage: Math.round((sampleSize / baseFilteredCount) * 10000) / 100,
        everproEnriched: true,
      },
    });
  } catch (error) {
    console.error("Failed to preview segment from WMS API:", error);
    return NextResponse.json(
      {
        error: "Failed to preview segment",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

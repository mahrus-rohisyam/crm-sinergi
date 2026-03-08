import { NextResponse } from "next/server";
import {
  fetchWMSOrders,
  getWMSMetadata,
  buildWMSQueryFromFilters,
  canUseDirectMetadata,
  fetchOrdersEfficiently,
  type WMSOrder,
} from "@/lib/wms-api";

type FilterModule = {
  id: string;
  type: string;
  connector: "AND" | "OR";
  config: Record<string, unknown>;
};

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

      const percentage =
        totalCount > 0
          ? Math.round((matchingCount / totalCount) * 10000) / 100
          : 0;

      return NextResponse.json({
        matchingCount,
        totalCount,
        percentage,
        customers: uniqueCustomers,
        _meta: {
          method: "direct_metadata",
          accurate: true,
          sampleSize: response.data.length,
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

    // Calculate estimated matching count based on sample
    const sampleSize = sampleOrders.length;
    const matchingInSample = uniqueCustomers.length;

    let estimatedMatchingCount: number;
    if (filters.length === 0) {
      // No filters - all customers match
      estimatedMatchingCount = totalCount;
    } else if (sampleSize > 0) {
      // Use ratio from sample to estimate total matches
      const ratio = matchingInSample / sampleSize;
      estimatedMatchingCount = Math.round(totalCount * ratio);
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
      customers: uniqueCustomers.slice(0, 50), // limit to top 50 for preview
      _meta: {
        method: "sampling",
        accurate: false,
        sampleSize,
        matchingInSample,
        samplePercentage: Math.round((sampleSize / totalCount) * 10000) / 100,
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

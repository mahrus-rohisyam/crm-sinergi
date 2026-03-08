/**
 * WMS API Client Utility
 * Provides reusable functions to interact with WMS Social Commerce Orders API
 */

export type WMSOrder = {
  id: number;
  order_id: string;
  reference_no: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_type: string; // "new" | "repeat" | "loyal"
  customer_province: string;
  customer_city: string;
  customer_district: string;
  customer_sub_district: string;
  customer_address: string;
  client_id: number; // brand ID
  client_name: string; // brand
  product_summary: string; // SKU
  qty: number;
  amount: number;
  discount_amount?: number;
  shipping_fee?: number;
  cod_fee?: number;
  discount_shipping_fee?: number;
  other_amount?: number;
  payment_method: string;
  payment_status: string;
  is_cod?: boolean;
  courier: string; // expedition
  courier_label: string;
  awb: string;
  customer_service: string;
  customer_service_id: string;
  ads_platform_name: string; // lead source
  ads_platform_id: string;
  warehouse_id: string;
  note?: string;
  status: string;
  status_fulfillment: string;
  status_external: string;
  created_at: string;
  order_at: string;
  leads_at: string;
};

export type WMSResponse = {
  status: number;
  message: string;
  data: WMSOrder[];
  metadata: {
    page: number;
    length: number;
    count: number; // total records matching filter
    total_page: number; // total pages
  };
};

export type WMSQueryParams = {
  page?: number;
  length?: number;
  start_date?: string; // YYYY-MM-DD
  status?: string;
  search?: string;
  client_id?: number; // brand filter
};

/**
 * Fetch orders from WMS API with proper error handling and retry logic
 */
export async function fetchWMSOrders(
  params: WMSQueryParams = {},
  retries = 3,
): Promise<WMSResponse> {
  const apiKey = process.env.WMS_API_KEY;
  const baseUrl =
    process.env.WMS_API_BASE_URL || "https://wms-api.sinergisuperapp.com";

  if (!apiKey) {
    throw new Error("WMS_API_KEY not configured");
  }

  const url = new URL(`${baseUrl}/v1/open/social-commerce/orders`);
  url.searchParams.set("page", String(params.page || 1));
  url.searchParams.set("length", String(params.length || 100));
  if (params.start_date) url.searchParams.set("start_date", params.start_date);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.search) url.searchParams.set("search", params.search);
  if (params.client_id) url.searchParams.set("client_id", String(params.client_id));

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url.toString(), {
        headers: {
          "x-api-key": apiKey,
        },
        // Add timeout
        signal: AbortSignal.timeout(30000), // 30 seconds
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`WMS API error (${response.status}): ${errorText}`);
      }

      const json: WMSResponse = await response.json();
      return json;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < retries) {
        // Wait before retry (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)),
        );
      }
    }
  }

  throw new Error(
    `WMS API failed after ${retries} attempts: ${lastError?.message}`,
  );
}

/**
 * Get only metadata (count information) without fetching full data
 * Useful for getting total counts efficiently
 */
export async function getWMSMetadata(
  params: WMSQueryParams = {},
): Promise<WMSResponse["metadata"]> {
  const response = await fetchWMSOrders({ ...params, length: 1 });
  return response.metadata;
}

/**
 * Fetch all orders by paginating through all pages
 * WARNING: Use with caution for large datasets (57k+ records)
 * Consider using length parameter to limit results
 */
export async function fetchAllWMSOrders(
  params: WMSQueryParams = {},
  maxPages?: number,
): Promise<WMSOrder[]> {
  const allOrders: WMSOrder[] = [];
  let currentPage = 1;
  let totalPages = 1;

  do {
    const response = await fetchWMSOrders({ ...params, page: currentPage });
    allOrders.push(...response.data);
    totalPages = response.metadata.total_page;
    currentPage++;
  } while (currentPage <= totalPages && (!maxPages || currentPage <= maxPages));

  return allOrders;
}

/**
 * Extract distinct values from WMS orders for filter options
 * Fetches multiple pages to get comprehensive distinct values
 */
export async function getDistinctFilterValues(
  maxPages: number = 10,
): Promise<{
  brands: string[];
  provinces: string[];
  cities: string[];
  districts: string[];
  csNames: string[];
  leadSources: string[];
  customerTypes: string[];
  expeditions: string[];
  transactionTypes: string[];
}> {
  const orders = await fetchAllWMSOrders({ length: 100 }, maxPages);

  // Extract distinct values using Sets
  const brandsSet = new Set<string>();
  const provincesSet = new Set<string>();
  const citiesSet = new Set<string>();
  const districtsSet = new Set<string>();
  const csNamesSet = new Set<string>();
  const leadSourcesSet = new Set<string>();
  const customerTypesSet = new Set<string>();
  const expeditionsSet = new Set<string>();
  const transactionTypesSet = new Set<string>();

  for (const order of orders) {
    if (order.client_name) brandsSet.add(order.client_name);
    if (order.customer_province) provincesSet.add(order.customer_province);
    if (order.customer_city) citiesSet.add(order.customer_city);
    if (order.customer_district) districtsSet.add(order.customer_district);
    if (order.customer_service) csNamesSet.add(order.customer_service);
    if (order.ads_platform_name) leadSourcesSet.add(order.ads_platform_name);
    if (order.customer_type) customerTypesSet.add(order.customer_type);
    if (order.courier) expeditionsSet.add(order.courier);
    if (order.payment_method) transactionTypesSet.add(order.payment_method);
  }

  // Convert Sets to sorted arrays
  const sortIndonesian = (arr: string[]) =>
    arr.sort((a, b) => a.localeCompare(b, "id"));

  return {
    brands: sortIndonesian(Array.from(brandsSet)),
    provinces: sortIndonesian(Array.from(provincesSet)),
    cities: sortIndonesian(Array.from(citiesSet)),
    districts: sortIndonesian(Array.from(districtsSet)),
    csNames: sortIndonesian(Array.from(csNamesSet)),
    leadSources: sortIndonesian(Array.from(leadSourcesSet)),
    customerTypes: sortIndonesian(Array.from(customerTypesSet)),
    expeditions: sortIndonesian(Array.from(expeditionsSet)),
    transactionTypes: sortIndonesian(Array.from(transactionTypesSet)),
  };
}

/**
 * Map brand name to WMS API client_id
 * Returns null if brand is unknown or not mapped
 */
export function getBrandClientId(brandName: string): number | null {
  const brandMap: Record<string, number> = {
    "Reglow": 1,   // 15,305 orders
    "Amura": 2,    // primary brand
    "Purela": 3,   // 89 orders
  };
  
  return brandMap[brandName] || null;
}

/**
 * Check if filters can be fully satisfied by WMS API query params only
 * (no client-side filtering needed = accurate count via metadata)
 */
export function canUseDirectMetadata(
  filters: Array<{ type: string; config: Record<string, unknown> }>,
): boolean {
  if (filters.length === 0) return true;

  for (const filter of filters) {
    const c = filter.config;

    switch (filter.type) {
      case "timeframe":
        // Only supports inputDateStart (maps to start_date)
        // If has inputDateEnd or shippingDate filters, needs client-side filtering
        if (c.inputDateEnd || c.shippingDateStart || c.shippingDateEnd) {
          return false;
        }
        break;
      case "demographics":
        // Only supports single search (phone or name)
        // If has provinces/cities/districts, needs client-side filtering
        if (c.provinces || c.cities || c.districts) {
          return false;
        }
        // Only one search param allowed
        if (c.phoneNumber && c.customerName) {
          return false;
        }
        break;
      case "brand": {
        // Can use direct metadata if single brand that can be mapped to client_id
        const brands = c.brands as string[] | undefined;
        if (!brands || brands.length === 0) return true;
        if (brands.length !== 1) return false; // Multiple brands need client-side filtering
        if (getBrandClientId(brands[0]) === null) return false; // Unmapped brand
        break;
      }
      case "transaction":
      case "engagement_customer":
      case "engagement_management":
        // These all need client-side filtering
        return false;
      default:
        return false;
    }
  }

  return true;
}

/**
 * Build WMS query params from segment filter modules
 * Maps complex filter configurations to WMS API query parameters
 */
export function buildWMSQueryFromFilters(
  filters: Array<{ type: string; config: Record<string, unknown> }>,
): WMSQueryParams {
  const params: WMSQueryParams = {};

  for (const filter of filters) {
    const c = filter.config;

    switch (filter.type) {
      case "brand": {
        // Map to client_id if single brand is provided
        const brands = c.brands as string[] | undefined;
        if (brands && brands.length === 1) {
          const clientId = getBrandClientId(brands[0]);
          if (clientId !== null) {
            params.client_id = clientId;
          }
        }
        break;
      }
      case "timeframe":
        // Map to start_date if inputDateStart is provided
        if (c.inputDateStart) {
          params.start_date = c.inputDateStart as string;
        }
        break;
      case "demographics":
        // Map to search if phone number or customer name is provided
        if (c.phoneNumber) {
          params.search = c.phoneNumber as string;
        } else if (c.customerName) {
          params.search = c.customerName as string;
        }
        break;
      // Note: WMS API has limited query params (page, length, start_date, status, search, client_id)
      // Other filters need to be applied client-side on fetched data
    }
  }

  return params;
}

/**
 * Fetch orders efficiently with smart pagination
 * For large datasets, fetches max length per page to minimize API calls
 */
export async function fetchOrdersEfficiently(
  params: WMSQueryParams,
  maxRecords?: number,
): Promise<WMSOrder[]> {
  const allOrders: WMSOrder[] = [];
  let currentPage = 1;
  const pageSize = 250; // Use max allowed length to minimize API calls

  while (true) {
    const response = await fetchWMSOrders({
      ...params,
      page: currentPage,
      length: pageSize,
    });

    allOrders.push(...response.data);

    // Stop if reached max records or last page
    if (maxRecords && allOrders.length >= maxRecords) {
      return allOrders.slice(0, maxRecords);
    }
    if (currentPage >= response.metadata.total_page) {
      break;
    }

    currentPage++;
  }

  return allOrders;
}

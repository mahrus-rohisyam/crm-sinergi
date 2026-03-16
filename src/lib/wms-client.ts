/**
 * WMS API Client for Browser (Client-Side)
 * Direct calls to WMS API from browser without Next.js API routes
 * 
 * ⚠️ WARNING: API key will be visible in browser Network tab
 * Only use this if WMS API allows public access or has CORS enabled
 */

// Get WMS API configuration from environment
const WMS_API_KEY = process.env.NEXT_PUBLIC_WMS_API_KEY || "";
const WMS_API_BASE_URL = process.env.NEXT_PUBLIC_WMS_API_BASE_URL || "https://wms-api.sinergisuperapp.com";

export type WMSOrder = {
  id: number;
  order_id: string;
  reference_no: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_type: string;
  customer_province: string;
  customer_city: string;
  customer_district: string;
  customer_sub_district: string;
  customer_address: string;
  client_id: number;
  client_name: string;
  product_summary: string;
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
  courier: string;
  courier_label: string;
  awb: string;
  customer_service: string;
  customer_service_id: string;
  ads_platform_name: string;
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
    count: number;
    total_page: number;
  };
};

export type WMSClient = {
  id: number;
  name: string;
  status: string;
};

export type WMSCustomerService = {
  id: number;
  name: string;
  email: string;
};

export type WMSAdsPlatform = {
  id: number;
  name: string;
};

export type WMSProduct = {
  id: number;
  sku: string;
  name: string;
  price: number;
  status: string;
};

/**
 * Fetch orders from WMS API
 */
export async function fetchOrders(params: {
  page?: number;
  length?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  search?: string;
  client_id?: number;
  customer_service_id?: number;
  ads_platform_id?: number;
  customer_type?: string;
  courier?: string;
  payment_method?: string;
}): Promise<WMSResponse> {
  if (!WMS_API_KEY) {
    throw new Error("WMS API key not configured. Set NEXT_PUBLIC_WMS_API_KEY in .env");
  }

  const url = new URL(`${WMS_API_BASE_URL}/v1/open/social-commerce/orders`);
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      "x-api-key": WMS_API_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`WMS API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch brands/clients from WMS API
 */
export async function fetchClients(): Promise<WMSClient[]> {
  if (!WMS_API_KEY) {
    throw new Error("WMS API key not configured");
  }

  const url = `${WMS_API_BASE_URL}/v1/open/clients/list`;

  const response = await fetch(url, {
    headers: {
      "x-api-key": WMS_API_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`WMS API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Fetch customer services from WMS API
 */
export async function fetchCustomerServices(clientId?: number): Promise<WMSCustomerService[]> {
  if (!WMS_API_KEY) {
    throw new Error("WMS API key not configured");
  }

  const url = new URL(`${WMS_API_BASE_URL}/v1/open/admin/customer-services`);
  if (clientId) {
    url.searchParams.set("client_id", String(clientId));
  }

  const response = await fetch(url.toString(), {
    headers: {
      "x-api-key": WMS_API_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`WMS API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Fetch ads platforms from WMS API
 */
export async function fetchAdsPlatforms(clientId?: number): Promise<WMSAdsPlatform[]> {
  if (!WMS_API_KEY) {
    throw new Error("WMS API key not configured");
  }

  const url = new URL(`${WMS_API_BASE_URL}/v1/open/social-commerce/ads-platform`);
  if (clientId) {
    url.searchParams.set("client_id", String(clientId));
  }

  const response = await fetch(url.toString(), {
    headers: {
      "x-api-key": WMS_API_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`WMS API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Fetch products from WMS API
 */
export async function fetchProducts(params: {
  clientId?: number;
  bundle?: boolean;
  status?: string;
}): Promise<WMSProduct[]> {
  if (!WMS_API_KEY) {
    throw new Error("WMS API key not configured");
  }

  const url = new URL(`${WMS_API_BASE_URL}/v1/open/products/list`);
  
  if (params.clientId) {
    url.searchParams.set("client_id", String(params.clientId));
  }
  if (params.bundle !== undefined) {
    url.searchParams.set("bundle", params.bundle ? "true" : "false");
  }
  if (params.status) {
    url.searchParams.set("status", params.status);
  }

  const response = await fetch(url.toString(), {
    headers: {
      "x-api-key": WMS_API_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`WMS API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

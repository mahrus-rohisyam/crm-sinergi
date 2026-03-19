import { NextResponse } from "next/server";
import { 
  getDistinctFilterValues, 
  fetchWMSClients,
  fetchWMSCustomerServices,
  fetchWMSAdsPlatforms,
  fetchWMSProducts,
} from "@/lib/wms-api";

// Standard Indonesian provinces (38) - fallback if WMS API fails
const INDONESIA_PROVINCES = [
  "Aceh", "Bali", "Banten", "Bengkulu",
  "DI Yogyakarta", "DKI Jakarta",
  "Gorontalo",
  "Jambi", "Jawa Barat", "Jawa Tengah", "Jawa Timur",
  "Kalimantan Barat", "Kalimantan Selatan", "Kalimantan Tengah",
  "Kalimantan Timur", "Kalimantan Utara",
  "Kepulauan Bangka Belitung", "Kepulauan Riau",
  "Lampung",
  "Maluku", "Maluku Utara",
  "Nusa Tenggara Barat", "Nusa Tenggara Timur",
  "Papua", "Papua Barat", "Papua Barat Daya",
  "Papua Pegunungan", "Papua Selatan", "Papua Tengah",
  "Riau",
  "Sulawesi Barat", "Sulawesi Selatan", "Sulawesi Tengah",
  "Sulawesi Tenggara", "Sulawesi Utara",
  "Sumatera Barat", "Sumatera Selatan", "Sumatera Utara",
];

const CUSTOMER_TYPES = ["new", "repeat", "loyal"];
const TRANSACTION_TYPES = ["COD", "Transfer"];

/**
 * GET /api/segments/filter-options
 * Returns distinct values from WMS API for all filter fields.
 * Fetches from dedicated endpoints for efficiency:
 * - Brands: /v1/open/clients/list
 * - CS Names: /v1/open/admin/customer-services
 * - Lead Sources: /v1/open/social-commerce/ads-platform
 * - Other fields: sampled from orders data
 * 
 * Query Parameters:
 * - brand_ids: comma-separated list of brand names to filter results
 */
export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const brandIdsParam = searchParams.get("brand_ids");
    const selectedBrandNames = brandIdsParam ? brandIdsParam.split(",").filter(b => b.trim()) : [];
    
    console.log("[Filter Options API] Request received with brand_ids:", brandIdsParam);
    console.log("[Filter Options API] Selected brand names:", selectedBrandNames);

    // Fetch clients and customer services first (these don't need client_id)
    const [clients, wmsValues] = await Promise.allSettled([
      fetchWMSClients(),
      getDistinctFilterValues(10), // Sample from orders for other fields
    ]);

    // Extract brands from clients
    let brands: string[] = [];
    let allClientIds: number[] = [];
    const clientMap: Map<string, number> = new Map(); // brand name -> client_id
    
    if (clients.status === "fulfilled") {
      brands = clients.value.map(c => c.name).sort((a, b) => a.localeCompare(b, "id"));
      allClientIds = clients.value.map(c => c.id);
      clients.value.forEach(c => clientMap.set(c.name, c.id));
      console.log("[Filter Options API] Available brands:", brands);
      console.log("[Filter Options API] Client map:", Array.from(clientMap.entries()));
    } else {
      console.error("Failed to fetch brands:", clients.reason);
      brands = []; // No fallback, let frontend handle empty state
    }

    // Determine which client IDs to fetch data for
    let targetClientIds: number[] = [];
    if (selectedBrandNames.length > 0) {
      // Filter to only selected brands
      targetClientIds = selectedBrandNames
        .map(brandName => {
          const clientId = clientMap.get(brandName);
          console.log(`[Filter Options API] Mapping brand "${brandName}" to client_id:`, clientId);
          return clientId;
        })
        .filter((id): id is number => id !== undefined);
      console.log("[Filter Options API] Target client IDs for selected brands:", targetClientIds);
    } else {
      // No brand filter, fetch all
      targetClientIds = allClientIds;
      console.log("[Filter Options API] No brand filter, fetching all client IDs:", targetClientIds);
    }

    // Fetch products, ads platforms, and customer services for target brands in parallel
    let skus: string[] = [];
    let leadSources: string[] = [];
    let csNames: string[] = [];
    
    if (targetClientIds.length > 0) {
      try {
        const productPromises = targetClientIds.map(async (clientId) => {
          try {
            return await fetchWMSProducts({
              clientId,
              bundle: false,
              status: "published",
            });
          } catch (err) {
            console.error(`Failed to fetch products for client ${clientId}:`, err);
            return [];
          }
        });
        
        const adsPlatformPromises = targetClientIds.map(async (clientId) => {
          try {
            return await fetchWMSAdsPlatforms(clientId);
          } catch (err) {
            console.error(`Failed to fetch ads platforms for client ${clientId}:`, err);
            return [];
          }
        });
        
        const csPromises = targetClientIds.map(async (clientId) => {
          try {
            return await fetchWMSCustomerServices(clientId);
          } catch (err) {
            console.error(`Failed to fetch customer services for client ${clientId}:`, err);
            return [];
          }
        });
        
        const [allProductsResults, allAdsPlatformsResults, allCSResults] = await Promise.all([
          Promise.all(productPromises),
          Promise.all(adsPlatformPromises),
          Promise.all(csPromises),
        ]);
        
        const allProducts = allProductsResults.flat();
        const allAdsPlatforms = allAdsPlatformsResults.flat();
        const allCS = allCSResults.flat();
        
        // Extract unique SKUs and sort
        skus = Array.from(new Set(allProducts.map(p => p.sku)))
          .filter(sku => sku && sku.trim() !== "")
          .sort((a, b) => a.localeCompare(b));
        
        // Extract unique lead sources (ads platforms) and sort
        leadSources = Array.from(new Set(allAdsPlatforms.map(ap => ap.name)))
          .filter(name => name && name.trim() !== "")
          .sort((a, b) => a.localeCompare(b, "id"));
        
        // Extract unique CS names and sort
        csNames = Array.from(new Set(allCS.map(cs => cs.name)))
          .filter(name => name && name.trim() !== "")
          .sort((a, b) => a.localeCompare(b, "id"));
      } catch (error) {
        console.error("Failed to fetch brand-specific data:", error);
        skus = [];
        leadSources = [];
        csNames = [];
      }
    }

    // Get values from WMS orders sampling
    const orderValues = wmsValues.status === "fulfilled" ? wmsValues.value : {
      brands: [],
      provinces: [],
      cities: [],
      districts: [],
      csNames: [],
      leadSources: [],
      customerTypes: [],
      expeditions: [],
      transactionTypes: [],
    };

    // Helper to merge and sort
    const merge = (priorityValues: string[], fallbackValues: string[]) => {
      const set = new Set([...priorityValues, ...fallbackValues]);
      return Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
    };

    // Merge provinces with Indonesian province list
    const provinces = merge(orderValues.provinces, INDONESIA_PROVINCES);
    
    // For customerTypes and transactionTypes, use order values but merge with fallbacks
    const customerTypes = merge(orderValues.customerTypes, CUSTOMER_TYPES);
    const transactionTypes = merge(orderValues.transactionTypes, TRANSACTION_TYPES);

    return NextResponse.json({
      brands, // From /v1/open/clients/list
      skus, // From /v1/open/products/list (all brands, published, non-bundle)
      provinces,
      cities: orderValues.cities,
      districts: orderValues.districts,
      csNames, // From /v1/open/admin/customer-services
      leadSources, // From /v1/open/social-commerce/ads-platform
      customerTypes,
      expeditions: orderValues.expeditions,
      transactionTypes,
    });
  } catch (error) {
    console.error("Failed to fetch filter options from WMS API:", error);
    // Return minimal fallbacks on complete failure
    return NextResponse.json({
      brands: [],
      skus: [],
      provinces: INDONESIA_PROVINCES,
      cities: [],
      districts: [],
      csNames: [],
      leadSources: [],
      customerTypes: CUSTOMER_TYPES,
      expeditions: [],
      transactionTypes: TRANSACTION_TYPES,
    });
  }
}

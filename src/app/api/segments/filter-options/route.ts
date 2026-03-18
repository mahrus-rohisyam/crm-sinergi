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
  "Aceh",
  "Bali",
  "Banten",
  "Bengkulu",
  "DI Yogyakarta",
  "DKI Jakarta",
  "Gorontalo",
  "Jambi",
  "Jawa Barat",
  "Jawa Tengah",
  "Jawa Timur",
  "Kalimantan Barat",
  "Kalimantan Selatan",
  "Kalimantan Tengah",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Kepulauan Bangka Belitung",
  "Kepulauan Riau",
  "Lampung",
  "Maluku",
  "Maluku Utara",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Papua",
  "Papua Barat",
  "Papua Barat Daya",
  "Papua Pegunungan",
  "Papua Selatan",
  "Papua Tengah",
  "Riau",
  "Sulawesi Barat",
  "Sulawesi Selatan",
  "Sulawesi Tengah",
  "Sulawesi Tenggara",
  "Sulawesi Utara",
  "Sumatera Barat",
  "Sumatera Selatan",
  "Sumatera Utara",
];

const CUSTOMER_TYPES = ["new", "repeat", "loyal"];
const TRANSACTION_TYPES = ["COD", "Transfer"];

// Brand to client_id mapping (static fallback)
const BRAND_CLIENT_ID_MAP: Record<string, number> = {
  Reglow: 1,
  Amura: 2,
  Purela: 3,
};

/**
 * GET /api/segments/filter-options
 * Returns distinct values from WMS API for all filter fields.
 * Fetches from dedicated endpoints for efficiency:
 * - Brands: /v1/open/clients/list
 * - CS Names: /v1/open/admin/customer-services
 * - Lead Sources: /v1/open/social-commerce/ads-platform
 * - Other fields: sampled from orders data
 */
export async function GET() {
  try {
    // Fetch data from dedicated endpoints in parallel for efficiency
    const [clients, customerServices, adsPlatforms, wmsValues] =
      await Promise.allSettled([
        fetchWMSClients(),
        fetchWMSCustomerServices(), // Fetch all CS across all brands
        fetchWMSAdsPlatforms(), // Fetch all ads platforms across all brands
        getDistinctFilterValues(10), // Sample from orders for other fields
      ]);

    // Extract brands from clients and build brandClientIdMap
    let brands: string[] = [];
    let clientIds: number[] = [];
    let brandClientIdMap: Record<string, number> = { ...BRAND_CLIENT_ID_MAP };

    if (clients.status === "fulfilled") {
      brands = clients.value
        .map((c) => c.name)
        .sort((a, b) => a.localeCompare(b, "id"));
      clientIds = clients.value.map((c) => c.id);
      // Build dynamic mapping from API response
      clients.value.forEach((c) => {
        brandClientIdMap[c.name] = c.id;
      });
    } else {
      console.error("Failed to fetch brands:", clients.reason);
      brands = []; // No fallback, let frontend handle empty state
    }

    // Fetch products (SKUs) for all brands in parallel
    let skus: string[] = [];
    if (clientIds.length > 0) {
      try {
        const productPromises = clientIds.map(async (clientId) => {
          try {
            return await fetchWMSProducts({
              clientId,
              bundle: false,
              status: "published",
            });
          } catch (err) {
            console.error(
              `Failed to fetch products for client ${clientId}:`,
              err,
            );
            return [];
          }
        });

        const allProductsResults = await Promise.all(productPromises);
        const allProducts = allProductsResults.flat();

        // Extract unique SKUs and sort
        skus = Array.from(new Set(allProducts.map((p) => p.sku)))
          .filter((sku) => sku && sku.trim() !== "")
          .sort((a, b) => a.localeCompare(b));
      } catch (error) {
        console.error("Failed to fetch products:", error);
        skus = [];
      }
    }

    // Extract CS names from customer services
    let csNames: string[] = [];
    if (customerServices.status === "fulfilled") {
      csNames = customerServices.value
        .map((cs) => cs.name)
        .filter((name, index, arr) => arr.indexOf(name) === index) // Deduplicate
        .sort((a, b) => a.localeCompare(b, "id"));
    } else {
      console.error(
        "Failed to fetch customer services:",
        customerServices.reason,
      );
      csNames = [];
    }

    // Extract lead sources from ads platforms
    let leadSources: string[] = [];
    if (adsPlatforms.status === "fulfilled") {
      leadSources = adsPlatforms.value
        .map((ap) => ap.name)
        .filter((name, index, arr) => arr.indexOf(name) === index) // Deduplicate
        .sort((a, b) => a.localeCompare(b, "id"));
    } else {
      console.error("Failed to fetch ads platforms:", adsPlatforms.reason);
      leadSources = [];
    }

    // Get values from WMS orders sampling
    const orderValues =
      wmsValues.status === "fulfilled"
        ? wmsValues.value
        : {
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
    const transactionTypes = merge(
      orderValues.transactionTypes,
      TRANSACTION_TYPES,
    );

    return NextResponse.json({
      brands, // From /v1/open/clients/list
      brandClientIdMap, // Mapping brand name to client_id
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
      brandClientIdMap: BRAND_CLIENT_ID_MAP,
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

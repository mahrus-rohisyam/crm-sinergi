import { NextResponse } from "next/server";
import { getDistinctFilterValues } from "@/lib/wms-api";

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
 * Returns distinct values from WMS API for all filter fields,
 * merged with static fallback data.
 */
export async function GET() {
  try {
    // Fetch distinct values from WMS API (first 10 pages = ~1000 orders for sampling)
    const wmsValues = await getDistinctFilterValues(10);

    // Helper to merge WMS values with static fallbacks and sort
    const merge = (wmsValues: string[], staticValues: string[]) => {
      const set = new Set([...wmsValues, ...staticValues]);
      return Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
    };

    const brands = merge(wmsValues.brands, ["Amura", "Reglow"]);
    const provinces = merge(wmsValues.provinces, INDONESIA_PROVINCES);
    const customerTypes = merge(wmsValues.customerTypes, CUSTOMER_TYPES);
    const transactionTypes = merge(wmsValues.transactionTypes, TRANSACTION_TYPES);

    return NextResponse.json({
      brands,
      provinces,
      cities: wmsValues.cities,
      districts: wmsValues.districts,
      csNames: wmsValues.csNames,
      leadSources: wmsValues.leadSources,
      customerTypes,
      expeditions: wmsValues.expeditions,
      transactionTypes,
    });
  } catch (error) {
    console.error("Failed to fetch filter options from WMS API:", error);
    // Return static fallbacks on error
    return NextResponse.json({
      brands: ["Amura", "Reglow"],
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

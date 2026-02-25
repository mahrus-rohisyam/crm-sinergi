import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Standard Indonesian provinces (38)
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
 * Returns distinct values from PerpackTransaction for all filter fields,
 * merged with static fallback data.
 */
export async function GET() {
  try {
    const [
      dbBrands,
      dbProvinces,
      dbCities,
      dbDistricts,
      dbCsNames,
      dbLeadSources,
      dbCustomerTypes,
      dbExpeditions,
      dbTransactionTypes,
    ] = await Promise.all([
      prisma.perpackTransaction.findMany({
        select: { brand: true },
        distinct: ["brand"],
        where: { brand: { not: "" } },
      }),
      prisma.perpackTransaction.findMany({
        select: { province: true },
        distinct: ["province"],
        where: { province: { not: "" } },
      }),
      prisma.perpackTransaction.findMany({
        select: { city: true },
        distinct: ["city"],
        where: { city: { not: "" } },
      }),
      prisma.perpackTransaction.findMany({
        select: { kecamatan: true },
        distinct: ["kecamatan"],
        where: { kecamatan: { not: "" } },
      }),
      prisma.perpackTransaction.findMany({
        select: { csName: true },
        distinct: ["csName"],
        where: { csName: { not: "" } },
      }),
      prisma.perpackTransaction.findMany({
        select: { leadSource: true },
        distinct: ["leadSource"],
        where: { leadSource: { not: "" } },
      }),
      prisma.perpackTransaction.findMany({
        select: { customerType: true },
        distinct: ["customerType"],
        where: { customerType: { not: "" } },
      }),
      prisma.perpackTransaction.findMany({
        select: { expedition: true },
        distinct: ["expedition"],
        where: { expedition: { not: "" } },
      }),
      prisma.perpackTransaction.findMany({
        select: { transactionType: true },
        distinct: ["transactionType"],
        where: { transactionType: { not: "" } },
      }),
    ]);

    // Helper: extract non-null strings from DB results
    const nonNull = (arr: (string | null)[]): string[] =>
      arr.filter((v): v is string => v !== null && v !== "");

    // Helper to merge DB values with static fallbacks and sort
    const merge = (dbValues: string[], staticValues: string[]) => {
      const set = new Set([...dbValues, ...staticValues]);
      return Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
    };

    const brands = merge(
      nonNull(dbBrands.map((r) => r.brand)),
      ["Amura", "Reglow"],
    );

    const provinces = merge(
      nonNull(dbProvinces.map((r) => r.province)),
      INDONESIA_PROVINCES,
    );

    const cities = nonNull(dbCities.map((r) => r.city))
      .sort((a, b) => a.localeCompare(b, "id"));

    const districts = nonNull(dbDistricts.map((r) => r.kecamatan))
      .sort((a, b) => a.localeCompare(b, "id"));

    const csNames = nonNull(dbCsNames.map((r) => r.csName))
      .sort((a, b) => a.localeCompare(b, "id"));

    const leadSources = nonNull(dbLeadSources.map((r) => r.leadSource))
      .sort((a, b) => a.localeCompare(b, "id"));

    const customerTypes = merge(
      nonNull(dbCustomerTypes.map((r) => r.customerType)),
      CUSTOMER_TYPES,
    );

    const expeditions = nonNull(dbExpeditions.map((r) => r.expedition))
      .sort((a, b) => a.localeCompare(b, "id"));

    const transactionTypes = merge(
      nonNull(dbTransactionTypes.map((r) => r.transactionType)),
      TRANSACTION_TYPES,
    );

    return NextResponse.json({
      brands,
      provinces,
      cities,
      districts,
      csNames,
      leadSources,
      customerTypes,
      expeditions,
      transactionTypes,
    });
  } catch (error) {
    console.error("Failed to fetch filter options:", error);
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

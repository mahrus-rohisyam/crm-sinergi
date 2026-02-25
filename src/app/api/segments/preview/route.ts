import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type FilterModule = {
  id: string;
  type: string;
  connector: "AND" | "OR";
  config: Record<string, unknown>;
};

/**
 * Build a Prisma WHERE condition from a single filter module.
 */
function buildFilterCondition(
  filter: FilterModule,
): Prisma.PerpackTransactionWhereInput | null {
  const c = filter.config;

  switch (filter.type) {
    case "brand": {
      const brands = c.brands as string[] | undefined;
      if (!brands || brands.length === 0) return null;
      return { brand: { in: brands, mode: "insensitive" } };
    }
    case "transaction": {
      const conds: Prisma.PerpackTransactionWhereInput[] = [];
      const skus = c.skus as string[] | undefined;
      if (skus && skus.length > 0)
        conds.push({ sku: { in: skus, mode: "insensitive" } });
      if (c.minQty) conds.push({ quantity: { gte: Number(c.minQty) } });
      if (c.maxQty) conds.push({ quantity: { lte: Number(c.maxQty) } });
      if (c.minAmount)
        conds.push({ totalPrice: { gte: Number(c.minAmount) } });
      if (c.maxAmount)
        conds.push({ totalPrice: { lte: Number(c.maxAmount) } });
      if (c.transactionType)
        conds.push({
          transactionType: {
            equals: c.transactionType as string,
            mode: "insensitive",
          },
        });
      if (c.expedition)
        conds.push({
          expedition: {
            contains: c.expedition as string,
            mode: "insensitive",
          },
        });
      return conds.length > 0 ? { AND: conds } : null;
    }
    case "timeframe": {
      const conds: Prisma.PerpackTransactionWhereInput[] = [];
      if (c.inputDateStart)
        conds.push({ inputDate: { gte: new Date(c.inputDateStart as string) } });
      if (c.inputDateEnd)
        conds.push({ inputDate: { lte: new Date(c.inputDateEnd as string) } });
      if (c.shippingDateStart)
        conds.push({
          shippingDate: { gte: new Date(c.shippingDateStart as string) },
        });
      if (c.shippingDateEnd)
        conds.push({
          shippingDate: { lte: new Date(c.shippingDateEnd as string) },
        });
      return conds.length > 0 ? { AND: conds } : null;
    }
    case "demographics": {
      const conds: Prisma.PerpackTransactionWhereInput[] = [];
      if (c.customerName)
        conds.push({
          customerName: {
            contains: c.customerName as string,
            mode: "insensitive",
          },
        });
      if (c.phoneNumber)
        conds.push({
          phoneNumber: { contains: c.phoneNumber as string },
        });
      const provinces = c.provinces as string[] | undefined;
      if (provinces && provinces.length > 0)
        conds.push({ province: { in: provinces, mode: "insensitive" } });
      const cities = c.cities as string[] | undefined;
      if (cities && cities.length > 0)
        conds.push({ city: { in: cities, mode: "insensitive" } });
      const districts = c.districts as string[] | undefined;
      if (districts && districts.length > 0)
        conds.push({ kecamatan: { in: districts, mode: "insensitive" } });
      return conds.length > 0 ? { AND: conds } : null;
    }
    case "engagement_customer": {
      const conds: Prisma.PerpackTransactionWhereInput[] = [];
      const custTypes = c.customerTypes as string[] | undefined;
      if (custTypes && custTypes.length > 0)
        conds.push({
          customerType: { in: custTypes, mode: "insensitive" },
        });
      // Note: order frequency is handled via groupBy aggregation, not here
      return conds.length > 0 ? { AND: conds } : null;
    }
    case "engagement_management": {
      const conds: Prisma.PerpackTransactionWhereInput[] = [];
      const csNames = c.csNames as string[] | undefined;
      if (csNames && csNames.length > 0)
        conds.push({ csName: { in: csNames, mode: "insensitive" } });
      const leadSources = c.leadSources as string[] | undefined;
      if (leadSources && leadSources.length > 0)
        conds.push({ leadSource: { in: leadSources, mode: "insensitive" } });
      return conds.length > 0 ? { AND: conds } : null;
    }
    default:
      return null;
  }
}

/**
 * Build the combined WHERE clause from filter modules, respecting AND/OR connectors.
 */
function buildWhereClause(
  filters: FilterModule[],
): Prisma.PerpackTransactionWhereInput {
  const validFilters = filters
    .map((f) => ({ filter: f, condition: buildFilterCondition(f) }))
    .filter((x) => x.condition !== null);

  if (validFilters.length === 0) return {};

  // Build query tree: process AND/OR connectors sequentially
  let result: Prisma.PerpackTransactionWhereInput =
    validFilters[0].condition!;

  for (let i = 1; i < validFilters.length; i++) {
    const { filter, condition } = validFilters[i];
    if (filter.connector === "OR") {
      result = { OR: [result, condition!] };
    } else {
      result = { AND: [result, condition!] };
    }
  }

  return result;
}

// POST /api/segments/preview — preview segment results
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const filters = (body.filters || []) as FilterModule[];

    const where = buildWhereClause(filters);

    // Get total count in DB
    const totalCount = await prisma.perpackTransaction.count();

    // Get matching transactions grouped by phone number (deduplicated customers)
    const matchingTransactions = await prisma.perpackTransaction.findMany({
      where,
      select: {
        customerName: true,
        phoneNumber: true,
        orderAt: true,
        status: true,
      },
      orderBy: { orderAt: "desc" },
    });

    // Deduplicate by phone number
    const seen = new Set<string>();
    const uniqueCustomers: Array<{
      customerName: string;
      phoneNumber: string;
      lastPurchase: string;
      status: string;
    }> = [];
    for (const tx of matchingTransactions) {
      const key = tx.phoneNumber;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCustomers.push({
          customerName: tx.customerName,
          phoneNumber: tx.phoneNumber,
          lastPurchase: tx.orderAt?.toISOString() || "",
          status: tx.status || "pending",
        });
      }
    }

    const matchingCount = uniqueCustomers.length;
    // Deduplicate total by phone number too
    const allPhones = await prisma.perpackTransaction.findMany({
      select: { phoneNumber: true },
      distinct: ["phoneNumber"],
    });
    const totalUniqueCustomers = allPhones.length;

    const percentage =
      totalUniqueCustomers > 0
        ? Math.round((matchingCount / totalUniqueCustomers) * 10000) / 100
        : 0;

    return NextResponse.json({
      matchingCount,
      totalCount: totalUniqueCustomers,
      percentage,
      customers: uniqueCustomers.slice(0, 50), // limit to top 50
    });
  } catch (error) {
    console.error("Failed to preview segment:", error);
    return NextResponse.json(
      { error: "Failed to preview segment" },
      { status: 500 },
    );
  }
}

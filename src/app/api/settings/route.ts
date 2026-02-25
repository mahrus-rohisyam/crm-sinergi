import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/settings — get app settings
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Upsert a default row if it doesn't exist
  const settings = await prisma.appSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });

  return NextResponse.json(settings);
}

// PUT /api/settings — update app settings
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const settings = await prisma.appSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      appName: body.appName || "CRM Suite",
      currency: body.currency || "IDR",
      currencySymbol: body.currencySymbol || "Rp",
      marketingCostPerCustomer: body.marketingCostPerCustomer ?? 610,
      logoUrl: body.logoUrl || null,
      faviconUrl: body.faviconUrl || null,
    },
    update: {
      appName: body.appName,
      currency: body.currency,
      currencySymbol: body.currencySymbol,
      marketingCostPerCustomer: body.marketingCostPerCustomer,
      logoUrl: body.logoUrl,
      faviconUrl: body.faviconUrl,
    },
  });

  return NextResponse.json(settings);
}

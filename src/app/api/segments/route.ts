import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/segments — list all segments with their creator
export async function GET() {
  try {
    const segments = await prisma.segment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });
    return NextResponse.json(segments);
  } catch (error) {
    console.error("Failed to fetch segments:", error);
    return NextResponse.json(
      { error: "Failed to fetch segments" },
      { status: 500 },
    );
  }
}

// POST /api/segments — create a new segment
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, filters, resultCount, createdById } = body;

    if (!name || !createdById) {
      return NextResponse.json(
        { error: "Name and createdById are required" },
        { status: 400 },
      );
    }

    const segment = await prisma.segment.create({
      data: {
        name,
        description: description || null,
        filters: filters || {},
        resultCount: resultCount || 0,
        createdById,
      },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json(segment, { status: 201 });
  } catch (error) {
    console.error("Failed to create segment:", error);
    return NextResponse.json(
      { error: "Failed to create segment" },
      { status: 500 },
    );
  }
}

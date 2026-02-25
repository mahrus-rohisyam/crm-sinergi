import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// GET /api/segments/[id] — get a single segment
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const segment = await prisma.segment.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });

    if (!segment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    return NextResponse.json(segment);
  } catch (error) {
    console.error("Failed to fetch segment:", error);
    return NextResponse.json(
      { error: "Failed to fetch segment" },
      { status: 500 },
    );
  }
}

// PATCH /api/segments/[id] — update a segment
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { name, description, filters, resultCount } = body;

    const segment = await prisma.segment.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(filters !== undefined && { filters }),
        ...(resultCount !== undefined && { resultCount }),
      },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json(segment);
  } catch (error) {
    console.error("Failed to update segment:", error);
    return NextResponse.json(
      { error: "Failed to update segment" },
      { status: 500 },
    );
  }
}

// DELETE /api/segments/[id] — delete a segment
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.segment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete segment:", error);
    return NextResponse.json(
      { error: "Failed to delete segment" },
      { status: 500 },
    );
  }
}

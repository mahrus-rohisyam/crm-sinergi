import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.everproUploadHistory.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.everproUploadHistory.count(),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    // Step 1: Find record to get file path
    const historyItem = await prisma.everproUploadHistory.findUnique({
      where: { id },
    });

    if (historyItem?.filePath) {
      try {
        // historyItem.filePath starts with /everpro-sync/
        // We need to strip the leading slash for path.join to work correctly with process.cwd() + public
        const relativePath = historyItem.filePath.startsWith("/") 
          ? historyItem.filePath.substring(1) 
          : historyItem.filePath;
          
        const absolutePath = path.join(process.cwd(), "public", relativePath);
        console.log("Attempting to delete file at:", absolutePath);
        await unlink(absolutePath);
      } catch (err) {
        console.error(`Physical file deletion failed: ${historyItem.filePath}`, err);
        // We continue anyway so the DB record is removed, but we log the error
      }
    }

    // Step 2: Delete from DB
    await prisma.everproUploadHistory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

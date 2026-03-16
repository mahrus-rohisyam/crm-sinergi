import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/everpro-sync/stats
 * Returns statistics about Everpro contact synchronization
 */
export async function GET() {
  try {
    // Get total contacts
    const totalContacts = await prisma.everproContact.count();

    // Get counts by blast status
    const contactedCount = await prisma.everproContact.count({
      where: { blastStatus: "Sudah" },
    });

    const notContactedCount = await prisma.everproContact.count({
      where: { blastStatus: "Belum" },
    });

    // Get most recent upload
    const lastUpload = await prisma.everproUploadHistory.findFirst({
      where: { status: "success" },
      orderBy: { createdAt: "desc" },
    });

    // Get most recent contact update
    const lastSync = await prisma.everproContact.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });

    // Calculate time since last sync
    let lastSyncDisplay = "Never";
    if (lastSync) {
      const now = new Date();
      const diffMs = now.getTime() - lastSync.updatedAt.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) {
        lastSyncDisplay = "Just now";
      } else if (diffMinutes < 60) {
        lastSyncDisplay = `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
      } else if (diffHours < 24) {
        lastSyncDisplay = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      } else {
        lastSyncDisplay = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
      }
    }

    return NextResponse.json({
      totalContacts,
      contactedCount,
      notContactedCount,
      lastSyncDate: lastSync?.updatedAt || null,
      lastSyncDisplay,
      lastUploadDate: lastUpload?.createdAt || null,
      lastUploadFileName: lastUpload?.fileName || null,
      hasData: totalContacts > 0,
    });
  } catch (error) {
    console.error("Failed to fetch Everpro stats:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch statistics",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

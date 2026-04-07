import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { parseEverproFile } from "@/lib/everpro-parser";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${Date.now()}-${file.name}`;

    // Optionally write file to disk (only when EVERPRO_SAVE_FILE=true)
    if (process.env.EVERPRO_SAVE_FILE === "true") {
      const publicDir = path.join(process.cwd(), "public", "everpro-sync");
      await mkdir(publicDir, { recursive: true });
      await writeFile(path.join(publicDir, fileName), buffer);
    }

    // Parse the file to extract contacts
    const parseResult = parseEverproFile(buffer, file.name);

    if (!parseResult.success) {
      // File saved but parsing failed
      const history = await prisma.everproUploadHistory.create({
        data: {
          fileName: file.name,
          filePath: `/everpro-sync/${fileName}`,
          status: "failed",
          totalRows: parseResult.totalRows,
        },
      });

      return NextResponse.json(
        {
          error: "File parsing failed",
          details: parseResult.errors,
          history,
        },
        { status: 400 },
      );
    }

    // Upsert contacts to database (batch operation)
    // Use transaction for consistency
    const upsertResults = await prisma.$transaction(async (tx) => {
      const results = [];

      // Process in batches of 100 for better performance
      const batchSize = 100;
      for (let i = 0; i < parseResult.contacts.length; i += batchSize) {
        const batch = parseResult.contacts.slice(i, i + batchSize);

        for (const contact of batch) {
          const result = await tx.everproContact.upsert({
            where: { phoneNumber: contact.phoneNumber },
            update: {
              customerName: contact.customerName,
              lastBlastDate: contact.lastBlastDate,
              blastStatus: "Sudah", // Mark as contacted
              updatedAt: new Date(),
            },
            create: {
              phoneNumber: contact.phoneNumber,
              customerName: contact.customerName,
              lastBlastDate: contact.lastBlastDate,
              blastStatus: "Sudah", // Mark as contacted
            },
          });
          results.push(result);
        }
      }

      return results;
    });

    // Create upload history record
    const history = await prisma.everproUploadHistory.create({
      data: {
        fileName: file.name,
        filePath: `/everpro-sync/${fileName}`,
        status: "success",
        totalRows: parseResult.totalRows,
      },
    });

    return NextResponse.json({
      success: true,
      history,
      contactsProcessed: upsertResults.length,
      totalRows: parseResult.totalRows,
      errors: parseResult.errors.length > 0 ? parseResult.errors : undefined,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

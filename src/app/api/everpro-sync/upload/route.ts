import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;
    const publicDir = path.join(process.cwd(), "public", "everpro-sync");
    const filePath = path.join(publicDir, fileName);

    // Ensure directory exists
    try {
      await mkdir(publicDir, { recursive: true });
    } catch (e) {}

    await writeFile(filePath, buffer);

    // For total rows, we'd ideally parse it here, but for now let's just save the entry
    // If we want total rows, we should parse it. For simplicity, let's mock it or leave at 0 if unknown.
    // In a real app, you'd use 'xlsx' here to get row count.
    
    const history = await prisma.everproUploadHistory.create({
      data: {
        fileName: file.name,
        filePath: `/everpro-sync/${fileName}`,
        status: "success",
        totalRows: 0, // Placeholder
      },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

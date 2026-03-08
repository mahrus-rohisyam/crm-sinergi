import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

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
    const publicDir = path.join(process.cwd(), "public", "everpro-sync");
    const filePath = path.join(publicDir, fileName);

    // Ensure directory exists
    try {
      await mkdir(publicDir, { recursive: true });
    } catch (e) {}

    // Parse Row Count using XLSX
    let rowCount = 0;
    try {
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      // Subtract header row if exists
      rowCount = Math.max(0, jsonData.length - 1);
    } catch (parseErr) {
      console.warn("Failed to parse row count during upload:", parseErr);
    }

    await writeFile(filePath, buffer);

    const history = await prisma.everproUploadHistory.create({
      data: {
        fileName: file.name,
        filePath: `/everpro-sync/${fileName}`,
        status: "success",
        totalRows: rowCount,
      },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

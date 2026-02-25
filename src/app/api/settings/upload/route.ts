import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const field = formData.get("field") as string | null;

  if (!file || !field) {
    return NextResponse.json({ error: "File and field required" }, { status: 400 });
  }

  if (!["logoUrl", "faviconUrl"].includes(field)) {
    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  }

  // Validate size (2MB max)
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create uploads directory
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  // Generate filename
  const ext = path.extname(file.name) || ".png";
  const filename = `${field}-${Date.now()}${ext}`;
  const filepath = path.join(uploadDir, filename);

  await writeFile(filepath, buffer);

  const url = `/uploads/${filename}`;

  // Update settings
  await prisma.appSettings.upsert({
    where: { id: "default" },
    create: { id: "default", [field]: url },
    update: { [field]: url },
  });

  return NextResponse.json({ url });
}

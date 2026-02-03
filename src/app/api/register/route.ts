import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email, password, name } = await req.json();

  const cleanEmail = String(email || "")
    .toLowerCase()
    .trim();
  const rawPassword = String(password || "");

  if (!cleanEmail || !rawPassword) {
    return NextResponse.json(
      { error: "Email & password required" },
      { status: 400 },
    );
  }

  const exists = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (exists) {
    return NextResponse.json({ error: "Email already used" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(rawPassword, 12);

  await prisma.user.create({
    data: { email: cleanEmail, name, password: hashed },
  });

  return NextResponse.json({ ok: true });
}

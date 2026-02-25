import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/users — list all users
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      avatar: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

// POST /api/users — create a new user
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, password, role } = await req.json();

  const cleanEmail = String(email || "").toLowerCase().trim();
  if (!cleanEmail || !password) {
    return NextResponse.json({ error: "Email & password required" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (exists) {
    return NextResponse.json({ error: "Email already used" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(String(password), 12);

  const user = await prisma.user.create({
    data: {
      email: cleanEmail,
      name: name || null,
      password: hashed,
      role: role || "member",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user);
}

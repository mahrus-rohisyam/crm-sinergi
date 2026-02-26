import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const path = req.nextUrl.pathname;

  // 1. Redirect /campaign to / (root)
  if (path.startsWith("/campaign")) {
    const newPath = path.replace("/campaign", "") || "/";
    return NextResponse.redirect(new URL(newPath, req.url));
  }

  // 2. Root route: ensure user is logged in
  if (path === "/") {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // 3. If logged in and visiting /login, redirect to root
  if (path === "/login" && token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 4. Protected routes: redirect to login if not authenticated
  const protectedPrefixes = [
    "/segment",
    "/everpro-sync",
    "/users",
    "/profile",
    "/settings",
  ];

  const isProtected = protectedPrefixes.some((prefix) =>
    path.startsWith(prefix),
  );

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/segment/:path*",
    "/overview/:path*",
    "/everpro-sync/:path*",
    "/users/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/campaign/:path*",
  ],
};

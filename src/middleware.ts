import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const path = req.nextUrl.pathname;

  // Root: redirect based on login status
  if (path === "/") {
    return NextResponse.redirect(
      new URL(token ? "/campaign" : "/login", req.url),
    );
  }

  // If logged in and visiting /login, redirect to campaign
  if (path === "/login" && token) {
    return NextResponse.redirect(new URL("/campaign", req.url));
  }

  // Protected routes: redirect to login if not authenticated
  const protectedPrefixes = [
    "/campaign",
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
    "/campaign/:path*",
    "/everpro-sync/:path*",
    "/users/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};

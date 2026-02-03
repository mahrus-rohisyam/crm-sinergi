import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const path = req.nextUrl.pathname;

  // Root: redirect sesuai login status
  if (path === "/") {
    return NextResponse.redirect(
      new URL(token ? "/dashboard" : "/login", req.url),
    );
  }

  // Proteksi dashboard
  if (path.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};

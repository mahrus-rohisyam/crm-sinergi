"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function logout() {
  // Clear the NextAuth session cookies server-side
  const cookieStore = await cookies();

  // NextAuth v4 uses these cookie names
  const sessionCookieNames = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.csrf-token",
    "__Secure-next-auth.csrf-token",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
  ];

  for (const name of sessionCookieNames) {
    cookieStore.delete(name);
  }

  redirect("/login");
}

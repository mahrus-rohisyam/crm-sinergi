"use server";

import { signIn, signOut } from "next-auth/react";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) redirect("/login?error=1");

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: true,
      redirectTo: "/dashboard",
    });
  } catch {
    redirect("/login?error=1");
  }
}

export async function logout() {
  await signOut({ redirect: true, callbackUrl: "/login" });
}

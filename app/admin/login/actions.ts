// app/admin/login/actions.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function safeNextPath(nextPath?: string | null) {
  if (!nextPath) return "/admin";
  // Prevent open redirects: only allow internal admin paths
  if (!nextPath.startsWith("/admin")) return "/admin";
  return nextPath;
}

export async function adminLogin(formData: FormData) {
  const token = process.env.ADMIN_TOKEN;
  const provided = String(formData.get("token") || "").trim();
  const nextPath = safeNextPath(String(formData.get("next") || ""));

  if (!token) {
    // If no token is set, just allow access (local dev).
    redirect(nextPath);
  }

  if (provided !== token) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(nextPath)}`);
  }

  cookies().set("tlw_admin", token!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  redirect(nextPath);
}

export async function adminLogout() {
  cookies().delete("tlw_admin");
  redirect("/admin/login");
}

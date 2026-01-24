// app/admin/login/actions.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function safeNextPath(nextPath?: string | null) {
  if (!nextPath) return "/admin";
  if (!nextPath.startsWith("/admin")) return "/admin";
  return nextPath;
}

export async function adminLogin(formData: FormData) {
  const token = process.env.ADMIN_TOKEN;
  const provided = String(formData.get("token") || "").trim();
  const nextPath = safeNextPath(String(formData.get("next") || ""));

  if (!token) {
    // Local dev / not configured: allow
    redirect(nextPath);
  }

  if (provided !== token) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(nextPath)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set("tlw_admin", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",          // scope cookie to admin only
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });

  redirect(nextPath);
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("tlw_admin");
  redirect("/admin/login");
}

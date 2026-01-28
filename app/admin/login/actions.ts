// app/admin/login/actions.ts
"use server";

import { redirect } from "next/navigation";
import {
  verifyAdminPassword,
  setAdminSessionCookie,
  clearAdminSessionCookie,
  getAdminPassword,
} from "@/lib/admin/auth";

function safeNextPath(nextPath?: string | null) {
  if (!nextPath) return "/admin";
  if (!nextPath.startsWith("/admin")) return "/admin";
  return nextPath;
}

export async function adminLogin(formData: FormData) {
  const provided = String(formData.get("password") || formData.get("token") || "").trim();
  const nextPath = safeNextPath(String(formData.get("next") || ""));

  // Check if password is configured
  const hasPassword = !!getAdminPassword();
  const hasSessionSecret = !!process.env.ADMIN_SESSION_SECRET;

  // In dev without config, allow login
  if (!hasPassword && !hasSessionSecret && process.env.NODE_ENV !== "production") {
    redirect(nextPath);
  }

  // Verify password
  if (!verifyAdminPassword(provided)) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(nextPath)}`);
  }

  // Set session cookie
  await setAdminSessionCookie();

  redirect(nextPath);
}

export async function adminLogout() {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}

// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/admin/:path*"],
};

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Always allow login page (and optionally logout action endpoints)
  if (pathname === "/admin/login") return NextResponse.next();

  // Dev bypass: allow local navigation without auth
  if (process.env.NODE_ENV !== "production") return NextResponse.next();

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    // Fail closed if not configured
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Accept either:
  // 1) browser session cookie set by /admin/login
  // 2) x-admin-token header (useful for API clients)
  const cookie = req.cookies.get("tlw_admin")?.value;
  const header = req.headers.get("x-admin-token");

  const ok = cookie === "1" || header === adminToken;

  if (!ok) {
    // Redirect to login for browser navigations; keep 401 for fetches
    const accept = req.headers.get("accept") || "";
    const isHtml = accept.includes("text/html");

    if (isHtml) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    return new NextResponse("Unauthorized", { status: 401 });
  }

  return NextResponse.next();
}

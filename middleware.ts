// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const LOCALES = ["en", "es", "pt"] as const;
const DEFAULT_LOCALE = "en";

// Paths that should NOT have locale prefix
const EXCLUDED_PATHS = [
  "/admin",
  "/api",
  "/_next",
  "/static",
  "/favicon",
  "/robots.txt",
  "/sitemap",
];

function shouldExclude(pathname: string): boolean {
  return EXCLUDED_PATHS.some((p) => pathname.startsWith(p) || pathname === p);
}

function getLocaleFromPath(pathname: string): string | null {
  const segment = pathname.split("/")[1];
  return LOCALES.includes(segment as (typeof LOCALES)[number]) ? segment : null;
}

export const config = {
  matcher: [
    // Match all paths except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
};

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // ─────────────────────────────────────────────────────────────
  // Admin auth logic (existing)
  // ─────────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    // Always allow login page
    if (pathname === "/admin/login") return NextResponse.next();

    // Dev bypass
    if (process.env.NODE_ENV !== "production") return NextResponse.next();

    const adminToken = process.env.ADMIN_TOKEN;
    if (!adminToken) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const cookie = req.cookies.get("tlw_admin")?.value;
    const header = req.headers.get("x-admin-token");
    const ok = cookie === "1" || header === adminToken;

    if (!ok) {
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

  // ─────────────────────────────────────────────────────────────
  // Locale routing logic
  // ─────────────────────────────────────────────────────────────

  // Skip locale handling for excluded paths
  if (shouldExclude(pathname)) {
    return NextResponse.next();
  }

  const localeInPath = getLocaleFromPath(pathname);

  // If no locale in path, redirect to default locale
  if (!localeInPath) {
    // Root path -> /en
    if (pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = `/${DEFAULT_LOCALE}`;
      return NextResponse.redirect(url, 308);
    }

    // Other paths -> /en/path
    const url = req.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
    return NextResponse.redirect(url, 308);
  }

  // Valid locale in path, continue
  return NextResponse.next();
}

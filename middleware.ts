// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import {
  verifySessionFromRequest,
  getSessionCookieName,
} from "@/lib/admin/auth";

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

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // ─────────────────────────────────────────────────────────────
  // Admin auth logic (HMAC-signed sessions)
  // All admin routes get X-Robots-Tag: noindex, nofollow
  // ─────────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    // Helper to add noindex header to response
    const withNoIndexHeader = (response: NextResponse): NextResponse => {
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      return response;
    };

    // Always allow login page (with noindex header)
    if (pathname === "/admin/login") {
      const response = NextResponse.next();
      return withNoIndexHeader(response);
    }

    // Check for ADMIN_SESSION_SECRET - if not set, block in production
    const hasSessionSecret = !!process.env.ADMIN_SESSION_SECRET;
    if (!hasSessionSecret && process.env.NODE_ENV === "production") {
      const response = new NextResponse("Server configuration error", { status: 500 });
      return withNoIndexHeader(response);
    }

    // Dev bypass when no session secret configured
    if (!hasSessionSecret && process.env.NODE_ENV !== "production") {
      const response = NextResponse.next();
      return withNoIndexHeader(response);
    }

    // Verify session cookie
    const sessionCookie = req.cookies.get(getSessionCookieName())?.value;
    const sessionResult = await verifySessionFromRequest(sessionCookie);

    if (!sessionResult.valid) {
      const accept = req.headers.get("accept") || "";
      const isHtml = accept.includes("text/html");

      if (isHtml) {
        // Redirect to login for browser requests
        const url = req.nextUrl.clone();
        url.pathname = "/admin/login";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }

      // Return 401 for API/non-browser requests
      const response = new NextResponse("Unauthorized", { status: 401 });
      return withNoIndexHeader(response);
    }

    const response = NextResponse.next();
    return withNoIndexHeader(response);
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

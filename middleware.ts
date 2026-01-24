// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/admin/:path*"],
};

export function middleware(req: NextRequest) {
  // Allow the login page (and its assets) through
  const pathname = req.nextUrl.pathname;
  if (pathname === "/admin/login") return NextResponse.next();

  // Dev bypass
  if (process.env.NODE_ENV !== "production") return NextResponse.next();

  const token = process.env.ADMIN_TOKEN;
  const provided = req.headers.get("x-admin-token");

  const session = req.cookies.get("admin_session")?.value;
if (session !== "1") return new NextResponse("Unauthorized", { status: 401 });

  if (!token) {
    // Fail closed if not configured
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (provided !== token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  return NextResponse.next();
}

// middleware.ts
// Protect /admin/* in production. In dev, allow access without headers.

import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/admin/:path*"],
};

export function middleware(req: NextRequest) {
  // Dev bypass: browsers won't send x-admin-token when you just navigate
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  // Production protection
  const token = process.env.ADMIN_TOKEN;
  if (!token) return NextResponse.next();

  const provided = req.headers.get("x-admin-token");
  if (provided !== token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  return NextResponse.next();
}

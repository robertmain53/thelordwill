import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    databaseUrlSet: !!process.env.DATABASE_URL,
    directUrlSet: !!process.env.DIRECT_URL,
    node: process.version,
  });
}

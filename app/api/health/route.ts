import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
  try {
    // Check database connection
    const hasDb = !!process.env.DATABASE_URL;

    // Count records
    const [situations, professions, names, places] = await Promise.all([
      prisma.situation.count().catch(() => 0),
      prisma.profession.count().catch(() => 0),
      prisma.name.count().catch(() => 0),
      prisma.place.count().catch(() => 0),
    ]);

    return NextResponse.json({
      status: 'ok',
      database: {
        connected: hasDb,
        url_set: hasDb ? 'yes' : 'no',
      },
      data: {
        situations,
        professions,
        names,
        places,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        connected: false,
        url_set: !!process.env.DATABASE_URL ? 'yes' : 'no',
      },
    }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      databaseUrlSet: !!process.env.DATABASE_URL,
    },
    database: {
      connected: false,
      tables: {},
      sampleData: {},
    },
    errors: [] as string[],
  };

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    diagnostics.database.connected = true;

    // Check all table counts
    try {
      diagnostics.database.tables.books = await prisma.book.count();
    } catch (e) {
      diagnostics.errors.push(`Book count failed: ${e}`);
      diagnostics.database.tables.books = 'ERROR';
    }

    try {
      diagnostics.database.tables.verses = await prisma.verse.count();
    } catch (e) {
      diagnostics.errors.push(`Verse count failed: ${e}`);
      diagnostics.database.tables.verses = 'ERROR';
    }

    try {
      diagnostics.database.tables.situations = await prisma.situation.count();
    } catch (e) {
      diagnostics.errors.push(`Situation count failed: ${e}`);
      diagnostics.database.tables.situations = 'ERROR';
    }

    try {
      diagnostics.database.tables.professions = await prisma.profession.count();
    } catch (e) {
      diagnostics.errors.push(`Profession count failed: ${e}`);
      diagnostics.database.tables.professions = 'ERROR';
    }

    try {
      diagnostics.database.tables.names = await prisma.name.count();
    } catch (e) {
      diagnostics.errors.push(`Name count failed: ${e}`);
      diagnostics.database.tables.names = 'ERROR';
    }

    try {
      diagnostics.database.tables.places = await prisma.place.count();
    } catch (e) {
      diagnostics.errors.push(`Place count failed: ${e}`);
      diagnostics.database.tables.places = 'ERROR';
    }

    // Get sample data if available
    if (diagnostics.database.tables.situations > 0) {
      try {
        const sampleSituation = await prisma.situation.findFirst({
          select: { slug: true, title: true },
        });
        diagnostics.database.sampleData.situation = sampleSituation;
      } catch (e) {
        diagnostics.errors.push(`Sample situation failed: ${e}`);
      }
    }

    if (diagnostics.database.tables.names > 0) {
      try {
        const sampleName = await prisma.name.findFirst({
          select: { slug: true, name: true },
        });
        diagnostics.database.sampleData.name = sampleName;
      } catch (e) {
        diagnostics.errors.push(`Sample name failed: ${e}`);
      }
    }

    if (diagnostics.database.tables.books > 0) {
      try {
        const sampleBook = await prisma.book.findFirst({
          select: { id: true, name: true, slug: true },
        });
        diagnostics.database.sampleData.book = sampleBook;
      } catch (e) {
        diagnostics.errors.push(`Sample book failed: ${e}`);
      }
    }

    // Test a situation query with book relation
    if (diagnostics.database.tables.situations > 0 && diagnostics.database.tables.books > 0) {
      try {
        const situationWithVerses = await prisma.situation.findFirst({
          include: {
            verseMappings: {
              take: 1,
              include: {
                verse: {
                  include: {
                    book: {
                      select: { id: true, name: true, slug: true },
                    },
                  },
                },
              },
            },
          },
        });
        diagnostics.database.sampleData.situationWithBook = situationWithVerses
          ? {
              slug: situationWithVerses.slug,
              hasVerseMappings: situationWithVerses.verseMappings.length > 0,
              bookWorking: situationWithVerses.verseMappings[0]?.verse?.book ? true : false,
            }
          : null;
      } catch (e) {
        diagnostics.errors.push(`Situation with book relation failed: ${e}`);
      }
    }

    // Route recommendations
    diagnostics.recommendations = [];

    if (diagnostics.database.tables.books === 0) {
      diagnostics.recommendations.push({
        severity: 'CRITICAL',
        message: 'Book table is EMPTY - This will cause all situation/profession routes to fail with 404',
        action: 'Run: npm run seed:books',
      });
    }

    if (diagnostics.database.tables.verses === 0) {
      diagnostics.recommendations.push({
        severity: 'CRITICAL',
        message: 'Verse table is EMPTY - No Bible content available',
        action: 'Run: npm run ingest:bible',
      });
    }

    if (diagnostics.database.tables.situations === 0) {
      diagnostics.recommendations.push({
        severity: 'HIGH',
        message: 'No situations seeded',
        action: 'Run: npx tsx scripts/seed-situations.ts',
      });
    }

    if (diagnostics.database.tables.names === 0) {
      diagnostics.recommendations.push({
        severity: 'HIGH',
        message: 'No names seeded',
        action: 'Run: npx tsx scripts/seed-names.ts',
      });
    }

  } catch (error) {
    diagnostics.database.connected = false;
    diagnostics.errors.push(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  return NextResponse.json(diagnostics, {
    status: diagnostics.database.connected ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

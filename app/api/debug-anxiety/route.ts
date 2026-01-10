import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test basic query
    const situation = await prisma.situation.findUnique({
      where: { slug: 'anxiety' },
      include: {
        verseMappings: {
          take: 2,
          include: {
            verse: {
              include: {
                book: true,
              },
            },
          },
        },
      },
    });

    if (!situation) {
      return NextResponse.json({
        error: 'Situation not found',
        slug: 'anxiety',
      }, { status: 404 });
    }

    return NextResponse.json({
      found: true,
      slug: situation.slug,
      title: situation.title,
      verseMappingsCount: situation.verseMappings.length,
      firstMapping: situation.verseMappings[0] ? {
        relevanceScore: situation.verseMappings[0].relevanceScore,
        verse: {
          hasBook: !!situation.verseMappings[0].verse.book,
          bookName: situation.verseMappings[0].verse.book?.name,
          chapter: situation.verseMappings[0].verse.chapter,
          verseNumber: situation.verseMappings[0].verse.verseNumber,
          hasText: !!(situation.verseMappings[0].verse.textKjv || situation.verseMappings[0].verse.textWeb),
        },
      } : null,
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Query failed',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

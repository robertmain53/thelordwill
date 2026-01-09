import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug') || 'anxiety';

    // Try to find the situation
    const situation = await prisma.situation.findUnique({
      where: { slug },
    });

    if (!situation) {
      return NextResponse.json({
        error: 'Situation not found',
        slug,
        allSituations: await prisma.situation.findMany({
          select: { slug: true, title: true },
        }),
      });
    }

    // Try to get verse mappings
    const verseMappings = await prisma.situationVerseMapping.findMany({
      where: { situationId: situation.id },
      take: 3,
      orderBy: { relevanceScore: 'desc' },
    });

    // Try to get a verse
    let verseDetail = null;
    if (verseMappings.length > 0) {
      try {
        verseDetail = await prisma.verse.findUnique({
          where: { id: verseMappings[0].verseId },
          include: {
            book: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        });
      } catch (error) {
        verseDetail = {
          error: 'Failed to fetch verse with book',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return NextResponse.json({
      situation: {
        id: situation.id,
        slug: situation.slug,
        title: situation.title,
      },
      verseMappingsCount: verseMappings.length,
      verseMappings: verseMappings.map(vm => ({
        verseId: vm.verseId,
        relevanceScore: vm.relevanceScore,
      })),
      verseDetail,
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Query failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

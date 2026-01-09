import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
  try {
    const bookCount = await prisma.book.count();
    const books = await prisma.book.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    const verseCount = await prisma.verse.count();
    const sampleVerse = await prisma.verse.findFirst({
      select: {
        id: true,
        bookId: true,
        chapter: true,
        verseNumber: true,
        textKjv: true,
      },
    });

    return NextResponse.json({
      bookCount,
      books,
      verseCount,
      sampleVerse,
      hasData: bookCount > 0 && verseCount > 0,
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Query failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

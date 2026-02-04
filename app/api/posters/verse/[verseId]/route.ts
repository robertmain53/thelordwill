import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createPosterProvider } from "@/lib/posters/poster-provider";

export async function GET(
  request: NextRequest,
  context: { params?: { verseId?: string } }
): Promise<NextResponse> {
  const verseId = context.params?.verseId;
  if (!verseId) {
    return NextResponse.json({ error: "invalid_verse_id" }, { status: 400 });
  }

  const parsedVerseId = parseInt(verseId, 10);

  if (Number.isNaN(parsedVerseId)) {
    return NextResponse.json({ error: "invalid_verse_id" }, { status: 400 });
  }

  const verse = await prisma.verse.findUnique({
    where: { id: parsedVerseId },
    select: {
      bookId: true,
      chapter: true,
      verseNumber: true,
      textKjv: true,
      textWeb: true,
      book: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!verse) {
    return NextResponse.json({ error: "verse_not_found" }, { status: 404 });
  }

  const reference = `${verse.book?.name ?? "Book"} ${verse.chapter}:${verse.verseNumber}`;
  const provider = createPosterProvider();
  const descriptor = await provider.describeVersePoster(parsedVerseId);

  return NextResponse.json({
    verseId: parsedVerseId,
    reference,
    textPreview: (verse.textKjv || verse.textWeb || "").slice(0, 180),
    tagline: descriptor.tagline,
    description: descriptor.description,
    colorPalette: descriptor.colorPalette,
    orientation: descriptor.orientation,
    source: "mock",
  });
}

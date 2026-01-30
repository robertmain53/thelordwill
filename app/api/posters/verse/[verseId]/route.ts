import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createPosterProvider } from "@/lib/posters/poster-provider";

export async function GET(
  request: Request,
  context: { params: { verseId: string } }
): Promise<NextResponse> {
  const verseId = parseInt(context.params.verseId, 10);

  if (Number.isNaN(verseId)) {
    return NextResponse.json({ error: "invalid_verse_id" }, { status: 400 });
  }

  const verse = await prisma.verse.findUnique({
    where: { id: verseId },
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
  const descriptor = await provider.describeVersePoster(verseId);

  return NextResponse.json({
    verseId,
    reference,
    textPreview: (verse.textKjv || verse.textWeb || "").slice(0, 180),
    tagline: descriptor.tagline,
    description: descriptor.description,
    colorPalette: descriptor.colorPalette,
    orientation: descriptor.orientation,
    source: "mock",
  });
}

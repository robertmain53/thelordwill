import { cache } from "react";

async function getPrisma() {
  const { prisma } = await import("./prisma");
  return prisma;
}

export interface VerseReferenceData {
  id: number;
  book: {
    id: number;
    name: string;
    slug: string;
    testament: string;
    genre: string;
  };
  chapter: number;
  verseNumber: number;
  textKjv: string | null;
  textWeb: string | null;
  textAsv: string | null;
  textBbe: string | null;
  textYlt: string | null;
  updatedAt: Date;
  embedding: {
    model: string;
    vector: number[];
  } | null;
  placeMentions: Array<{
    relevanceScore: number;
    mentionType: string | null;
    place: {
      slug: string;
      name: string;
    };
  }>;
  situationMappings: Array<{
    relevanceScore: number;
    situation: {
      slug: string;
      title: string;
      metaDescription: string | null;
    };
  }>;
  prayerPointMappings: Array<{
    relevanceScore: number;
    prayerPoint: {
      slug: string;
      title: string;
      category: string | null;
    };
  }>;
}

export const getVerseReferenceByBookChapterVerse = cache(
  async (
    bookId: number,
    chapter: number,
    verseNumber: number,
  ): Promise<VerseReferenceData | null> => {
    const prisma = await getPrisma();

    const verse = await prisma.verse.findUnique({
      where: {
        bookId_chapter_verseNumber: {
          bookId,
          chapter,
          verseNumber,
        },
      },
      include: {
        book: {
          select: {
            id: true,
            name: true,
            slug: true,
            testament: true,
            genre: true,
          },
        },
        embedding: {
          select: {
            model: true,
            vector: true,
          },
        },
        placeMentions: {
          where: {
            place: {
              status: "published",
            },
          },
          orderBy: { relevanceScore: "desc" },
          take: 6,
          include: {
            place: {
              select: {
                slug: true,
                name: true,
              },
            },
          },
        },
        situationMappings: {
          where: {
            situation: {
              status: "published",
            },
          },
          orderBy: { relevanceScore: "desc" },
          take: 6,
          include: {
            situation: {
              select: {
                slug: true,
                title: true,
                metaDescription: true,
              },
            },
          },
        },
        prayerPointMappings: {
          where: {
            prayerPoint: {
              status: "published",
            },
          },
          orderBy: { relevanceScore: "desc" },
          take: 6,
          include: {
            prayerPoint: {
              select: {
                slug: true,
                title: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!verse) {
      return null;
    }

    return {
      id: verse.id,
      book: verse.book,
      chapter: verse.chapter,
      verseNumber: verse.verseNumber,
      textKjv: verse.textKjv,
      textWeb: verse.textWeb,
      textAsv: verse.textAsv,
      textBbe: verse.textBbe,
      textYlt: verse.textYlt,
      updatedAt: verse.updatedAt,
      embedding: verse.embedding
        ? {
            model: verse.embedding.model,
            vector: verse.embedding.vector as number[],
          }
        : null,
      placeMentions: verse.placeMentions,
      situationMappings: verse.situationMappings,
      prayerPointMappings: verse.prayerPointMappings,
    };
  },
);

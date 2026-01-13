/**
 * Enhanced database queries for situation pages
 * Fetches verses with multiple translations and Strong's numbers
 */

import { cache } from 'react';

async function getPrisma() {
  const { prisma } = await import('./prisma');
  return prisma;
}

export interface SituationWithVerses {
  id: string;
  slug: string;
  title: string;
  metaDescription: string;
  content: string | null;
  category: string | null;
  updatedAt: Date;
  verseMappings: Array<{
    relevanceScore: number;
    manualNote: string | null;
    verse: {
      id: number;
      bookId: number;
      chapter: number;
      verseNumber: number;
      textKjv: string | null;
      textWeb: string | null;
      textAsv: string | null;
      textBbe: string | null;
      textYlt: string | null;
      book: {
        id: number;
        name: string;
        slug: string;
      };
      strongsNumbers: Array<{
        position: number | null;
        strongs: {
          strongsId: string;
          originalWord: string;
          transliteration: string;
          definition: string;
          language: string;
        };
      }>;
    };
  }>;
}

/**
 * Get situation with top verses and Strong's numbers
 * Cached for performance
 */
export const getSituationWithVerses = cache(
  async (slug: string, limit: number = 10): Promise<SituationWithVerses | null> => {
    if (!process.env.DATABASE_URL) {
      return null;
    }

    const prisma = await getPrisma();
    return await prisma.situation.findUnique({
      where: { slug },
      include: {
        verseMappings: {
          orderBy: { relevanceScore: 'desc' },
          take: limit,
          include: {
            verse: {
              include: {
                book: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
                strongsNumbers: {
                  orderBy: { position: 'asc' },
                  include: {
                    strongs: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
);

/**
 * Get top Strong's words from a verse (limit to most significant)
 */
export function getTopStrongsFromVerse(
  verse: SituationWithVerses['verseMappings'][0]['verse'],
  limit: number = 3
) {
  // Filter for significant Strong's numbers (nouns, verbs, important words)
  // In production, you'd have a significance ranking
  return verse.strongsNumbers.slice(0, limit).map(vs => vs.strongs);
}

/**
 * Format verse reference
 */
export function formatVerseReference(verse: {
  book: { name: string };
  chapter: number;
  verseNumber: number;
}): string {
  return `${verse.book.name} ${verse.chapter}:${verse.verseNumber}`;
}

/**
 * Get related situations
 */
export const getRelatedSituations = cache(async (currentSlug: string, limit: number = 5) => {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  const prisma = await getPrisma();
  const current = await prisma.situation.findUnique({
    where: { slug: currentSlug },
    select: { category: true },
  });

  if (!current?.category) {
    return [];
  }

  return await prisma.situation.findMany({
    where: {
      category: current.category,
      slug: { not: currentSlug },
    },
    take: limit,
    select: {
      slug: true,
      title: true,
      metaDescription: true,
    },
  });
});

/**
 * Calculate content uniqueness score
 * Compares word overlap with site average
 */
export async function calculateContentUniqueness(content: string): Promise<number> {
  // Split into words
  const words = content.toLowerCase().match(/\b\w+\b/g) || [];
  const uniqueWords = new Set(words);

  // In production, compare against:
  // 1. Other situation pages
  // 2. Common Bible phrases
  // 3. Template boilerplate

  // For now, return percentage of unique words
  const uniquenessRatio = uniqueWords.size / words.length;
  return Math.round(uniquenessRatio * 100);
}

/**
 * Get verse statistics for analytics
 */
export const getVerseStatistics = cache(async (verseId: number) => {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const prisma = await getPrisma();
  return await prisma.versePopularity.findUnique({
    where: { verseId },
    select: {
      searchCount: true,
      viewCount: true,
      lastAccessed: true,
    },
  });
});

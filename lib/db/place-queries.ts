/**
 * Database queries for biblical places and tour lead data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type PlaceVerseMention = {
  verse: {
    id: number;
    bookId: number;
    chapter: number;
    verseNumber: number;
    textKjv: string | null;
    textWeb: string | null;
    textAsv: string | null;
    textRV: string | null;
    textBL: string | null;
  };
  relevanceScore: number;
  mentionType: string | null;
};

type RelatedPlaceEdge = {
  relatedPlace: {
    id: string;
    name: string;
    slug: string;
    description: string;
  };
};

type PlaceQueryResult = {
  id: string;
  slug: string;
  name: string;
  description: string;
  historicalInfo: string | null;
  biblicalContext: string | null;
  latitude: number | null;
  longitude: number | null;
  country: string | null;
  region: string | null;
  tourHighlight: boolean;
  verseMentions: PlaceVerseMention[];
  relatedPlaces: RelatedPlaceEdge[];
};

export interface PlaceWithVerses {
  id: string;
  slug: string;
  name: string;
  description: string;
  historicalInfo: string | null;
  biblicalContext: string | null;
  latitude: number | null;
  longitude: number | null;
  country: string | null;
  region: string | null;
  tourHighlight: boolean;
  verses: Array<{
    id: number;
    bookId: number;
    chapter: number;
    verseNumber: number;
    textKjv: string | null;
    textWeb: string | null;
    textAsv: string | null;
    textRV: string | null;
    textBL: string | null;
    relevanceScore: number;
    mentionType: string | null;
  }>;
  relatedPlaces: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
  }>;
}

/**
 * Get a biblical place by slug with related verses and places
 */
export async function getPlaceBySlug(
  slug: string,
  verseLimit: number = 20
): Promise<PlaceWithVerses | null> {
  try {
    const place = await prisma.place.findUnique({
      where: { slug },
      include: {
        verseMentions: {
          take: verseLimit,
          orderBy: { relevanceScore: 'desc' },
          include: {
            verse: {
              select: {
                id: true,
                bookId: true,
                chapter: true,
                verseNumber: true,
                textKjv: true,
                textWeb: true,
                textAsv: true,
                textRV: true,
                textBL: true,
              },
            },
          },
        },
        relatedPlaces: {
          take: 5,
          include: {
            relatedPlace: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
              },
            },
          },
        },
      },
    }) as PlaceQueryResult | null;

    if (!place) {
      return null;
    }

    // Transform the data to match our interface
    return {
      id: place.id,
      slug: place.slug,
      name: place.name,
      description: place.description,
      historicalInfo: place.historicalInfo,
      biblicalContext: place.biblicalContext,
      latitude: place.latitude,
      longitude: place.longitude,
      country: place.country,
      region: place.region,
      tourHighlight: place.tourHighlight,
      verses: place.verseMentions.map((vm) => ({
        id: vm.verse.id,
        bookId: vm.verse.bookId,
        chapter: vm.verse.chapter,
        verseNumber: vm.verse.verseNumber,
        textKjv: vm.verse.textKjv,
        textWeb: vm.verse.textWeb,
        textAsv: vm.verse.textAsv,
        textRV: vm.verse.textRV,
        textBL: vm.verse.textBL,
        relevanceScore: vm.relevanceScore,
        mentionType: vm.mentionType,
      })),
      relatedPlaces: place.relatedPlaces.map((rp) => rp.relatedPlace),
    };
  } catch (error) {
    console.error('Error fetching place:', error);
    return null;
  }
}

/**
 * Get all places for sitemap generation
 */
export async function getAllPlaceSlugs(): Promise<string[]> {
  try {
    const places = await prisma.place.findMany({
      select: { slug: true },
      orderBy: { tourPriority: 'desc' },
    });

    return places.map((p) => p.slug);
  } catch (error) {
    console.error('Error fetching place slugs:', error);
    return [];
  }
}

/**
 * Format verse reference (e.g., "John 3:16")
 */
export function formatPlaceVerseReference(bookId: number, chapter: number, verse: number): string {
  const bookNames: Record<number, string> = {
    1: 'Genesis', 2: 'Exodus', 3: 'Leviticus', 4: 'Numbers', 5: 'Deuteronomy',
    6: 'Joshua', 7: 'Judges', 8: 'Ruth', 9: '1 Samuel', 10: '2 Samuel',
    11: '1 Kings', 12: '2 Kings', 13: '1 Chronicles', 14: '2 Chronicles',
    15: 'Ezra', 16: 'Nehemiah', 17: 'Esther', 18: 'Job', 19: 'Psalms',
    20: 'Proverbs', 21: 'Ecclesiastes', 22: 'Song of Solomon', 23: 'Isaiah',
    24: 'Jeremiah', 25: 'Lamentations', 26: 'Ezekiel', 27: 'Daniel',
    28: 'Hosea', 29: 'Joel', 30: 'Amos', 31: 'Obadiah', 32: 'Jonah',
    33: 'Micah', 34: 'Nahum', 35: 'Habakkuk', 36: 'Zephaniah', 37: 'Haggai',
    38: 'Zechariah', 39: 'Malachi', 40: 'Matthew', 41: 'Mark', 42: 'Luke',
    43: 'John', 44: 'Acts', 45: 'Romans', 46: '1 Corinthians', 47: '2 Corinthians',
    48: 'Galatians', 49: 'Ephesians', 50: 'Philippians', 51: 'Colossians',
    52: '1 Thessalonians', 53: '2 Thessalonians', 54: '1 Timothy', 55: '2 Timothy',
    56: 'Titus', 57: 'Philemon', 58: 'Hebrews', 59: 'James', 60: '1 Peter',
    61: '2 Peter', 62: '1 John', 63: '2 John', 64: '3 John', 65: 'Jude',
    66: 'Revelation',
  };

  const bookName = bookNames[bookId] || `Book ${bookId}`;
  return `${bookName} ${chapter}:${verse}`;
}

/**
 * Bible API Client
 * Supports multiple Bible API providers (API.Bible, ESV API, etc.)
 */

export interface BibleVerse {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  text: string;
  reference: string;
  version: string;
}

export interface BibleAPIResponse {
  verses: BibleVerse[];
  error?: string;
}

/**
 * Fetch verses from API.Bible
 * Documentation: https://scripture.api.bible/
 */
async function fetchFromAPIBible(
  reference: string,
  version: string = 'KJV'
): Promise<BibleAPIResponse> {
  const apiKey = process.env.BIBLE_API_KEY;

  if (!apiKey) {
    return { verses: [], error: 'API key not configured' };
  }

  try {
    // TODO: Implement actual API.Bible integration
    // const response = await fetch(
    //   `https://api.scripture.api.bible/v1/bibles/${version}/verses/${reference}`,
    //   {
    //     headers: {
    //       'api-key': apiKey,
    //     },
    //     next: { revalidate: 86400 }, // Cache for 24 hours
    //   }
    // );

    return {
      verses: [],
      error: 'API integration pending',
    };
  } catch (error) {
    console.error('Error fetching from API.Bible:', error);
    return {
      verses: [],
      error: 'Failed to fetch verses',
    };
  }
}

/**
 * Fetch verses from ESV API
 * Documentation: https://api.esv.org/docs/
 */
async function fetchFromESVAPI(reference: string): Promise<BibleAPIResponse> {
  const apiKey = process.env.ESV_API_KEY;

  if (!apiKey) {
    return { verses: [], error: 'ESV API key not configured' };
  }

  try {
    // TODO: Implement actual ESV API integration
    // const response = await fetch(
    //   `https://api.esv.org/v3/passage/text/?q=${encodeURIComponent(reference)}`,
    //   {
    //     headers: {
    //       Authorization: `Token ${apiKey}`,
    //     },
    //     next: { revalidate: 86400 }, // Cache for 24 hours
    //   }
    // );

    return {
      verses: [],
      error: 'API integration pending',
    };
  } catch (error) {
    console.error('Error fetching from ESV API:', error);
    return {
      verses: [],
      error: 'Failed to fetch verses',
    };
  }
}

/**
 * Main function to fetch Bible verses
 */
export async function fetchBibleVerses(
  reference: string,
  version: string = 'KJV'
): Promise<BibleAPIResponse> {
  // Use different API based on version
  if (version === 'ESV') {
    return fetchFromESVAPI(reference);
  }

  return fetchFromAPIBible(reference, version);
}

/**
 * Search for verses by keyword
 */
export async function searchBibleVerses(
  query: string,
  version: string = 'KJV',
  limit: number = 10
): Promise<BibleAPIResponse> {
  const apiKey = process.env.BIBLE_API_KEY;

  if (!apiKey) {
    return { verses: [], error: 'API key not configured' };
  }

  try {
    // TODO: Implement actual search functionality
    return {
      verses: [],
      error: 'Search functionality pending',
    };
  } catch (error) {
    console.error('Error searching verses:', error);
    return {
      verses: [],
      error: 'Failed to search verses',
    };
  }
}

/**
 * Parse Bible reference string
 */
export function parseBibleReference(reference: string): {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
} | null {
  // Simple regex for parsing references like "John 3:16" or "John 3:16-17"
  const regex = /^(\d?\s?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$/;
  const match = reference.match(regex);

  if (!match) {
    return null;
  }

  return {
    book: match[1].trim(),
    chapter: parseInt(match[2], 10),
    verseStart: parseInt(match[3], 10),
    verseEnd: match[4] ? parseInt(match[4], 10) : undefined,
  };
}

/**
 * Format Bible reference for display
 */
export function formatBibleReference(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd?: number
): string {
  const base = `${book} ${chapter}:${verseStart}`;
  return verseEnd ? `${base}-${verseEnd}` : base;
}

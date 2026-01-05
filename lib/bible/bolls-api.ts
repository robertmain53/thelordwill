/**
 * Bolls Bible API Client
 * Documentation: https://bolls.life/api/
 */

const BOLLS_API_BASE = 'https://bolls.life';

export interface BollsVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BollsBookInfo {
  bookid: string;
  name: string;
  chapters: number[];
}

export interface BollsTranslation {
  id: string;
  name: string;
  language: string;
}

/**
 * Get list of available translations
 */
export async function getTranslations(): Promise<BollsTranslation[]> {
  try {
    const response = await fetch(`${BOLLS_API_BASE}/get-translations/`, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch translations: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching translations:', error);
    return [];
  }
}

/**
 * Get book information for a translation
 */
export async function getBooks(translationId: string): Promise<BollsBookInfo[]> {
  try {
    const response = await fetch(`${BOLLS_API_BASE}/get-books/${translationId}/`, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch books: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching books:', error);
    return [];
  }
}

/**
 * Get verses for a specific chapter
 * @param translationId - Translation ID (e.g., 'kjv', 'web', 'asv')
 * @param bookId - Book abbreviation (e.g., 'Gen', 'John')
 * @param chapter - Chapter number
 */
export async function getChapter(
  translationId: string,
  bookId: string,
  chapter: number
): Promise<BollsVerse[]> {
  try {
    const response = await fetch(
      `${BOLLS_API_BASE}/get-chapter/${translationId}/${bookId}/${chapter}/`,
      {
        next: { revalidate: 86400 },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch chapter: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching chapter ${bookId} ${chapter}:`, error);
    return [];
  }
}

/**
 * Get a specific verse
 * @param translationId - Translation ID
 * @param bookId - Book abbreviation
 * @param chapter - Chapter number
 * @param verse - Verse number
 */
export async function getVerse(
  translationId: string,
  bookId: string,
  chapter: number,
  verse: number
): Promise<BollsVerse | null> {
  try {
    const response = await fetch(
      `${BOLLS_API_BASE}/get-verse/${translationId}/${bookId}/${chapter}/${verse}/`,
      {
        next: { revalidate: 86400 },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch verse: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error(`Error fetching verse ${bookId} ${chapter}:${verse}:`, error);
    return null;
  }
}

/**
 * Get verses within a range
 */
export async function getVerseRange(
  translationId: string,
  bookId: string,
  chapter: number,
  verseStart: number,
  verseEnd: number
): Promise<BollsVerse[]> {
  try {
    const response = await fetch(
      `${BOLLS_API_BASE}/get-verse-range/${translationId}/${bookId}/${chapter}/${verseStart}-${verseEnd}/`,
      {
        next: { revalidate: 86400 },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch verse range: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching verse range ${bookId} ${chapter}:${verseStart}-${verseEnd}:`, error);
    return [];
  }
}

/**
 * Map Bolls book ID to our book ID
 */
export function mapBollsBookToBookId(bollsBookId: string): number | null {
  const bookMap: Record<string, number> = {
    'Gen': 1, 'Exod': 2, 'Lev': 3, 'Num': 4, 'Deut': 5,
    'Josh': 6, 'Judg': 7, 'Ruth': 8, '1Sam': 9, '2Sam': 10,
    '1Kgs': 11, '2Kgs': 12, '1Chr': 13, '2Chr': 14, 'Ezra': 15,
    'Neh': 16, 'Esth': 17, 'Job': 18, 'Ps': 19, 'Prov': 20,
    'Eccl': 21, 'Song': 22, 'Isa': 23, 'Jer': 24, 'Lam': 25,
    'Ezek': 26, 'Dan': 27, 'Hos': 28, 'Joel': 29, 'Amos': 30,
    'Obad': 31, 'Jonah': 32, 'Mic': 33, 'Nah': 34, 'Hab': 35,
    'Zeph': 36, 'Hag': 37, 'Zech': 38, 'Mal': 39,
    'Matt': 40, 'Mark': 41, 'Luke': 42, 'John': 43, 'Acts': 44,
    'Rom': 45, '1Cor': 46, '2Cor': 47, 'Gal': 48, 'Eph': 49,
    'Phil': 50, 'Col': 51, '1Thess': 52, '2Thess': 53, '1Tim': 54,
    '2Tim': 55, 'Titus': 56, 'Phlm': 57, 'Heb': 58, 'Jas': 59,
    '1Pet': 60, '2Pet': 61, '1John': 62, '2John': 63, '3John': 64,
    'Jude': 65, 'Rev': 66,
  };

  return bookMap[bollsBookId] || null;
}

/**
 * Get Bolls book ID from our book ID
 */
export function getBollsBookId(bookId: number): string | null {
  const reverseMap: Record<number, string> = {
    1: 'Gen', 2: 'Exod', 3: 'Lev', 4: 'Num', 5: 'Deut',
    6: 'Josh', 7: 'Judg', 8: 'Ruth', 9: '1Sam', 10: '2Sam',
    11: '1Kgs', 12: '2Kgs', 13: '1Chr', 14: '2Chr', 15: 'Ezra',
    16: 'Neh', 17: 'Esth', 18: 'Job', 19: 'Ps', 20: 'Prov',
    21: 'Eccl', 22: 'Song', 23: 'Isa', 24: 'Jer', 25: 'Lam',
    26: 'Ezek', 27: 'Dan', 28: 'Hos', 29: 'Joel', 30: 'Amos',
    31: 'Obad', 32: 'Jonah', 33: 'Mic', 34: 'Nah', 35: 'Hab',
    36: 'Zeph', 37: 'Hag', 38: 'Zech', 39: 'Mal',
    40: 'Matt', 41: 'Mark', 42: 'Luke', 43: 'John', 44: 'Acts',
    45: 'Rom', 46: '1Cor', 47: '2Cor', 48: 'Gal', 49: 'Eph',
    50: 'Phil', 51: 'Col', 52: '1Thess', 53: '2Thess', 54: '1Tim',
    55: '2Tim', 56: 'Titus', 57: 'Phlm', 58: 'Heb', 59: 'Jas',
    60: '1Pet', 61: '2Pet', 62: '1John', 63: '2John', 64: '3John',
    65: 'Jude', 66: 'Rev',
  };

  return reverseMap[bookId] || null;
}

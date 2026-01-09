/**
 * Bible API Client (bible-api.com)
 * Free public API - supports WEB (World English Bible) translation
 * For additional translations, consider API.Bible (requires free API key)
 */

const BIBLE_API_BASE = 'https://bible-api.com';

export interface BibleVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleResponse {
  reference: string;
  verses: BibleVerse[];
  text: string;
  translation_id: string;
  translation_name: string;
}

/**
 * Get a specific verse or passage
 * @param reference - Bible reference (e.g., "john 3:16", "genesis 1:1-10")
 * @returns Promise<BibleResponse | null>
 */
export async function getVerse(reference: string): Promise<BibleResponse | null> {
  try {
    const formattedRef = reference.replace(/\s+/g, '+');
    const response = await fetch(`${BIBLE_API_BASE}/${formattedRef}`);

    if (!response.ok) {
      console.error(`Failed to fetch ${reference}: ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching verse ${reference}:`, error);
    return null;
  }
}

/**
 * Get an entire chapter
 * @param book - Book name (e.g., "genesis", "john")
 * @param chapter - Chapter number
 * @returns Promise<BibleResponse | null>
 */
export async function getChapter(book: string, chapter: number): Promise<BibleResponse | null> {
  try {
    const reference = `${book}+${chapter}`;
    const response = await fetch(`${BIBLE_API_BASE}/${reference}`);

    if (!response.ok) {
      console.error(`Failed to fetch ${book} ${chapter}: ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching chapter ${book} ${chapter}:`, error);
    return null;
  }
}

/**
 * Map book ID to book name for API requests
 */
export function getBookName(bookId: number): string | null {
  const bookNames: Record<number, string> = {
    1: 'genesis', 2: 'exodus', 3: 'leviticus', 4: 'numbers', 5: 'deuteronomy',
    6: 'joshua', 7: 'judges', 8: 'ruth', 9: '1samuel', 10: '2samuel',
    11: '1kings', 12: '2kings', 13: '1chronicles', 14: '2chronicles', 15: 'ezra',
    16: 'nehemiah', 17: 'esther', 18: 'job', 19: 'psalms', 20: 'proverbs',
    21: 'ecclesiastes', 22: 'song+of+solomon', 23: 'isaiah', 24: 'jeremiah', 25: 'lamentations',
    26: 'ezekiel', 27: 'daniel', 28: 'hosea', 29: 'joel', 30: 'amos',
    31: 'obadiah', 32: 'jonah', 33: 'micah', 34: 'nahum', 35: 'habakkuk',
    36: 'zephaniah', 37: 'haggai', 38: 'zechariah', 39: 'malachi',
    40: 'matthew', 41: 'mark', 42: 'luke', 43: 'john', 44: 'acts',
    45: 'romans', 46: '1corinthians', 47: '2corinthians', 48: 'galatians', 49: 'ephesians',
    50: 'philippians', 51: 'colossians', 52: '1thessalonians', 53: '2thessalonians', 54: '1timothy',
    55: '2timothy', 56: 'titus', 57: 'philemon', 58: 'hebrews', 59: 'james',
    60: '1peter', 61: '2peter', 62: '1john', 63: '2john', 64: '3john',
    65: 'jude', 66: 'revelation',
  };

  return bookNames[bookId] || null;
}

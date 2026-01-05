/**
 * Verse ID Generation Utilities
 * Format: BBCCCVVV (8 digits)
 * Example: 01001001 = Genesis 1:1
 */

/**
 * Generate 8-digit verse ID
 * @param bookId - Book number (1-66)
 * @param chapter - Chapter number
 * @param verse - Verse number
 * @returns 8-digit integer (BBCCCVVV)
 */
export function generateVerseId(bookId: number, chapter: number, verse: number): number {
  if (bookId < 1 || bookId > 66) {
    throw new Error(`Invalid book ID: ${bookId}. Must be between 1-66.`);
  }
  if (chapter < 1 || chapter > 999) {
    throw new Error(`Invalid chapter: ${chapter}. Must be between 1-999.`);
  }
  if (verse < 1 || verse > 999) {
    throw new Error(`Invalid verse: ${verse}. Must be between 1-999.`);
  }

  // Format: BB CCC VVV
  const bookPart = bookId.toString().padStart(2, '0');
  const chapterPart = chapter.toString().padStart(3, '0');
  const versePart = verse.toString().padStart(3, '0');

  return parseInt(`${bookPart}${chapterPart}${versePart}`, 10);
}

/**
 * Parse 8-digit verse ID back to components
 * @param verseId - 8-digit verse ID
 * @returns Object with bookId, chapter, verse
 */
export function parseVerseId(verseId: number): {
  bookId: number;
  chapter: number;
  verse: number;
} {
  const idStr = verseId.toString().padStart(8, '0');

  return {
    bookId: parseInt(idStr.slice(0, 2), 10),
    chapter: parseInt(idStr.slice(2, 5), 10),
    verse: parseInt(idStr.slice(5, 8), 10),
  };
}

/**
 * Validate verse ID format
 */
export function isValidVerseId(verseId: number): boolean {
  if (verseId < 1001001 || verseId > 66999999) {
    return false;
  }

  try {
    const { bookId, chapter, verse } = parseVerseId(verseId);
    return bookId >= 1 && bookId <= 66 && chapter >= 1 && verse >= 1;
  } catch {
    return false;
  }
}

/**
 * Generate reference string from verse ID
 * @param verseId - 8-digit verse ID
 * @param bookName - Name of the book
 * @returns Reference string (e.g., "Genesis 1:1")
 */
export function formatVerseReference(verseId: number, bookName: string): string {
  const { chapter, verse } = parseVerseId(verseId);
  return `${bookName} ${chapter}:${verse}`;
}

/**
 * Generate range of verse IDs
 * @param bookId - Book number
 * @param chapter - Chapter number
 * @param verseStart - Starting verse
 * @param verseEnd - Ending verse
 */
export function generateVerseRange(
  bookId: number,
  chapter: number,
  verseStart: number,
  verseEnd: number
): number[] {
  const range: number[] = [];
  for (let v = verseStart; v <= verseEnd; v++) {
    range.push(generateVerseId(bookId, chapter, v));
  }
  return range;
}

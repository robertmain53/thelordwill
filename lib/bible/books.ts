/**
 * Bible Books Metadata
 * Standard Protestant canon (66 books)
 */

export interface BookMetadata {
  id: number;
  name: string;
  slug: string;
  testament: 'OT' | 'NT';
  genre: string;
  chapters: number;
  verses: number;
}

export const BIBLE_BOOKS: BookMetadata[] = [
  // Old Testament - Law (Torah)
  { id: 1, name: 'Genesis', slug: 'genesis', testament: 'OT', genre: 'Law', chapters: 50, verses: 1533 },
  { id: 2, name: 'Exodus', slug: 'exodus', testament: 'OT', genre: 'Law', chapters: 40, verses: 1213 },
  { id: 3, name: 'Leviticus', slug: 'leviticus', testament: 'OT', genre: 'Law', chapters: 27, verses: 859 },
  { id: 4, name: 'Numbers', slug: 'numbers', testament: 'OT', genre: 'Law', chapters: 36, verses: 1288 },
  { id: 5, name: 'Deuteronomy', slug: 'deuteronomy', testament: 'OT', genre: 'Law', chapters: 34, verses: 959 },

  // Old Testament - History
  { id: 6, name: 'Joshua', slug: 'joshua', testament: 'OT', genre: 'History', chapters: 24, verses: 658 },
  { id: 7, name: 'Judges', slug: 'judges', testament: 'OT', genre: 'History', chapters: 21, verses: 618 },
  { id: 8, name: 'Ruth', slug: 'ruth', testament: 'OT', genre: 'History', chapters: 4, verses: 85 },
  { id: 9, name: '1 Samuel', slug: '1-samuel', testament: 'OT', genre: 'History', chapters: 31, verses: 810 },
  { id: 10, name: '2 Samuel', slug: '2-samuel', testament: 'OT', genre: 'History', chapters: 24, verses: 695 },
  { id: 11, name: '1 Kings', slug: '1-kings', testament: 'OT', genre: 'History', chapters: 22, verses: 816 },
  { id: 12, name: '2 Kings', slug: '2-kings', testament: 'OT', genre: 'History', chapters: 25, verses: 719 },
  { id: 13, name: '1 Chronicles', slug: '1-chronicles', testament: 'OT', genre: 'History', chapters: 29, verses: 942 },
  { id: 14, name: '2 Chronicles', slug: '2-chronicles', testament: 'OT', genre: 'History', chapters: 36, verses: 822 },
  { id: 15, name: 'Ezra', slug: 'ezra', testament: 'OT', genre: 'History', chapters: 10, verses: 280 },
  { id: 16, name: 'Nehemiah', slug: 'nehemiah', testament: 'OT', genre: 'History', chapters: 13, verses: 406 },
  { id: 17, name: 'Esther', slug: 'esther', testament: 'OT', genre: 'History', chapters: 10, verses: 167 },

  // Old Testament - Wisdom
  { id: 18, name: 'Job', slug: 'job', testament: 'OT', genre: 'Wisdom', chapters: 42, verses: 1070 },
  { id: 19, name: 'Psalms', slug: 'psalms', testament: 'OT', genre: 'Wisdom', chapters: 150, verses: 2461 },
  { id: 20, name: 'Proverbs', slug: 'proverbs', testament: 'OT', genre: 'Wisdom', chapters: 31, verses: 915 },
  { id: 21, name: 'Ecclesiastes', slug: 'ecclesiastes', testament: 'OT', genre: 'Wisdom', chapters: 12, verses: 222 },
  { id: 22, name: 'Song of Solomon', slug: 'song-of-solomon', testament: 'OT', genre: 'Wisdom', chapters: 8, verses: 117 },

  // Old Testament - Major Prophets
  { id: 23, name: 'Isaiah', slug: 'isaiah', testament: 'OT', genre: 'Prophecy', chapters: 66, verses: 1292 },
  { id: 24, name: 'Jeremiah', slug: 'jeremiah', testament: 'OT', genre: 'Prophecy', chapters: 52, verses: 1364 },
  { id: 25, name: 'Lamentations', slug: 'lamentations', testament: 'OT', genre: 'Prophecy', chapters: 5, verses: 154 },
  { id: 26, name: 'Ezekiel', slug: 'ezekiel', testament: 'OT', genre: 'Prophecy', chapters: 48, verses: 1273 },
  { id: 27, name: 'Daniel', slug: 'daniel', testament: 'OT', genre: 'Prophecy', chapters: 12, verses: 357 },

  // Old Testament - Minor Prophets
  { id: 28, name: 'Hosea', slug: 'hosea', testament: 'OT', genre: 'Prophecy', chapters: 14, verses: 197 },
  { id: 29, name: 'Joel', slug: 'joel', testament: 'OT', genre: 'Prophecy', chapters: 3, verses: 73 },
  { id: 30, name: 'Amos', slug: 'amos', testament: 'OT', genre: 'Prophecy', chapters: 9, verses: 146 },
  { id: 31, name: 'Obadiah', slug: 'obadiah', testament: 'OT', genre: 'Prophecy', chapters: 1, verses: 21 },
  { id: 32, name: 'Jonah', slug: 'jonah', testament: 'OT', genre: 'Prophecy', chapters: 4, verses: 48 },
  { id: 33, name: 'Micah', slug: 'micah', testament: 'OT', genre: 'Prophecy', chapters: 7, verses: 105 },
  { id: 34, name: 'Nahum', slug: 'nahum', testament: 'OT', genre: 'Prophecy', chapters: 3, verses: 47 },
  { id: 35, name: 'Habakkuk', slug: 'habakkuk', testament: 'OT', genre: 'Prophecy', chapters: 3, verses: 56 },
  { id: 36, name: 'Zephaniah', slug: 'zephaniah', testament: 'OT', genre: 'Prophecy', chapters: 3, verses: 53 },
  { id: 37, name: 'Haggai', slug: 'haggai', testament: 'OT', genre: 'Prophecy', chapters: 2, verses: 38 },
  { id: 38, name: 'Zechariah', slug: 'zechariah', testament: 'OT', genre: 'Prophecy', chapters: 14, verses: 211 },
  { id: 39, name: 'Malachi', slug: 'malachi', testament: 'OT', genre: 'Prophecy', chapters: 4, verses: 55 },

  // New Testament - Gospels
  { id: 40, name: 'Matthew', slug: 'matthew', testament: 'NT', genre: 'Gospel', chapters: 28, verses: 1071 },
  { id: 41, name: 'Mark', slug: 'mark', testament: 'NT', genre: 'Gospel', chapters: 16, verses: 678 },
  { id: 42, name: 'Luke', slug: 'luke', testament: 'NT', genre: 'Gospel', chapters: 24, verses: 1151 },
  { id: 43, name: 'John', slug: 'john', testament: 'NT', genre: 'Gospel', chapters: 21, verses: 879 },

  // New Testament - History
  { id: 44, name: 'Acts', slug: 'acts', testament: 'NT', genre: 'History', chapters: 28, verses: 1007 },

  // New Testament - Paul's Epistles
  { id: 45, name: 'Romans', slug: 'romans', testament: 'NT', genre: 'Epistle', chapters: 16, verses: 433 },
  { id: 46, name: '1 Corinthians', slug: '1-corinthians', testament: 'NT', genre: 'Epistle', chapters: 16, verses: 437 },
  { id: 47, name: '2 Corinthians', slug: '2-corinthians', testament: 'NT', genre: 'Epistle', chapters: 13, verses: 257 },
  { id: 48, name: 'Galatians', slug: 'galatians', testament: 'NT', genre: 'Epistle', chapters: 6, verses: 149 },
  { id: 49, name: 'Ephesians', slug: 'ephesians', testament: 'NT', genre: 'Epistle', chapters: 6, verses: 155 },
  { id: 50, name: 'Philippians', slug: 'philippians', testament: 'NT', genre: 'Epistle', chapters: 4, verses: 104 },
  { id: 51, name: 'Colossians', slug: 'colossians', testament: 'NT', genre: 'Epistle', chapters: 4, verses: 95 },
  { id: 52, name: '1 Thessalonians', slug: '1-thessalonians', testament: 'NT', genre: 'Epistle', chapters: 5, verses: 89 },
  { id: 53, name: '2 Thessalonians', slug: '2-thessalonians', testament: 'NT', genre: 'Epistle', chapters: 3, verses: 47 },
  { id: 54, name: '1 Timothy', slug: '1-timothy', testament: 'NT', genre: 'Epistle', chapters: 6, verses: 113 },
  { id: 55, name: '2 Timothy', slug: '2-timothy', testament: 'NT', genre: 'Epistle', chapters: 4, verses: 83 },
  { id: 56, name: 'Titus', slug: 'titus', testament: 'NT', genre: 'Epistle', chapters: 3, verses: 46 },
  { id: 57, name: 'Philemon', slug: 'philemon', testament: 'NT', genre: 'Epistle', chapters: 1, verses: 25 },

  // New Testament - General Epistles
  { id: 58, name: 'Hebrews', slug: 'hebrews', testament: 'NT', genre: 'Epistle', chapters: 13, verses: 303 },
  { id: 59, name: 'James', slug: 'james', testament: 'NT', genre: 'Epistle', chapters: 5, verses: 108 },
  { id: 60, name: '1 Peter', slug: '1-peter', testament: 'NT', genre: 'Epistle', chapters: 5, verses: 105 },
  { id: 61, name: '2 Peter', slug: '2-peter', testament: 'NT', genre: 'Epistle', chapters: 3, verses: 61 },
  { id: 62, name: '1 John', slug: '1-john', testament: 'NT', genre: 'Epistle', chapters: 5, verses: 105 },
  { id: 63, name: '2 John', slug: '2-john', testament: 'NT', genre: 'Epistle', chapters: 1, verses: 13 },
  { id: 64, name: '3 John', slug: '3-john', testament: 'NT', genre: 'Epistle', chapters: 1, verses: 14 },
  { id: 65, name: 'Jude', slug: 'jude', testament: 'NT', genre: 'Epistle', chapters: 1, verses: 25 },

  // New Testament - Apocalyptic
  { id: 66, name: 'Revelation', slug: 'revelation', testament: 'NT', genre: 'Apocalyptic', chapters: 22, verses: 404 },
];

/**
 * Get book by ID
 */
export function getBookById(id: number): BookMetadata | undefined {
  return BIBLE_BOOKS.find(book => book.id === id);
}

/**
 * Get book by name
 */
export function getBookByName(name: string): BookMetadata | undefined {
  return BIBLE_BOOKS.find(book =>
    book.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get book by slug
 */
export function getBookBySlug(slug: string): BookMetadata | undefined {
  return BIBLE_BOOKS.find(book => book.slug === slug);
}

/**
 * Get all books in testament
 */
export function getBooksByTestament(testament: 'OT' | 'NT'): BookMetadata[] {
  return BIBLE_BOOKS.filter(book => book.testament === testament);
}

/**
 * Get all books by genre
 */
export function getBooksByGenre(genre: string): BookMetadata[] {
  return BIBLE_BOOKS.filter(book => book.genre === genre);
}

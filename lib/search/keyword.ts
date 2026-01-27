/**
 * Keyword Search Module
 *
 * SQL-based keyword search across all entity types.
 * Used as fallback when vector provider is "none" or for keyword mode.
 */

async function getPrisma() {
  const { prisma } = await import("@/lib/db/prisma");
  return prisma;
}

export type SearchEntityType =
  | "situation"
  | "prayerPoint"
  | "place"
  | "profession"
  | "verse"
  | "name";

export interface SearchResult {
  id: string;
  type: SearchEntityType;
  title: string;
  description: string;
  slug: string;
  url: string;
  score: number;
}

export interface KeywordSearchOptions {
  limit?: number;
  offset?: number;
  types?: SearchEntityType[];
}

const DEFAULT_TYPES: SearchEntityType[] = [
  "situation",
  "prayerPoint",
  "place",
  "profession",
  "verse",
  "name",
];

/**
 * Search across all entity types using keyword matching
 */
export async function keywordSearch(
  query: string,
  options: KeywordSearchOptions = {}
): Promise<SearchResult[]> {
  const { limit = 20, offset = 0, types = DEFAULT_TYPES } = options;
  const prisma = await getPrisma();

  // Normalize query for search
  const searchTerm = query.trim().toLowerCase();
  if (!searchTerm) return [];

  // Search each entity type in parallel
  const searchPromises: Promise<SearchResult[]>[] = [];

  if (types.includes("situation")) {
    searchPromises.push(searchSituations(prisma, searchTerm, limit));
  }
  if (types.includes("prayerPoint")) {
    searchPromises.push(searchPrayerPoints(prisma, searchTerm, limit));
  }
  if (types.includes("place")) {
    searchPromises.push(searchPlaces(prisma, searchTerm, limit));
  }
  if (types.includes("profession")) {
    searchPromises.push(searchProfessions(prisma, searchTerm, limit));
  }
  if (types.includes("verse")) {
    searchPromises.push(searchVerses(prisma, searchTerm, limit));
  }
  if (types.includes("name")) {
    searchPromises.push(searchNames(prisma, searchTerm, limit));
  }

  const allResults = await Promise.all(searchPromises);

  // Flatten and sort by score
  const combined = allResults
    .flat()
    .sort((a, b) => b.score - a.score)
    .slice(offset, offset + limit);

  return combined;
}

/**
 * Calculate simple relevance score based on match quality
 */
function calculateScore(
  text: string,
  query: string,
  baseScore: number = 50
): number {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  let score = baseScore;

  // Exact match bonus
  if (lowerText === lowerQuery) {
    score += 50;
  }
  // Starts with bonus
  else if (lowerText.startsWith(lowerQuery)) {
    score += 30;
  }
  // Contains as word bonus
  else if (new RegExp(`\\b${escapeRegex(lowerQuery)}\\b`).test(lowerText)) {
    score += 20;
  }
  // Contains anywhere
  else if (lowerText.includes(lowerQuery)) {
    score += 10;
  }

  return score;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ============================================================================
// Entity-specific search functions
// ============================================================================

async function searchSituations(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
  query: string,
  limit: number
): Promise<SearchResult[]> {
  const results = await prisma.situation.findMany({
    where: {
      status: "published",
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { metaDescription: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      metaDescription: true,
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
  });

  return results.map((r) => ({
    id: r.id,
    type: "situation" as const,
    title: r.title,
    description: r.metaDescription.substring(0, 200),
    slug: r.slug,
    url: `/bible-verses-for/${r.slug}`,
    score: calculateScore(r.title, query, 60),
  }));
}

async function searchPrayerPoints(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
  query: string,
  limit: number
): Promise<SearchResult[]> {
  const results = await prisma.prayerPoint.findMany({
    where: {
      status: "published",
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
    },
    take: limit,
    orderBy: { priority: "desc" },
  });

  return results.map((r) => ({
    id: r.id,
    type: "prayerPoint" as const,
    title: r.title,
    description: r.description.substring(0, 200),
    slug: r.slug,
    url: `/prayer-points/${r.slug}`,
    score: calculateScore(r.title, query, 55),
  }));
}

async function searchPlaces(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
  query: string,
  limit: number
): Promise<SearchResult[]> {
  const results = await prisma.place.findMany({
    where: {
      status: "published",
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { biblicalContext: { contains: query, mode: "insensitive" } },
        { historicalInfo: { contains: query, mode: "insensitive" } },
        { country: { contains: query, mode: "insensitive" } },
        { region: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
    },
    take: limit,
    orderBy: { tourPriority: "desc" },
  });

  return results.map((r) => ({
    id: r.id,
    type: "place" as const,
    title: r.name,
    description: r.description.substring(0, 200),
    slug: r.slug,
    url: `/bible-places/${r.slug}`,
    score: calculateScore(r.name, query, 65),
  }));
}

async function searchProfessions(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
  query: string,
  limit: number
): Promise<SearchResult[]> {
  const results = await prisma.profession.findMany({
    where: {
      status: "published",
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
  });

  return results.map((r) => ({
    id: r.id,
    type: "profession" as const,
    title: r.title,
    description: r.description.substring(0, 200),
    slug: r.slug,
    url: `/prayers-for-professions/${r.slug}`,
    score: calculateScore(r.title, query, 50),
  }));
}

async function searchVerses(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
  query: string,
  limit: number
): Promise<SearchResult[]> {
  const results = await prisma.verse.findMany({
    where: {
      OR: [
        { textKjv: { contains: query, mode: "insensitive" } },
        { textWeb: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      bookId: true,
      chapter: true,
      verseNumber: true,
      textKjv: true,
      book: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
    take: limit,
    orderBy: [{ bookId: "asc" }, { chapter: "asc" }, { verseNumber: "asc" }],
  });

  return results.map((r) => {
    const ref = `${r.book.name} ${r.chapter}:${r.verseNumber}`;
    return {
      id: String(r.id),
      type: "verse" as const,
      title: ref,
      description: (r.textKjv || "").substring(0, 200),
      slug: `${r.book.slug}/${r.chapter}/${r.verseNumber}`,
      url: `/verse/${r.book.slug}/${r.chapter}/${r.verseNumber}`,
      score: calculateScore(r.textKjv || "", query, 40),
    };
  });
}

async function searchNames(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
  query: string,
  limit: number
): Promise<SearchResult[]> {
  const results = await prisma.name.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { meaning: { contains: query, mode: "insensitive" } },
        { characterDescription: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      meaning: true,
    },
    take: limit,
    orderBy: { name: "asc" },
  });

  return results.map((r) => ({
    id: r.id,
    type: "name" as const,
    title: r.name,
    description: r.meaning.substring(0, 200),
    slug: r.slug,
    url: `/meaning-of/${r.slug}`,
    score: calculateScore(r.name, query, 55),
  }));
}

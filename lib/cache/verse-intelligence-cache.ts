import { prisma } from "@/lib/db/prisma";
import { getCanonicalUrl } from "@/lib/utils";
import { toFloat32Array, topKSimilar } from "@/scripts/embeddings/_embeddings-lib";

const CACHE_TTL_MS = 5 * 60 * 1000;
const SEMANTIC_CANDIDATES = 300;
const SEMANTIC_RESULTS = 5;

export interface SemanticMatch {
  reference: string;
  snippet: string;
  href: string;
  score: number;
}

export interface IntelligenceVersePayload {
  verse: {
    id: number;
    bookId: number;
    chapter: number;
    verseNumber: number;
    updatedAt: Date;
    textKjv: string | null;
    textWeb: string | null;
    placeMentions: Array<{ place: { slug: string; name: string } }>;
    situationMappings: Array<{ situation: { slug: string; title: string } }>;
    prayerPointMappings: Array<{ prayerPoint: { slug: string; title: string } }>;
    embedding: { model: string; vector: number[] } | null;
    book: { name: string; slug: string; testament: string; genre: string };
  };
  semanticMatches: SemanticMatch[];
}

interface CacheEntry {
  data: IntelligenceVersePayload;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function buildCacheKey(verseId: number, model: string) {
  return `${verseId}:${model}`;
}

async function fetchSemanticMatches(model: string, vector: number[], verseId: number): Promise<SemanticMatch[]> {
  const candidates = await prisma.verseEmbedding.findMany({
    where: { model },
    include: {
      verse: {
        select: {
          id: true,
          bookId: true,
          chapter: true,
          verseNumber: true,
          textKjv: true,
          textWeb: true,
          book: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { verseId: "asc" },
    take: SEMANTIC_CANDIDATES,
  });

  const queryVector = toFloat32Array(vector);
  const candidateVectors = candidates.map((candidate) =>
    toFloat32Array(candidate.vector as number[]),
  );

  const topK = topKSimilar(queryVector, candidateVectors, SEMANTIC_RESULTS + 1);

  return topK
    .map((item) => {
      const candidate = candidates[item.index];
      if (!candidate.verse || candidate.verse.id === verseId) return null;

      const bookName = candidate.verse.book?.name || "Book";
      const text = candidate.verse.textKjv ?? candidate.verse.textWeb ?? "";
      const snippet = text.length > 120 ? `${text.slice(0, 120)}…` : text;
      const href = getCanonicalUrl(
        `/verse/${candidate.verse.bookId}/${candidate.verse.chapter}/${candidate.verse.verseNumber}`,
      );

      return {
        reference: `${bookName} ${candidate.verse.chapter}:${candidate.verse.verseNumber}`,
        snippet,
        href,
        score: item.score,
      };
    })
    .filter((match): match is SemanticMatch => !!match)
    .slice(0, SEMANTIC_RESULTS);
}

export async function getCachedVerseIntelligence(verseId: number): Promise<IntelligenceVersePayload | null> {
  // Quickly fetch the verse's updatedAt and embedding to determine model
  const meta = await prisma.verse.findUnique({
    where: { id: verseId },
    select: {
      updatedAt: true,
      embedding: { select: { model: true } },
    },
  });

  if (!meta) return null;

  const model = meta.embedding?.model ?? "text-embedding-3-small";
  const key = buildCacheKey(verseId, model);
  const cached = cache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    const cachedCachedAt = cached.data.verse.updatedAt.toISOString();
    if (cachedCachedAt === meta.updatedAt.toISOString()) {
      return cached.data;
    }
  }

  const verse = await prisma.verse.findUnique({
    where: { id: verseId },
    include: {
      book: { select: { name: true, slug: true, testament: true, genre: true } },
      placeMentions: {
        where: { place: { status: "published" } },
        orderBy: { relevanceScore: "desc" },
        take: 6,
        include: { place: { select: { slug: true, name: true } } },
      },
      situationMappings: {
        where: { situation: { status: "published" } },
        orderBy: { relevanceScore: "desc" },
        take: 6,
        include: { situation: { select: { slug: true, title: true } } },
      },
      prayerPointMappings: {
        where: { prayerPoint: { status: "published" } },
        orderBy: { relevanceScore: "desc" },
        take: 6,
        include: { prayerPoint: { select: { slug: true, title: true } } },
      },
      embedding: { select: { model: true, vector: true } },
    },
  });

  if (!verse) {
    cache.delete(key);
    return null;
  }

  const semanticMatches = verse.embedding
    ? await fetchSemanticMatches(verse.embedding.model, verse.embedding.vector as number[], verse.id)
    : [];

  const payload: IntelligenceVersePayload = {
    verse: {
      id: verse.id,
      bookId: verse.book?.id ?? verse.bookId,
      chapter: verse.chapter,
      verseNumber: verse.verseNumber,
      updatedAt: verse.updatedAt,
      textKjv: verse.textKjv,
      textWeb: verse.textWeb,
      placeMentions: verse.placeMentions,
      situationMappings: verse.situationMappings,
      prayerPointMappings: verse.prayerPointMappings,
      embedding: verse.embedding
        ? {
            model: verse.embedding.model,
            vector: verse.embedding.vector as number[],
          }
        : null,
      book: verse.book,
    },
    semanticMatches,
  };

  cache.set(key, {
    data: payload,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return payload;
}

export function invalidateVerseIntelligenceCache(verseId: number) {
  const prefix = `${verseId}:`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

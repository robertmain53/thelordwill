/**
 * Sitemap Generator Utilities
 * Generates chunked sitemaps for 100k+ pages
 * Splits into 10,000 URL chunks per sitemap
 */

import { getCanonicalUrl } from '@/lib/utils';
import { MetadataRoute } from 'next';

const CHUNK_SIZE = 10000;

async function getPrisma() {
  const { prisma } = await import('@/lib/db');
  return prisma;
}

export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

/**
 * Generate sitemap for static pages
 */
export async function generateStaticSitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    { path: '/', changeFrequency: 'daily' as const, priority: 1.0 },
    { path: '/bible-places', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/situations', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/names', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/professions', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/bible-travel', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/prayer-points', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/prayer-points/today', changeFrequency: 'daily' as const, priority: 0.8 },
    { path: '/about', changeFrequency: 'yearly' as const, priority: 0.4 },
    { path: '/editorial-process', changeFrequency: 'yearly' as const, priority: 0.4 },
    { path: '/cookie', changeFrequency: 'yearly' as const, priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.3 },
    { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.3 },
  ];

  const locales = ['en', 'es', 'pt'] as const;
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const item of staticPaths) {
    entries.push({
      url: getCanonicalUrl(item.path),
      lastModified: now,
      changeFrequency: item.changeFrequency,
      priority: item.priority,
    });

    for (const locale of locales) {
      entries.push({
        url: getCanonicalUrl(`/${locale}${item.path === '/' ? '' : item.path}`),
        lastModified: now,
        changeFrequency: item.changeFrequency,
        priority: item.priority,
      });
    }
  }

  return entries;
}

/**
 * Generate sitemap for situations
 */
export async function generateSituationsSitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  const prisma = await getPrisma();
  const situations = await prisma.situation.findMany({
    where: { status: "published" },
    select: {
      slug: true,
      updatedAt: true,
      verseMappings: {
        select: {
          relevanceScore: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return situations.map(
    (situation: {
      slug: string;
      updatedAt: Date | string;
      verseMappings: Array<{ relevanceScore: number }>;
    }) => {
    // Calculate priority based on verse count and avg relevance
    const avgRelevance =
      situation.verseMappings.reduce((sum, m) => sum + m.relevanceScore, 0) /
      (situation.verseMappings.length || 1);

    const priority = Math.min(0.8, 0.5 + avgRelevance / 200);

    return {
      url: getCanonicalUrl(`/bible-verses-for/${situation.slug}`),
      lastModified: situation.updatedAt,
      changeFrequency: 'monthly' as const,
      priority,
    };
    }
  );
}

/**
 * Generate sitemap chunk for names
 */
export async function generateNamesSitemap(chunk: number = 1): Promise<MetadataRoute.Sitemap> {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  const prisma = await getPrisma();
  const offset = (chunk - 1) * CHUNK_SIZE;

  const names = await prisma.name.findMany({
    select: {
      slug: true,
      updatedAt: true,
      _count: {
        select: {
          mentions: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    skip: offset,
    take: CHUNK_SIZE,
  });

  return names.map(
    (name: { slug: string; updatedAt: Date | string; _count: { mentions: number } }) => {
    // Priority based on mention count (more mentions = higher priority)
    const priority = Math.min(0.8, 0.4 + (name._count.mentions / 100));

    return {
      url: getCanonicalUrl(`/meaning-of/${name.slug}/in-the-bible`),
      lastModified: name.updatedAt,
      changeFrequency: 'monthly' as const,
      priority,
    };
    }
  );
}

/**
 * Generate sitemap for professions
 */
export async function generateProfessionsSitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  const prisma = await getPrisma();
  const professions = await prisma.profession.findMany({
    where: { status: "published" },
    select: {
      slug: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return professions.map(
    (profession: { slug: string; updatedAt: Date | string }) => ({
      url: getCanonicalUrl(`/bible-verses-for/${profession.slug}`),
      lastModified: profession.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })
  );
}

/**
 * Generate sitemap for places (published only)
 */
export async function generatePlacesSitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  const prisma = await getPrisma();
  const places = await prisma.place.findMany({
    where: { status: "published" },
    select: {
      slug: true,
      updatedAt: true,
      tourHighlight: true,
      _count: {
        select: {
          verseMentions: true,
        },
      },
    },
    orderBy: [{ tourPriority: "desc" }, { updatedAt: "desc" }],
  });

  return places.map(
    (place: {
      slug: string;
      updatedAt: Date | string;
      tourHighlight: boolean;
      _count: { verseMentions: number };
    }) => {
      // Priority based on tour highlight and verse count
      let priority = 0.6;
      if (place.tourHighlight) priority = 0.8;
      if (place._count.verseMentions > 50) priority = Math.min(priority + 0.1, 0.9);

      return {
        url: getCanonicalUrl(`/bible-places/${place.slug}`),
        lastModified: place.updatedAt,
        changeFrequency: "monthly" as const,
        priority,
      };
    }
  );
}

/**
 * Calculate total number of sitemap chunks needed
 */
export async function calculateSitemapChunks(): Promise<{
  names: number;
  situations: number;
  professions: number;
  total: number;
}> {
  if (!process.env.DATABASE_URL) {
    return {
      names: 0,
      situations: 0,
      professions: 0,
      total: 0,
    };
  }

  const prisma = await getPrisma();
  const namesCount = await prisma.name.count();

  const nameChunks = Math.ceil(namesCount / CHUNK_SIZE);

  return {
    names: nameChunks,
    situations: 1, // Typically under 10k
    professions: 1, // Typically under 10k
    total: nameChunks + 2,
  };
}

/**
 * Generate sitemap index XML
 */
export async function generateSitemapIndex(): Promise<string> {
  const chunks = await calculateSitemapChunks();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thelordwill.com';

  const sitemaps: string[] = [
    `${baseUrl}/sitemap-static.xml`,
    `${baseUrl}/sitemap-situations.xml`,
    `${baseUrl}/sitemap-professions.xml`,
    `${baseUrl}/sitemap-places.xml`,
  ];

  // Add name sitemap chunks
  for (let i = 1; i <= chunks.names; i++) {
    sitemaps.push(`${baseUrl}/sitemap-names/${i}.xml`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (url) => `  <sitemap>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>`;

  return xml;
}

/**
 * Get sitemap statistics
 */
export async function getSitemapStats(): Promise<{
  totalUrls: number;
  totalChunks: number;
  breakdown: {
    static: number;
    situations: number;
    names: number;
    professions: number;
    places: number;
  };
}> {
  if (!process.env.DATABASE_URL) {
    return {
      totalUrls: 0,
      totalChunks: 0,
      breakdown: {
        static: 0,
        situations: 0,
        names: 0,
        professions: 0,
        places: 0,
      },
    };
  }

  const prisma = await getPrisma();
  const [namesCount, situationsCount, professionsCount, placesCount] = await Promise.all([
    prisma.name.count(),
    prisma.situation.count({ where: { status: "published" } }),
    prisma.profession.count({ where: { status: "published" } }),
    prisma.place.count({ where: { status: "published" } }),
  ]);

  const staticPages = 5; // home, situations, names, professions, bible-places

  return {
    totalUrls: staticPages + namesCount + situationsCount + professionsCount + placesCount,
    totalChunks: Math.ceil(namesCount / CHUNK_SIZE) + 4, // +4 for static, situations, professions, places
    breakdown: {
      static: staticPages,
      situations: situationsCount,
      names: namesCount,
      professions: professionsCount,
      places: placesCount,
    },
  };
}

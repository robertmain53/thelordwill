/**
 * Sitemap Generator Utilities
 * Generates chunked sitemaps for 100k+ pages
 * Splits into 10,000 URL chunks per sitemap
 */

import { prisma } from '@/lib/db';
import { getCanonicalUrl } from '@/lib/utils';
import { MetadataRoute } from 'next';

const CHUNK_SIZE = 10000;

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
  return [
    {
      url: getCanonicalUrl('/'),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: getCanonicalUrl('/situations'),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: getCanonicalUrl('/names'),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: getCanonicalUrl('/professions'),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];
}

/**
 * Generate sitemap for situations
 */
export async function generateSituationsSitemap(): Promise<MetadataRoute.Sitemap> {
  const situations = await prisma.situation.findMany({
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

  return situations.map((situation) => {
    // Calculate priority based on verse count and avg relevance
    const avgRelevance =
      situation.verseMappings.reduce((sum, m) => sum + m.relevanceScore, 0) /
      (situation.verseMappings.length || 1);

    const priority = Math.min(0.8, 0.5 + avgRelevance / 200);

    return {
      url: getCanonicalUrl(`/bible-verses-for-${situation.slug}`),
      lastModified: situation.updatedAt,
      changeFrequency: 'monthly' as const,
      priority,
    };
  });
}

/**
 * Generate sitemap chunk for names
 */
export async function generateNamesSitemap(chunk: number = 1): Promise<MetadataRoute.Sitemap> {
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

  return names.map((name) => {
    // Priority based on mention count (more mentions = higher priority)
    const priority = Math.min(0.8, 0.4 + (name._count.mentions / 100));

    return {
      url: getCanonicalUrl(`/meaning-of-${name.slug}-in-the-bible`),
      lastModified: name.updatedAt,
      changeFrequency: 'monthly' as const,
      priority,
    };
  });
}

/**
 * Generate sitemap for professions
 */
export async function generateProfessionsSitemap(): Promise<MetadataRoute.Sitemap> {
  const professions = await prisma.profession.findMany({
    select: {
      slug: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return professions.map((profession) => ({
    url: getCanonicalUrl(`/bible-verses-for-${profession.slug}`),
    lastModified: profession.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));
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
  const [namesCount, situationsCount, professionsCount] = await Promise.all([
    prisma.name.count(),
    prisma.situation.count(),
    prisma.profession.count(),
  ]);

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
  ];

  // Add name sitemap chunks
  for (let i = 1; i <= chunks.names; i++) {
    sitemaps.push(`${baseUrl}/sitemap-names-${i}.xml`);
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
  };
}> {
  const [namesCount, situationsCount, professionsCount] = await Promise.all([
    prisma.name.count(),
    prisma.situation.count(),
    prisma.profession.count(),
  ]);

  const staticPages = 4; // home, situations, names, professions

  return {
    totalUrls: staticPages + namesCount + situationsCount + professionsCount,
    totalChunks: Math.ceil(namesCount / CHUNK_SIZE) + 3,
    breakdown: {
      static: staticPages,
      situations: situationsCount,
      names: namesCount,
      professions: professionsCount,
    },
  };
}

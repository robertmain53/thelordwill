/**
 * Internal Linking Algorithm
 * Distributes link juice across 100k+ pages
 * Ensures shallow depth (3 clicks max) and optimal linking density
 */

import { cache } from 'react';

async function getPrisma() {
  const { prisma } = await import('@/lib/db');
  return prisma;
}

export interface InternalLink {
  href: string;
  title: string;
  category: 'situation' | 'name' | 'profession' | 'verse';
  relevance?: number;
}

export interface LinkingStrategy {
  relatedSituations: InternalLink[];
  trendingNames: InternalLink[];
  thematicLinks: InternalLink[];
  breadcrumbs: BreadcrumbItem[];
  totalLinks: number;
}

export interface BreadcrumbItem {
  label: string;
  href: string;
  position: number;
}

/**
 * RULE 1: Shallow Depth
 * Calculate depth from homepage
 */
export function calculatePageDepth(pageType: string): number {
  const depthMap: Record<string, number> = {
    home: 0,
    category: 1,        // /situations, /names, /professions
    situation: 2,       // /bible-verses-for-[situation]
    name: 2,            // /meaning-of-[name]-in-the-bible
    profession: 2,      // /bible-verses-for-[profession]
    verse: 3,           // /verse/[reference] (future)
  };

  return depthMap[pageType] || 3;
}

/**
 * RULE 2: Thematic Clusters
 * Link name pages to situation pages based on first verse mention
 */
export const getThematicLinks = cache(
  async (pageType: 'name' | 'situation' | 'profession', slug: string): Promise<InternalLink[]> => {
    if (!process.env.DATABASE_URL) {
      return [];
    }

    const prisma = await getPrisma();
    const links: InternalLink[] = [];

    if (pageType === 'name') {
      // Find situations related to this name's verses
      const name = await prisma.name.findUnique({
        where: { slug },
        include: {
          mentions: {
            take: 3,
            include: {
              verse: {
                include: {
                  situationMappings: {
                    orderBy: { relevanceScore: 'desc' },
                    take: 1,
                    include: {
                      situation: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (name) {
        const situationLinks = new Map<string, InternalLink>();

        for (const mention of name.mentions) {
          for (const mapping of mention.verse.situationMappings) {
            const situation = mapping.situation;
            if (!situationLinks.has(situation.slug)) {
              situationLinks.set(situation.slug, {
                href: `/bible-verses-for-${situation.slug}`,
                title: `Bible Verses for ${situation.title}`,
                category: 'situation',
                relevance: mapping.relevanceScore,
              });
            }
          }
        }

        links.push(...Array.from(situationLinks.values()).slice(0, 3));
      }
    } else if (pageType === 'situation') {
      // Find names mentioned in top verses
      const situation = await prisma.situation.findUnique({
        where: { slug },
        include: {
          verseMappings: {
            orderBy: { relevanceScore: 'desc' },
            take: 3,
            include: {
              verse: {
                include: {
                  nameMentions: {
                    take: 1,
                    include: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (situation) {
        const nameLinks = new Map<string, InternalLink>();

        for (const mapping of situation.verseMappings) {
          for (const mention of mapping.verse.nameMentions) {
            const name = mention.name;
            if (!nameLinks.has(name.slug)) {
              nameLinks.set(name.slug, {
                href: `/meaning-of-${name.slug}-in-the-bible`,
                title: `Meaning of ${name.name} in the Bible`,
                category: 'name',
              });
            }
          }
        }

        links.push(...Array.from(nameLinks.values()).slice(0, 2));
      }
    }

    return links;
  }
);

/**
 * RULE 3: Linking Density (5-15 links per page)
 * Get related situations based on category
 */
export const getRelatedSituations = cache(
  async (currentSlug: string, limit: number = 3): Promise<InternalLink[]> => {
    if (!process.env.DATABASE_URL) {
      return [];
    }

    const prisma = await getPrisma();
    const current = await prisma.situation.findUnique({
      where: { slug: currentSlug },
      select: { category: true },
    });

    if (!current?.category) {
      // Fallback: get random popular situations
      const situations = await prisma.situation.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { slug: true, title: true },
      });

      return situations.map((s: { slug: string; title: string }) => ({
        href: `/bible-verses-for-${s.slug}`,
        title: s.title,
        category: 'situation' as const,
      }));
    }

    const related = await prisma.situation.findMany({
      where: {
        category: current.category,
        slug: { not: currentSlug },
      },
      take: limit,
      orderBy: {
        verseMappings: {
          _count: 'desc',
        },
      },
      select: { slug: true, title: true },
    });

    return related.map((s: { slug: string; title: string }) => ({
      href: `/bible-verses-for-${s.slug}`,
      title: s.title,
      category: 'situation' as const,
    }));
  }
);

/**
 * Get trending names (most viewed/searched)
 */
export const getTrendingNames = cache(async (limit: number = 2): Promise<InternalLink[]> => {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  const prisma = await getPrisma();
  // Get names with most mentions (proxy for popularity)
  const names = await prisma.name.findMany({
    take: limit,
    orderBy: {
      mentions: {
        _count: 'desc',
      },
    },
    select: {
      slug: true,
      name: true,
      _count: {
        select: {
          mentions: true,
        },
      },
    },
  });

  return names.map((n: { slug: string; name: string }) => ({
    href: `/meaning-of-${n.slug}-in-the-bible`,
    title: `Meaning of ${n.name}`,
    category: 'name' as const,
  }));
});

/**
 * Get trending professions
 */
export const getTrendingProfessions = cache(async (limit: number = 2): Promise<InternalLink[]> => {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  const prisma = await getPrisma();
  const professions = await prisma.profession.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: { slug: true, title: true },
  });

  return professions.map((p: { slug: string; title: string }) => ({
    href: `/bible-verses-for-${p.slug}`,
    title: `Bible Verses for ${p.title}s`,
    category: 'profession' as const,
  }));
});

/**
 * Generate complete linking strategy for a page
 */
export async function generateLinkingStrategy(
  pageType: 'name' | 'situation' | 'profession',
  slug: string,
  breadcrumbs: BreadcrumbItem[]
): Promise<LinkingStrategy> {
  // Get thematic links (2-3 links)
  const thematicLinks = await getThematicLinks(pageType, slug);

  // Get related situations (3 links)
  const relatedSituations =
    pageType === 'situation'
      ? await getRelatedSituations(slug, 3)
      : [];

  // Get trending names (2 links)
  const trendingNames = await getTrendingNames(2);

  // Calculate total links
  const totalLinks =
    breadcrumbs.length +
    thematicLinks.length +
    relatedSituations.length +
    trendingNames.length;

  return {
    relatedSituations,
    trendingNames,
    thematicLinks,
    breadcrumbs,
    totalLinks,
  };
}

/**
 * Validate linking density (5-15 links)
 */
export function validateLinkingDensity(totalLinks: number): {
  isValid: boolean;
  message: string;
} {
  if (totalLinks < 5) {
    return {
      isValid: false,
      message: `Insufficient links: ${totalLinks}/5 minimum`,
    };
  }

  if (totalLinks > 15) {
    return {
      isValid: false,
      message: `Too many links: ${totalLinks}/15 maximum`,
    };
  }

  return {
    isValid: true,
    message: `Optimal linking density: ${totalLinks} links`,
  };
}

/**
 * Generate breadcrumbs for a page
 */
export function generateBreadcrumbs(
  pageType: 'name' | 'situation' | 'profession',
  title: string,
  slug: string
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: 'Home',
      href: '/',
      position: 1,
    },
  ];

  if (pageType === 'situation') {
    breadcrumbs.push(
      {
        label: 'Situations',
        href: '/situations',
        position: 2,
      },
      {
        label: title,
        href: `/bible-verses-for-${slug}`,
        position: 3,
      }
    );
  } else if (pageType === 'name') {
    breadcrumbs.push(
      {
        label: 'Biblical Names',
        href: '/names',
        position: 2,
      },
      {
        label: title,
        href: `/meaning-of-${slug}-in-the-bible`,
        position: 3,
      }
    );
  } else if (pageType === 'profession') {
    breadcrumbs.push(
      {
        label: 'Professions',
        href: '/professions',
        position: 2,
      },
      {
        label: title,
        href: `/bible-verses-for-${slug}`,
        position: 3,
      }
    );
  }

  return breadcrumbs;
}

/**
 * Calculate link distribution for optimal SEO
 */
export function calculateLinkDistribution(totalPages: number): {
  hubPages: number;
  spokePages: number;
  avgLinksPerPage: number;
} {
  // Hub-and-spoke model
  // 10% hub pages with more links
  // 90% spoke pages with standard links

  const hubPages = Math.ceil(totalPages * 0.1);
  const spokePages = totalPages - hubPages;

  // Average links per page
  const avgLinksPerPage = 10; // Target middle of 5-15 range

  return {
    hubPages,
    spokePages,
    avgLinksPerPage,
  };
}

/**
 * Get hub pages (high authority pages with more links)
 */
export const getHubPages = cache(async (): Promise<InternalLink[]> => {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  const prisma = await getPrisma();
  // Hub pages: Most popular situations
  const topSituations = await prisma.situation.findMany({
    take: 10,
    orderBy: {
      verseMappings: {
        _count: 'desc',
      },
    },
    select: { slug: true, title: true },
  });

  return topSituations.map((s: { slug: string; title: string }) => ({
    href: `/bible-verses-for-${s.slug}`,
    title: s.title,
    category: 'situation' as const,
  }));
});

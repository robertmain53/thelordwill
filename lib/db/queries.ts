import { prisma } from './prisma';
import { cache } from 'react';

/**
 * Get biblical name by slug (cached for performance)
 */
export const getBiblicalName = cache(async (slug: string) => {
  const name = await prisma.name.findUnique({
    where: { slug },
    include: {
      mentions: {
        take: 10,
        orderBy: { verseId: 'asc' },
        include: {
          verse: true,
        },
      },
      relatedNames: {
        take: 5,
      },
    },
  });

  if (!name) return null;

  // Fetch related names separately since the relation doesn't include nested data
  const relatedNameIds = name.relatedNames.map(r => r.relatedNameId);
  const relatedNamesData = relatedNameIds.length > 0
    ? await prisma.name.findMany({
        where: { id: { in: relatedNameIds } },
        select: { id: true, name: true, slug: true, meaning: true },
      })
    : [];

  return {
    ...name,
    relatedNames: relatedNamesData,
  };
});

/**
 * Get situation by slug (cached for performance)
 * Only returns published situations
 */
export const getSituation = cache(async (slug: string) => {
  return await prisma.situation.findFirst({
    where: {
      slug,
      status: "published",
    },
    include: {
      verseMappings: {
        take: 10,
        orderBy: { relevanceScore: 'desc' },
        include: {
          verse: true,
        },
      },
      relatedSituations: {
        take: 5,
      },
    },
  });
});

/**
 * Get profession by slug (cached for performance)
 * Only returns published professions
 */
export const getProfession = cache(async (slug: string) => {
  return await prisma.profession.findFirst({
    where: {
      slug,
      status: "published",
    },
    select: {
      slug: true,
      title: true,
      description: true,
      content: true,
      metaTitle: true,
      metaDescription: true,
      titleTranslations: true,
      descriptionTranslations: true,
      contentTranslations: true,
      metaTitleTranslations: true,
      metaDescriptionTranslations: true,
      relatedProfessions: {
        take: 5,
        select: {
          id: true,
          slug: true,
          title: true,
        },
      },
    },
  });
});

/**
 * Track page view for analytics
 */
export async function trackPageView(slug: string, pageType: 'name' | 'situation' | 'profession') {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    await prisma.pageView.upsert({
      where: {
        slug_pageType_date: {
          slug,
          pageType,
          date: today,
        },
      },
      update: {
        views: {
          increment: 1,
        },
      },
      create: {
        slug,
        pageType,
        date: today,
        views: 1,
      },
    });
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
}

/**
 * Get popular pages for sitemap prioritization
 */
export const getPopularPages = cache(async (pageType?: string, limit: number = 100) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return await prisma.pageView.groupBy({
    by: ['slug', 'pageType'],
    where: {
      date: {
        gte: thirtyDaysAgo,
      },
      ...(pageType && { pageType }),
    },
    _sum: {
      views: true,
    },
    orderBy: {
      _sum: {
        views: 'desc',
      },
    },
    take: limit,
  });
});

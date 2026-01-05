import { prisma } from './prisma';
import { cache } from 'react';

/**
 * Get biblical name by slug (cached for performance)
 */
export const getBiblicalName = cache(async (slug: string) => {
  return await prisma.biblicalName.findUnique({
    where: { slug },
    include: {
      verses: {
        take: 10,
        orderBy: { reference: 'asc' },
      },
      relatedNames: {
        take: 5,
      },
    },
  });
});

/**
 * Get situation by slug (cached for performance)
 */
export const getSituation = cache(async (slug: string) => {
  return await prisma.situation.findUnique({
    where: { slug },
    include: {
      verses: {
        take: 10,
        orderBy: { reference: 'asc' },
      },
      relatedSituations: {
        take: 5,
      },
    },
  });
});

/**
 * Get profession by slug (cached for performance)
 */
export const getProfession = cache(async (slug: string) => {
  return await prisma.profession.findUnique({
    where: { slug },
    include: {
      verses: {
        take: 10,
        orderBy: { reference: 'asc' },
      },
      relatedProfessions: {
        take: 5,
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

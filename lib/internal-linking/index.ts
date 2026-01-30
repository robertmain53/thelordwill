/**
 * Deterministic Internal Linking System
 *
 * Ensures all pages are reachable from home in ≤3 clicks:
 * Home → Hub → Index → Detail (max 3)
 *
 * No LLM. No content generation. Pure deterministic linking from DB relations.
 */

import { cache } from "react";

async function getPrisma() {
  const { prisma } = await import("@/lib/db/prisma");
  return prisma;
}

// ============================================================================
// Types
// ============================================================================

export interface HubLink {
  href: string;
  label: string;
  description: string;
  icon: string;
  priority: number;
}

export interface RelatedLink {
  href: string;
  title: string;
  description?: string;
  type:
    | "place"
    | "situation"
    | "profession"
    | "prayer-point"
    | "name"
    | "itinerary"
    | "verse";
}

export interface BreadcrumbItem {
  label: string;
  href: string;
  position: number;
}

export type EntityType =
  | "place"
  | "situation"
  | "profession"
  | "prayer-point"
  | "name"
  | "itinerary";

// ============================================================================
// Hub Links - Primary navigation from homepage
// ============================================================================

/**
 * Returns the primary hub links for the homepage.
 * These are the main entry points to content sections.
 * Depth: Home (0) → Hub (1)
 */
export function getHubLinks(): HubLink[] {
  return [
    {
      href: "/bible-places",
      label: "Biblical Places",
      description: "Explore sacred sites from Scripture and plan your Christian pilgrimage.",
      icon: "🏛️",
      priority: 1,
    },
    {
      href: "/bible-travel",
      label: "Bible Travel",
      description: "Ready-to-use pilgrimage itineraries with daily readings.",
      icon: "🧭",
      priority: 2,
    },
    {
      href: "/situations",
      label: "Verses for Situations",
      description: "Find comfort and guidance through Bible verses for life's moments.",
      icon: "📖",
      priority: 3,
    },
    {
      href: "/professions",
      label: "Verses for Professions",
      description: "Discover biblical wisdom relevant to your profession and calling.",
      icon: "💼",
      priority: 4,
    },
    {
      href: "/prayer-points",
      label: "Prayer Points",
      description: "Scripture-anchored prayer topics with curated verses.",
      icon: "🙏",
      priority: 5,
    },
    {
      href: "/names",
      label: "Biblical Names",
      description: "Explore the deep meanings behind biblical names.",
      icon: "✨",
      priority: 6,
    },
  ];
}

/**
 * Returns secondary hub links for "Explore More" sections on listing pages.
 * Excludes the current section to avoid self-linking.
 */
export function getExploreMoreLinks(currentSection: string): HubLink[] {
  const allHubs = getHubLinks();
  const currentPath = currentSection.startsWith("/") ? currentSection : `/${currentSection}`;

  return allHubs
    .filter((hub) => hub.href !== currentPath)
    .slice(0, 4); // Limit to 4 for UI balance
}

// ============================================================================
// Category Label Normalization
// ============================================================================

const CATEGORY_LABELS: Record<string, string> = {
  // Situation categories
  "emotions": "Emotions & Feelings",
  "health": "Health & Healing",
  "relationships": "Relationships",
  "faith": "Faith & Trust",
  "guidance": "Guidance & Direction",
  "spiritual-warfare": "Spiritual Warfare",
  "encouragement": "Encouragement",
  "deliverance": "Deliverance",
  "breakthrough": "Breakthrough",
  "protection": "Protection",
  "peace": "Peace & Comfort",
  "anxiety": "Anxiety & Worry",
  "grief": "Grief & Loss",
  "fear": "Fear & Courage",
  "forgiveness": "Forgiveness",
  "gratitude": "Gratitude & Thanksgiving",

  // Prayer point categories
  "daily": "Daily Prayer",
  "morning": "Morning Prayer",
  "evening": "Evening Prayer",
  "healing": "Healing Prayer",
  "financial": "Financial Blessing",
  "family": "Family & Marriage",
  "children": "Children & Youth",
  "warfare": "Spiritual Warfare",

  // Place regions
  "israel": "Israel",
  "jordan": "Jordan",
  "egypt": "Egypt",
  "galilee": "Galilee Region",
  "judea": "Judea Region",
  "jerusalem": "Jerusalem Area",
  "negev": "Negev Desert",
  "samaria": "Samaria",
};

/**
 * Normalizes a category slug to a human-readable label.
 * Uses a deterministic lookup table, falls back to title case.
 */
export function normalizeCategoryLabel(slug: string | null | undefined): string {
  if (!slug) return "General";

  const normalized = slug.toLowerCase().trim();

  // Check lookup table first
  if (CATEGORY_LABELS[normalized]) {
    return CATEGORY_LABELS[normalized];
  }

  // Fallback: convert slug to title case
  return normalized
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ============================================================================
// Related Links - Deterministic linking based on DB relations
// ============================================================================

export interface PlaceRecord {
  id: string;
  slug: string;
  name: string;
  region?: string | null;
  country?: string | null;
}

export interface SituationRecord {
  id: string;
  slug: string;
  title: string;
  category?: string | null;
}

export interface ProfessionRecord {
  id: string;
  slug: string;
  title: string;
}

export interface PrayerPointRecord {
  id: string;
  slug: string;
  title: string;
  category?: string | null;
}

export interface NameRecord {
  id: string;
  slug: string;
  name: string;
}

export interface ItineraryRecord {
  id: string;
  slug: string;
  title: string;
  region: string;
}

export type EntityRecord =
  | PlaceRecord
  | SituationRecord
  | ProfessionRecord
  | PrayerPointRecord
  | NameRecord
  | ItineraryRecord;

/**
 * Get related links for any entity type.
 * Uses deterministic heuristics based on DB relations and shared attributes.
 */
export async function getRelatedLinks(
  entityType: EntityType,
  record: EntityRecord
): Promise<RelatedLink[]> {
  switch (entityType) {
    case "place":
      return getRelatedLinksForPlace(record as PlaceRecord);
    case "situation":
      return getRelatedLinksForSituation(record as SituationRecord);
    case "profession":
      return getRelatedLinksForProfession(record as ProfessionRecord);
    case "prayer-point":
      return getRelatedLinksForPrayerPoint(record as PrayerPointRecord);
    case "name":
      return getRelatedLinksForName(record as NameRecord);
    case "itinerary":
      return getRelatedLinksForItinerary(record as ItineraryRecord);
    default:
      return [];
  }
}

/**
 * Related links for a Place:
 * - Other places in same region/country
 * - Relevant situations (e.g., places mentioned in situation verses)
 * - Related itineraries
 */
const getRelatedLinksForPlace = cache(async (place: PlaceRecord): Promise<RelatedLink[]> => {
  const prisma = await getPrisma();
  const links: RelatedLink[] = [];

  // 1. Related places by region (from PlaceRelation or same region)
  const relatedPlaces = await prisma.place.findMany({
    where: {
      status: "published",
      slug: { not: place.slug },
      OR: [
        place.region ? { region: place.region } : {},
        place.country ? { country: place.country } : {},
      ].filter((c) => Object.keys(c).length > 0),
    },
    select: { slug: true, name: true, description: true },
    take: 3,
    orderBy: { tourPriority: "desc" },
  });

  for (const p of relatedPlaces) {
    links.push({
      href: `/bible-places/${p.slug}`,
      title: p.name,
      description: p.description.slice(0, 100),
      type: "place",
    });
  }

  // 2. Situations that might relate to this place (by verse overlap)
  const placeVerseIds = await prisma.placeVerseMapping.findMany({
    where: { placeId: place.id },
    select: { verseId: true },
    take: 10,
  });

  if (placeVerseIds.length > 0) {
    const situationsFromVerses = await prisma.situation.findMany({
      where: {
        status: "published",
        verseMappings: {
          some: {
            verseId: { in: placeVerseIds.map((v) => v.verseId) },
          },
        },
      },
      select: { slug: true, title: true, metaDescription: true },
      take: 2,
    });

    for (const s of situationsFromVerses) {
      links.push({
        href: `/bible-verses-for/${s.slug}`,
        title: `Verses for ${s.title}`,
        description: s.metaDescription.slice(0, 100),
        type: "situation",
      });
    }
  }

  // 3. Itineraries that include this region
  if (place.region || place.country) {
    const regionConditions = [];
    if (place.region) {
      regionConditions.push({ region: { contains: place.region, mode: "insensitive" as const } });
    }
    if (place.country) {
      regionConditions.push({ region: { contains: place.country, mode: "insensitive" as const } });
    }

    const itineraries = regionConditions.length > 0
      ? await prisma.travelItinerary.findMany({
          where: {
            status: "published",
            OR: regionConditions,
          },
          select: { slug: true, title: true, metaDescription: true },
          take: 2,
        })
      : [];

    for (const it of itineraries) {
      links.push({
        href: `/bible-travel/${it.slug}`,
        title: it.title,
        description: it.metaDescription?.slice(0, 100),
        type: "itinerary",
      });
    }
  }

  return links.slice(0, 6); // Cap at 6 related links
});

/**
 * Related links for a Situation:
 * - Other situations in same category
 * - Related prayer points (by category match)
 * - Places mentioned in situation verses
 */
const getRelatedLinksForSituation = cache(async (situation: SituationRecord): Promise<RelatedLink[]> => {
  const prisma = await getPrisma();
  const links: RelatedLink[] = [];

  // 1. Related situations by category
  if (situation.category) {
    const relatedSituations = await prisma.situation.findMany({
      where: {
        status: "published",
        category: situation.category,
        slug: { not: situation.slug },
      },
      select: { slug: true, title: true, metaDescription: true },
      take: 3,
      orderBy: { updatedAt: "desc" },
    });

    for (const s of relatedSituations) {
      links.push({
        href: `/bible-verses-for/${s.slug}`,
        title: `Verses for ${s.title}`,
        description: s.metaDescription.slice(0, 100),
        type: "situation",
      });
    }
  }

  // 2. Prayer points with matching category or keyword overlap
  const categoryKeywords = situation.category?.split("-") || [];
  const titleKeywords = situation.title.toLowerCase().split(/\s+/).slice(0, 3);
  const searchKeywords = [...categoryKeywords, ...titleKeywords].filter(
    (k) => k.length > 3
  );

  if (searchKeywords.length > 0) {
    const prayerPoints = await prisma.prayerPoint.findMany({
      where: {
        status: "published",
        OR: searchKeywords.map((kw) => ({
          OR: [
            { category: { contains: kw, mode: "insensitive" as const } },
            { title: { contains: kw, mode: "insensitive" as const } },
          ],
        })),
      },
      select: { slug: true, title: true, description: true },
      take: 2,
    });

    for (const pp of prayerPoints) {
      links.push({
        href: `/prayer-points/${pp.slug}`,
        title: pp.title,
        description: pp.description.slice(0, 100),
        type: "prayer-point",
      });
    }
  }

  // 3. Places from verses in this situation
  const situationVerseIds = await prisma.situationVerseMapping.findMany({
    where: { situationId: situation.id },
    select: { verseId: true },
    take: 10,
  });

  if (situationVerseIds.length > 0) {
    const placesFromVerses = await prisma.place.findMany({
      where: {
        status: "published",
        verseMentions: {
          some: {
            verseId: { in: situationVerseIds.map((v) => v.verseId) },
          },
        },
      },
      select: { slug: true, name: true, description: true },
      take: 2,
    });

    for (const p of placesFromVerses) {
      links.push({
        href: `/bible-places/${p.slug}`,
        title: p.name,
        description: p.description.slice(0, 100),
        type: "place",
      });
    }
  }

  return links.slice(0, 6);
});

/**
 * Related links for a Profession:
 * - Other professions (alphabetically nearby or related)
 * - Situations that might apply (general work-related)
 */
const getRelatedLinksForProfession = cache(async (profession: ProfessionRecord): Promise<RelatedLink[]> => {
  const prisma = await getPrisma();
  const links: RelatedLink[] = [];

  // 1. Other professions
  const otherProfessions = await prisma.profession.findMany({
    where: {
      status: "published",
      slug: { not: profession.slug },
    },
    select: { slug: true, title: true, description: true },
    take: 3,
    orderBy: { title: "asc" },
  });

  for (const p of otherProfessions) {
    links.push({
      href: `/bible-verses-for/${p.slug}`,
      title: `Verses for ${p.title}`,
      description: p.description.slice(0, 100),
      type: "profession",
    });
  }

  // 2. Work-related situations
  const workSituations = await prisma.situation.findMany({
    where: {
      status: "published",
      OR: [
        { category: { contains: "work", mode: "insensitive" as const } },
        { category: { contains: "guidance", mode: "insensitive" as const } },
        { title: { contains: "stress", mode: "insensitive" as const } },
        { title: { contains: "wisdom", mode: "insensitive" as const } },
      ],
    },
    select: { slug: true, title: true, metaDescription: true },
    take: 3,
  });

  for (const s of workSituations) {
    links.push({
      href: `/bible-verses-for/${s.slug}`,
      title: `Verses for ${s.title}`,
      description: s.metaDescription.slice(0, 100),
      type: "situation",
    });
  }

  return links.slice(0, 6);
});

/**
 * Related links for a Prayer Point:
 * - Other prayer points in same category
 * - Related situations
 * - Places from associated verses
 */
const getRelatedLinksForPrayerPoint = cache(async (prayerPoint: PrayerPointRecord): Promise<RelatedLink[]> => {
  const prisma = await getPrisma();
  const links: RelatedLink[] = [];

  // 1. Related prayer points by category
  if (prayerPoint.category) {
    const relatedPP = await prisma.prayerPoint.findMany({
      where: {
        status: "published",
        category: prayerPoint.category,
        slug: { not: prayerPoint.slug },
      },
      select: { slug: true, title: true, description: true },
      take: 3,
      orderBy: { priority: "desc" },
    });

    for (const pp of relatedPP) {
      links.push({
        href: `/prayer-points/${pp.slug}`,
        title: pp.title,
        description: pp.description.slice(0, 100),
        type: "prayer-point",
      });
    }
  }

  // 2. Situations with keyword overlap
  const keywords = prayerPoint.title.toLowerCase().split(/\s+/).filter((k) => k.length > 3);

  if (keywords.length > 0) {
    const situations = await prisma.situation.findMany({
      where: {
        status: "published",
        OR: keywords.slice(0, 3).map((kw) => ({
          OR: [
            { title: { contains: kw, mode: "insensitive" as const } },
            { category: { contains: kw, mode: "insensitive" as const } },
          ],
        })),
      },
      select: { slug: true, title: true, metaDescription: true },
      take: 2,
    });

    for (const s of situations) {
      links.push({
        href: `/bible-verses-for/${s.slug}`,
        title: `Verses for ${s.title}`,
        description: s.metaDescription.slice(0, 100),
        type: "situation",
      });
    }
  }

  // 3. Places from verses
  const ppVerseIds = await prisma.prayerPointVerseMapping.findMany({
    where: { prayerPointId: prayerPoint.id },
    select: { verseId: true },
    take: 10,
  });

  if (ppVerseIds.length > 0) {
    const places = await prisma.place.findMany({
      where: {
        status: "published",
        verseMentions: {
          some: {
            verseId: { in: ppVerseIds.map((v) => v.verseId) },
          },
        },
      },
      select: { slug: true, name: true, description: true },
      take: 2,
    });

    for (const p of places) {
      links.push({
        href: `/bible-places/${p.slug}`,
        title: p.name,
        description: p.description.slice(0, 100),
        type: "place",
      });
    }
  }

  return links.slice(0, 6);
});

/**
 * Related links for a Name:
 * - Other names (by origin language or alphabetically)
 * - Situations from verses where name is mentioned
 * - Places from verses
 */
const getRelatedLinksForName = cache(async (name: NameRecord): Promise<RelatedLink[]> => {
  const prisma = await getPrisma();
  const links: RelatedLink[] = [];

  // 1. Related names
  const relatedNames = await prisma.name.findMany({
    where: {
      slug: { not: name.slug },
    },
    select: { slug: true, name: true, meaning: true },
    take: 3,
    orderBy: { name: "asc" },
  });

  for (const n of relatedNames) {
    links.push({
      href: `/meaning-of/${n.slug}/in-the-bible`,
      title: `Meaning of ${n.name}`,
      description: n.meaning.slice(0, 100),
      type: "name",
    });
  }

  // 2. Situations from name mention verses
  const nameMentionVerseIds = await prisma.nameMention.findMany({
    where: { nameId: name.id },
    select: { verseId: true },
    take: 10,
  });

  if (nameMentionVerseIds.length > 0) {
    const situations = await prisma.situation.findMany({
      where: {
        status: "published",
        verseMappings: {
          some: {
            verseId: { in: nameMentionVerseIds.map((v) => v.verseId) },
          },
        },
      },
      select: { slug: true, title: true, metaDescription: true },
      take: 2,
    });

    for (const s of situations) {
      links.push({
        href: `/bible-verses-for/${s.slug}`,
        title: `Verses for ${s.title}`,
        description: s.metaDescription.slice(0, 100),
        type: "situation",
      });
    }

    // 3. Places from same verses
    const places = await prisma.place.findMany({
      where: {
        status: "published",
        verseMentions: {
          some: {
            verseId: { in: nameMentionVerseIds.map((v) => v.verseId) },
          },
        },
      },
      select: { slug: true, name: true, description: true },
      take: 2,
    });

    for (const p of places) {
      links.push({
        href: `/bible-places/${p.slug}`,
        title: p.name,
        description: p.description.slice(0, 100),
        type: "place",
      });
    }
  }

  return links.slice(0, 6);
});

/**
 * Related links for an Itinerary:
 * - Places in the same region
 * - Other itineraries
 */
const getRelatedLinksForItinerary = cache(async (itinerary: ItineraryRecord): Promise<RelatedLink[]> => {
  const prisma = await getPrisma();
  const links: RelatedLink[] = [];

  // 1. Places in the same region
  const regionKeywords = itinerary.region.split(/[\s,]+/).filter((k) => k.length > 2);

  if (regionKeywords.length > 0) {
    const places = await prisma.place.findMany({
      where: {
        status: "published",
        OR: regionKeywords.map((kw) => ({
          OR: [
            { region: { contains: kw, mode: "insensitive" as const } },
            { country: { contains: kw, mode: "insensitive" as const } },
          ],
        })),
      },
      select: { slug: true, name: true, description: true },
      take: 4,
      orderBy: { tourPriority: "desc" },
    });

    for (const p of places) {
      links.push({
        href: `/bible-places/${p.slug}`,
        title: p.name,
        description: p.description.slice(0, 100),
        type: "place",
      });
    }
  }

  // 2. Other itineraries
  const otherItineraries = await prisma.travelItinerary.findMany({
    where: {
      status: "published",
      slug: { not: itinerary.slug },
    },
    select: { slug: true, title: true, metaDescription: true },
    take: 2,
    orderBy: { days: "asc" },
  });

  for (const it of otherItineraries) {
    links.push({
      href: `/bible-travel/${it.slug}`,
      title: it.title,
      description: it.metaDescription?.slice(0, 100),
      type: "itinerary",
    });
  }

  return links.slice(0, 6);
});

// ============================================================================
// Breadcrumb Generation
// ============================================================================

/**
 * Generate breadcrumbs for any page type.
 * Ensures proper depth hierarchy for SEO.
 */
export function generateBreadcrumbs(
  entityType: EntityType,
  title: string,
  slug: string
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Home", href: "/", position: 1 },
  ];

  switch (entityType) {
    case "place":
      breadcrumbs.push(
        { label: "Bible Places", href: "/bible-places", position: 2 },
        { label: title, href: `/bible-places/${slug}`, position: 3 }
      );
      break;
    case "situation":
      breadcrumbs.push(
        { label: "Bible Verses", href: "/situations", position: 2 },
        { label: title, href: `/bible-verses-for/${slug}`, position: 3 }
      );
      break;
    case "profession":
      breadcrumbs.push(
        { label: "Professions", href: "/professions", position: 2 },
        { label: title, href: `/bible-verses-for/${slug}`, position: 3 }
      );
      break;
    case "prayer-point":
      breadcrumbs.push(
        { label: "Prayer Points", href: "/prayer-points", position: 2 },
        { label: title, href: `/prayer-points/${slug}`, position: 3 }
      );
      break;
    case "name":
      breadcrumbs.push(
        { label: "Biblical Names", href: "/names", position: 2 },
        { label: title, href: `/meaning-of/${slug}/in-the-bible`, position: 3 }
      );
      break;
    case "itinerary":
      breadcrumbs.push(
        { label: "Bible Travel", href: "/bible-travel", position: 2 },
        { label: title, href: `/bible-travel/${slug}`, position: 3 }
      );
      break;
  }

  return breadcrumbs;
}

// ============================================================================
// Category Filters for Listing Pages
// ============================================================================

export interface CategoryFilter {
  key: string;
  label: string;
  count: number;
}

/**
 * Get category filters for situations listing page.
 */
export const getSituationCategories = cache(async (): Promise<CategoryFilter[]> => {
  const prisma = await getPrisma();

  const categories = await prisma.situation.groupBy({
    by: ["category"],
    where: { status: "published", category: { not: null } },
    _count: { category: true },
    orderBy: { _count: { category: "desc" } },
  });

  return categories
    .filter((c) => c.category)
    .map((c) => ({
      key: c.category!,
      label: normalizeCategoryLabel(c.category),
      count: c._count.category,
    }));
});

/**
 * Get category filters for prayer points listing page.
 */
export const getPrayerPointCategories = cache(async (): Promise<CategoryFilter[]> => {
  const prisma = await getPrisma();

  const categories = await prisma.prayerPoint.groupBy({
    by: ["category"],
    where: { status: "published", category: { not: null } },
    _count: { category: true },
    orderBy: { _count: { category: "desc" } },
  });

  return categories
    .filter((c) => c.category)
    .map((c) => ({
      key: c.category!,
      label: normalizeCategoryLabel(c.category),
      count: c._count.category,
    }));
});

/**
 * Get region filters for places listing page.
 */
export const getPlaceRegions = cache(async (): Promise<CategoryFilter[]> => {
  const prisma = await getPrisma();

  const regions = await prisma.place.groupBy({
    by: ["region"],
    where: { status: "published", region: { not: null } },
    _count: { region: true },
    orderBy: { _count: { region: "desc" } },
  });

  return regions
    .filter((r) => r.region)
    .map((r) => ({
      key: r.region!,
      label: normalizeCategoryLabel(r.region),
      count: r._count.region,
    }));
});

/**
 * Get region filters for itineraries listing page.
 */
export const getItineraryRegions = cache(async (): Promise<CategoryFilter[]> => {
  const prisma = await getPrisma();

  const regions = await prisma.travelItinerary.groupBy({
    by: ["region"],
    where: { status: "published" },
    _count: { region: true },
    orderBy: { _count: { region: "desc" } },
  });

  return regions.map((r) => ({
    key: r.region,
    label: normalizeCategoryLabel(r.region),
    count: r._count.region,
  }));
});

// ============================================================================
// Featured/Popular Items for Cross-Linking
// ============================================================================

/**
 * Get featured places for cross-linking on other pages.
 */
export const getFeaturedPlaces = cache(async (limit: number = 4): Promise<RelatedLink[]> => {
  const prisma = await getPrisma();

  const places = await prisma.place.findMany({
    where: { status: "published", tourHighlight: true },
    select: { slug: true, name: true, description: true },
    take: limit,
    orderBy: { tourPriority: "desc" },
  });

  return places.map((p) => ({
    href: `/bible-places/${p.slug}`,
    title: p.name,
    description: p.description.slice(0, 100),
    type: "place" as const,
  }));
});

/**
 * Get popular prayer points for cross-linking.
 */
export const getPopularPrayerPoints = cache(async (limit: number = 4): Promise<RelatedLink[]> => {
  const prisma = await getPrisma();

  const points = await prisma.prayerPoint.findMany({
    where: { status: "published", dailyRotation: true },
    select: { slug: true, title: true, description: true },
    take: limit,
    orderBy: { priority: "desc" },
  });

  return points.map((p) => ({
    href: `/prayer-points/${p.slug}`,
    title: p.title,
    description: p.description.slice(0, 100),
    type: "prayer-point" as const,
  }));
});

/**
 * Get popular situations for cross-linking.
 */
export const getPopularSituations = cache(async (limit: number = 4): Promise<RelatedLink[]> => {
  const prisma = await getPrisma();

  const situations = await prisma.situation.findMany({
    where: { status: "published" },
    select: { slug: true, title: true, metaDescription: true },
    take: limit,
    orderBy: { updatedAt: "desc" },
  });

  return situations.map((s) => ({
    href: `/bible-verses-for/${s.slug}`,
    title: `Verses for ${s.title}`,
    description: s.metaDescription.slice(0, 100),
    type: "situation" as const,
  }));
});

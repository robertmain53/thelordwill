export type BreadcrumbItem = {
  label: string;
  href: string;
  position: number;
};

export function buildBreadcrumbList(items: BreadcrumbItem[], siteBaseUrl: string) {
  const base = siteBaseUrl.endsWith("/") ? siteBaseUrl.slice(0, -1) : siteBaseUrl;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it) => ({
      "@type": "ListItem",
      position: it.position,
      name: it.label,
      item: it.href.startsWith("http") ? it.href : `${base}${it.href}`,
    })),
  };
}

type ArticleSchemaInput = {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  dateModifiedISO: string; // YYYY-MM-DD
  language: string; // e.g. "en"
  category?: string;
  aboutName?: string;
};

export function buildArticleSchema(input: ArticleSchemaInput) {
  const publisherUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thelordwill.com";

  const schema: {
    "@context": "https://schema.org";
    "@type": "Article";
    headline: string;
    description: string;
    mainEntityOfPage: {
      "@type": "WebPage";
      "@id": string;
    };
    publisher: {
      "@type": "Organization";
      name: string;
      url: string;
      logo: {
        "@type": "ImageObject";
        url: string;
      };
    };
    author: {
      "@type": "Organization";
      name: string;
    };
    dateModified: string;
    inLanguage: string;
    image?: string[];
    about?: {
      "@type": "Thing";
      name: string;
    };
    articleSection?: string;
  } = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": input.url,
    },
    publisher: {
      "@type": "Organization",
      name: "The Lord Will",
      url: publisherUrl,
      logo: {
        "@type": "ImageObject",
        url: `${publisherUrl}/logo.png`,
      },
    },
    author: {
      "@type": "Organization",
      name: "The Lord Will Editorial Team",
    },
    dateModified: input.dateModifiedISO,
    inLanguage: input.language,
  };

  if (input.imageUrl) schema.image = [input.imageUrl];

  if (input.category || input.aboutName) {
    schema.about = {
      "@type": "Thing",
      name: input.aboutName || input.category || input.title,
    };
  }

  if (input.category) {
    schema.articleSection = input.category;
  }

  return schema;
}

/**
 * Build Place JSON-LD schema for biblical place detail pages
 */
type PlaceSchemaInput = {
  name: string;
  description: string;
  url: string;
  imageUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
  country?: string | null;
  region?: string | null;
};

export function buildPlaceSchema(input: PlaceSchemaInput) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: input.name,
    description: input.description,
    url: input.url,
  };

  // Add geo coordinates if available
  if (input.latitude && input.longitude) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: input.latitude,
      longitude: input.longitude,
    };
  }

  // Add address/location info
  if (input.country || input.region) {
    schema.address = {
      "@type": "PostalAddress",
      ...(input.country && { addressCountry: input.country }),
      ...(input.region && { addressRegion: input.region }),
    };
  }

  // Add image if available
  if (input.imageUrl) {
    schema.image = input.imageUrl;
  }

  // Mark as a tourist destination for Holy Land tours
  schema.additionalType = "https://schema.org/TouristDestination";

  return schema;
}

// -----------------------------------------------------------------------------
// Entity-specific JSON-LD schemas (deterministic, no LLM)
// -----------------------------------------------------------------------------

/**
 * Build Situation entity schema
 * Uses Article + about pattern for situational content
 */
type SituationEntityInput = {
  id: string;
  slug: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  dateModifiedISO: string;
  category?: string | null;
  verseCount?: number;
};

export function buildSituationEntitySchema(input: SituationEntityInput) {
  const publisherUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thelordwill.com";

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": input.url,
    headline: `Bible Verses for ${input.title}`,
    description: input.description,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": input.url,
    },
    publisher: {
      "@type": "Organization",
      name: "The Lord Will",
      url: publisherUrl,
      logo: {
        "@type": "ImageObject",
        url: `${publisherUrl}/logo.png`,
      },
    },
    author: {
      "@type": "Organization",
      name: "The Lord Will Editorial Team",
    },
    dateModified: input.dateModifiedISO,
    inLanguage: "en",
    ...(input.imageUrl && { image: [input.imageUrl] }),
    about: {
      "@type": "Thing",
      name: input.title,
      description: `Biblical guidance and scripture for ${input.title.toLowerCase()}`,
    },
    articleSection: input.category || "Bible Verses",
    ...(input.verseCount && {
      hasPart: {
        "@type": "ItemList",
        numberOfItems: input.verseCount,
        itemListElement: {
          "@type": "ListItem",
          name: "Bible Verses",
        },
      },
    }),
  };
}

/**
 * Build PrayerPoint entity schema
 * Uses Article + about pattern for prayer-focused content
 */
type PrayerPointEntityInput = {
  id: string;
  slug: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  dateModifiedISO: string;
  category?: string | null;
  verseCount?: number;
};

export function buildPrayerPointEntitySchema(input: PrayerPointEntityInput) {
  const publisherUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thelordwill.com";

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": input.url,
    headline: `Prayer Points for ${input.title}`,
    description: input.description,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": input.url,
    },
    publisher: {
      "@type": "Organization",
      name: "The Lord Will",
      url: publisherUrl,
      logo: {
        "@type": "ImageObject",
        url: `${publisherUrl}/logo.png`,
      },
    },
    author: {
      "@type": "Organization",
      name: "The Lord Will Editorial Team",
    },
    dateModified: input.dateModifiedISO,
    inLanguage: "en",
    ...(input.imageUrl && { image: [input.imageUrl] }),
    about: {
      "@type": "Thing",
      name: input.title,
      description: `Prayer guidance and scripture for ${input.title.toLowerCase()}`,
    },
    articleSection: input.category || "Prayer Points",
    ...(input.verseCount && {
      hasPart: {
        "@type": "ItemList",
        numberOfItems: input.verseCount,
        itemListElement: {
          "@type": "ListItem",
          name: "Prayer Points",
        },
      },
    }),
  };
}

/**
 * Build Profession entity schema
 * Uses DefinedTerm for professional/occupational content
 */
type ProfessionEntityInput = {
  id: string;
  slug: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  dateModifiedISO: string;
};

export function buildProfessionEntitySchema(input: ProfessionEntityInput) {
  const publisherUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thelordwill.com";

  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "@id": input.url,
    name: input.title,
    description: input.description,
    url: input.url,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "Biblical Professions",
      url: `${publisherUrl}/professions`,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": input.url,
      dateModified: input.dateModifiedISO,
      publisher: {
        "@type": "Organization",
        name: "The Lord Will",
        url: publisherUrl,
      },
    },
    ...(input.imageUrl && { image: input.imageUrl }),
  };
}

/**
 * Build Place entity schema (enhanced version with entity identity)
 */
type PlaceEntityInput = {
  id: string;
  slug: string;
  name: string;
  description: string;
  url: string;
  imageUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
  country?: string | null;
  region?: string | null;
  dateModifiedISO: string;
  verseCount?: number;
};

export function buildPlaceEntitySchema(input: PlaceEntityInput) {
  const publisherUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thelordwill.com";

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["Place", "TouristDestination"],
    "@id": input.url,
    name: input.name,
    description: input.description,
    url: input.url,
  };

  if (input.latitude && input.longitude) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: input.latitude,
      longitude: input.longitude,
    };
  }

  if (input.country || input.region) {
    schema.address = {
      "@type": "PostalAddress",
      ...(input.country && { addressCountry: input.country }),
      ...(input.region && { addressRegion: input.region }),
    };
  }

  if (input.imageUrl) {
    schema.image = input.imageUrl;
  }

  schema.mainEntityOfPage = {
    "@type": "WebPage",
    "@id": input.url,
    dateModified: input.dateModifiedISO,
    publisher: {
      "@type": "Organization",
      name: "The Lord Will",
      url: publisherUrl,
    },
  };

  schema.touristType = ["Christian Pilgrim", "Religious Tourist"];

  if (input.verseCount) {
    schema.additionalProperty = {
      "@type": "PropertyValue",
      name: "Biblical Verse References",
      value: input.verseCount,
    };
  }

  return schema;
}

/**
 * Build Travel Itinerary entity schema
 * Uses TouristTrip schema for travel itineraries
 */
type ItineraryEntityInput = {
  id: string;
  slug: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  dateModifiedISO: string;
  duration?: number | null;
  dayCount?: number;
};

export function buildItineraryEntitySchema(input: ItineraryEntityInput) {
  const publisherUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thelordwill.com";

  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "@id": input.url,
    name: input.title,
    description: input.description,
    url: input.url,
    ...(input.imageUrl && { image: input.imageUrl }),
    ...(input.duration && {
      duration: `P${input.duration}D`,
    }),
    ...(input.dayCount && {
      itinerary: {
        "@type": "ItemList",
        numberOfItems: input.dayCount,
        itemListElement: {
          "@type": "ListItem",
          name: "Day Plan",
        },
      },
    }),
    touristType: ["Christian Pilgrim", "Religious Tourist"],
    provider: {
      "@type": "Organization",
      name: "The Lord Will",
      url: publisherUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": input.url,
      dateModified: input.dateModifiedISO,
    },
  };
}

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

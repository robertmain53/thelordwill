import { buildBreadcrumbList, type BreadcrumbItem } from "./jsonld";

export interface VerseJsonLdInput {
  canonicalUrl: string;
  title: string;
  description: string;
  reference: string;
  verseText: string;
  bookName: string;
  testament?: string;
  genre?: string;
  dateModifiedISO: string;
  language: string;
  breadcrumbItems: BreadcrumbItem[];
  referencingUrls?: string[];
}

const DEFAULT_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thelordwill.com";

export function buildVerseJsonLd(input: VerseJsonLdInput) {
  const breadcrumb = buildBreadcrumbList(input.breadcrumbItems, DEFAULT_SITE_URL);

  const verseEntity: Record<string, unknown> = {
    "@type": "CreativeWork",
    "@id": `${input.canonicalUrl}#verse`,
    name: input.reference,
    url: input.canonicalUrl,
    text: input.verseText,
    description: input.description,
    about: {
      "@type": "Thing",
      name: input.bookName,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": input.canonicalUrl,
    },
    isPartOf: {
      "@type": "CreativeWorkSeries",
      name: `${input.bookName} Bible`,
    },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Reference",
        value: input.reference,
      },
      ...(input.testament
        ? [
            {
              "@type": "PropertyValue",
              name: "Testament",
              value: input.testament,
            },
          ]
        : []),
      ...(input.genre
        ? [
            {
              "@type": "PropertyValue",
              name: "Genre",
              value: input.genre,
            },
          ]
        : []),
    ],
  };

  if (input.referencingUrls && input.referencingUrls.length > 0) {
    const references = input.referencingUrls.map((url) => ({
      "@type": "CreativeWork",
      "@id": url,
      url,
    }));

    verseEntity.subjectOf = references;
    verseEntity.isReferencedBy = references;
    verseEntity.citation = references;
    verseEntity.mentions = references;
  }

  const webPage: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": input.canonicalUrl,
    url: input.canonicalUrl,
    name: input.title,
    headline: input.title,
    description: input.description,
    dateModified: input.dateModifiedISO,
    inLanguage: input.language,
  };

  return {
    "@context": "https://schema.org",
    "@graph": [breadcrumb, webPage, verseEntity],
  };
}

// lib/seo/prayerpoint-jsonld.ts

export function buildPrayerPointArticleSchema(opts: {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  dateModifiedISO: string;
  category: string;
  aboutName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    mainEntityOfPage: { "@type": "WebPage", "@id": opts.url },
    author: { "@type": "Organization", name: "The Lord Will" },
    publisher: {
      "@type": "Organization",
      name: "The Lord Will",
      logo: { "@type": "ImageObject", url: `${new URL(opts.url).origin}/logo.png` },
    },
    dateModified: opts.dateModifiedISO,
    image: opts.imageUrl ? [opts.imageUrl] : undefined,
    articleSection: opts.category,
    about: { "@type": "Thing", name: opts.aboutName },
    inLanguage: "en",
  };
}

export function buildVerseClustersItemListSchema(opts: {
  pageUrl: string;
  clusters: Array<{ title: string; verses: Array<{ reference: string }> }>;
}) {
  const items = opts.clusters.flatMap((c) =>
    c.verses.map((v) => ({
      "@type": "ListItem",
      name: `${v.reference} — ${c.title}`,
      url: opts.pageUrl + `#cluster-${slugifyAnchor(c.title)}`,
    }))
  );

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Scripture clusters used on this page",
    itemListElement: items,
  };
}

export function buildFAQPageSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

function slugifyAnchor(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

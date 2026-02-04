interface VerseSummaryProps {
  summary: string;
  reference: string;
  canonicalUrl: string;
}

const DEFAULT_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thelordwill.com";

export function VerseSummary({ summary, reference, canonicalUrl }: VerseSummaryProps) {
  if (!summary) {
    return null;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": `Verse summary: ${reference}`,
    "description": summary,
    "url": canonicalUrl,
    "about": {
      "@type": "CreativeWork",
      "name": reference,
    },
    "publisher": {
      "@type": "Organization",
      "name": "The Lord Will",
      "url": DEFAULT_SITE_URL,
    },
  };

  return (
    <section className="space-y-3 border border-primary/20 rounded-2xl bg-primary/5 p-5 text-sm text-gray-700">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Verse summary</h3>
        <span className="text-xs font-mono uppercase tracking-wide text-primary">Citation-ready</span>
      </div>
      <p>{summary}</p>
      <p className="sr-only">Summary for screen readers: {summary}</p>
      <p className="text-xs text-muted-foreground">
        For more context, visit{" "}
        <a href={canonicalUrl} className="font-semibold text-primary hover:underline">
          this verse page
        </a>
        .
      </p>
    </section>
  );
}

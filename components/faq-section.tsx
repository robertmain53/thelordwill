/**
 * FAQ Section with JSON-LD Schema
 * Server component - no client-side JS
 */

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQItem[];
  pageUrl: string;

  /** Optional presentation overrides */
  title?: string;
  description?: string;
  /** If true, suppress the visible heading block and render only Q/A list */
  compact?: boolean;
}

export function FAQSection({
  faqs,
  pageUrl,
  title = "Frequently Asked Questions",
  description,
  compact = false,
}: FAQSectionProps) {
  if (!faqs || faqs.length === 0) return null;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <section className="space-y-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {!compact && (
        <header className="space-y-2">
          <h2 className="text-2xl font-bold">{title}</h2>
          {description ? (
            <p className="text-muted-foreground">{description}</p>
          ) : null}
        </header>
      )}

      <div className="space-y-3">
        {faqs.map((faq) => (
          <details key={faq.question} className="border rounded-lg bg-card p-4">
            <summary className="cursor-pointer font-semibold">{faq.question}</summary>
            <div className="mt-2 text-muted-foreground leading-relaxed">{faq.answer}</div>
          </details>
        ))}
      </div>

      {/* Optional canonical reference for internal QA/debugging */}
      <meta name="tlw:faqPage" content={pageUrl} />
    </section>
  );
}

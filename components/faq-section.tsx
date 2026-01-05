/**
 * FAQ Section with JSON-LD Schema
 * Programmatically generated FAQs with structured data for SEO
 * Server component - no client-side JS
 */

import { getCanonicalUrl } from '@/lib/utils';

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQItem[];
  pageUrl: string;
}

export function FAQSection({ faqs, pageUrl }: FAQSectionProps) {
  if (faqs.length === 0) {
    return null;
  }

  // Generate JSON-LD schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Visual FAQ Display */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground">
            Common questions about these Bible verses
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border-l-4 border-primary pl-4 py-2"
              itemScope
              itemType="https://schema.org/Question"
            >
              <h3
                className="text-lg font-semibold mb-2"
                itemProp="name"
              >
                {faq.question}
              </h3>
              <div
                className="text-muted-foreground leading-relaxed"
                itemScope
                itemType="https://schema.org/Answer"
                itemProp="acceptedAnswer"
              >
                <div itemProp="text">{faq.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/**
 * Accordion-style FAQ (client component version if needed)
 */
export function FAQAccordion({ faqs, pageUrl }: FAQSectionProps) {
  // This would use 'use client' and add interactive accordion functionality
  // For now, keeping it server-side for performance
  return <FAQSection faqs={faqs} pageUrl={pageUrl} />;
}

/**
 * Generate FAQ schema only (for custom layouts)
 */
export function FAQSchema({ faqs }: { faqs: FAQItem[] }) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
}

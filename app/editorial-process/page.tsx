import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Editorial Process - The Lord Will",
  description:
    "Our comprehensive editorial process ensures biblical accuracy, transparency, and quality across 100,000+ pages. Learn how we source, verify, and present Scripture.",
  alternates: {
    canonical: getCanonicalUrl("/editorial-process"),
  },
  openGraph: {
    title: "Editorial Process - The Lord Will",
    description:
      "Our comprehensive editorial process ensures biblical accuracy, transparency, and quality across 100,000+ pages. Learn how we source, verify, and present Scripture.",
    url: getCanonicalUrl("/editorial-process"),
    type: "website",
  },
};

export default function EditorialProcessPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Editorial Process",
    description:
      "Documentation of The Lord Will's editorial standards, content sourcing, verification processes, and quality control measures.",
    publisher: {
      "@type": "Organization",
      name: "The Lord Will",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main className="min-h-screen py-12 px-4">
        <article className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <header className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">Editorial Process</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              How we ensure accuracy, transparency, and quality across 100,000+ pages
              of biblical content.
            </p>
          </header>

          {/* Table of Contents */}
          <nav className="bg-muted/30 border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">On This Page</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#data-sourcing" className="text-primary hover:underline">
                  1. Data Sourcing & Verification
                </a>
              </li>
              <li>
                <a href="#relevance-scoring" className="text-primary hover:underline">
                  2. Relevance Scoring Methodology
                </a>
              </li>
              <li>
                <a href="#content-generation" className="text-primary hover:underline">
                  3. AI Content Generation
                </a>
              </li>
              <li>
                <a href="#quality-control" className="text-primary hover:underline">
                  4. Quality Control Measures
                </a>
              </li>
              <li>
                <a href="#translation-selection" className="text-primary hover:underline">
                  5. Translation Selection
                </a>
              </li>
              <li>
                <a href="#strongs-integration" className="text-primary hover:underline">
                  6. Strong's Concordance Integration
                </a>
              </li>
              <li>
                <a href="#updates" className="text-primary hover:underline">
                  7. Updates & Corrections
                </a>
              </li>
            </ul>
          </nav>

          {/* Section 1: Data Sourcing */}
          <section id="data-sourcing" className="space-y-4 scroll-mt-8">
            <h2 className="text-3xl font-bold">1. Data Sourcing & Verification</h2>

            <div className="space-y-6">
              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-xl font-semibold mb-2">Biblical Text Sources</h3>
                <p className="text-muted-foreground mb-4">
                  All Scripture text is sourced from the{" "}
                  <a
                    href="https://bolls.life/api/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Bolls Bible API
                  </a>
                  , a public Bible database that provides:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>All 66 books of the Protestant canon</li>
                  <li>31,102 verses across 5 English translations</li>
                  <li>Structured JSON data for programmatic access</li>
                  <li>Verified public domain translations</li>
                </ul>
              </div>

              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-xl font-semibold mb-2">Verification Process</h3>
                <p className="text-muted-foreground mb-4">
                  Each verse undergoes automated verification:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                  <li>
                    <strong>Book/Chapter/Verse validation:</strong> Ensures references match canonical structure
                    (e.g., Genesis has 50 chapters, not 51)
                  </li>
                  <li>
                    <strong>Duplicate detection:</strong> Prevents duplicate entries using 8-digit verse IDs
                    (BBCCCVVV format)
                  </li>
                  <li>
                    <strong>Text integrity:</strong> Flags missing translations or corrupted data
                  </li>
                  <li>
                    <strong>Cross-reference validation:</strong> Confirms verse content matches across sources
                  </li>
                </ol>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Important:</strong> We do NOT modify Scripture text. All verses are presented
                  exactly as they appear in their source translations. Any formatting changes are limited
                  to whitespace normalization for consistent display.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Relevance Scoring */}
          <section id="relevance-scoring" className="space-y-4 scroll-mt-8">
            <h2 className="text-3xl font-bold">2. Relevance Scoring Methodology</h2>

            <div className="space-y-4">
              <p className="text-lg text-muted-foreground">
                Each situation-to-verse connection receives a relevance score from 1-100 based on:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 bg-card">
                  <h3 className="font-semibold mb-2">Thematic Analysis (40%)</h3>
                  <p className="text-sm text-muted-foreground">
                    How directly the verse addresses the situation (e.g., "comfort" verses for anxiety)
                  </p>
                </div>

                <div className="border rounded-lg p-4 bg-card">
                  <h3 className="font-semibold mb-2">Keyword Matching (30%)</h3>
                  <p className="text-sm text-muted-foreground">
                    Presence of situation-specific words in Hebrew/Greek original text
                  </p>
                </div>

                <div className="border rounded-lg p-4 bg-card">
                  <h3 className="font-semibold mb-2">Cross-References (20%)</h3>
                  <p className="text-sm text-muted-foreground">
                    Theological connections identified in study Bibles and commentaries
                  </p>
                </div>

                <div className="border rounded-lg p-4 bg-card">
                  <h3 className="font-semibold mb-2">Community Input (10%)</h3>
                  <p className="text-sm text-muted-foreground">
                    Verification from biblical scholars and user feedback (future feature)
                  </p>
                </div>
              </div>

              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-lg font-semibold mb-2">Score Ranges</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li><strong>90-100:</strong> Primary verses (directly addresses situation)</li>
                  <li><strong>70-89:</strong> Highly relevant (clear thematic connection)</li>
                  <li><strong>50-69:</strong> Moderately relevant (indirect or principle-based)</li>
                  <li><strong>30-49:</strong> Tangentially relevant (broader context)</li>
                  <li><strong>1-29:</strong> Minimal relevance (excluded from display)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3: AI Content Generation */}
          <section id="content-generation" className="space-y-4 scroll-mt-8">
            <h2 className="text-3xl font-bold">3. AI Content Generation</h2>

            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Transparency Disclosure:</strong> This site uses AI (Large Language Models)
                  to generate introductory content and FAQs. All AI-generated content is clearly marked
                  and supplemented with direct Scripture quotations.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-xl font-semibold mb-2">What AI Generates</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>300-word introductions providing context for each situation</li>
                  <li>5 frequently asked questions (FAQs) with biblically-grounded answers</li>
                  <li>Contextual connections between names and situations</li>
                </ul>
              </div>

              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-xl font-semibold mb-2">Quality Safeguards</h3>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                  <li>
                    <strong>Structured Prompts:</strong> AI receives specific verses and context,
                    preventing hallucination of non-existent Scripture
                  </li>
                  <li>
                    <strong>Uniqueness Validation:</strong> All AI content must be &gt;60% unique
                    (not templated or boilerplate)
                  </li>
                  <li>
                    <strong>Word Count Requirements:</strong> Ensures substantive content (300+ words)
                  </li>
                  <li>
                    <strong>Factual Grounding:</strong> AI is instructed to reference only the provided
                    verses, not external sources
                  </li>
                  <li>
                    <strong>Human Review:</strong> Random sampling of AI content for theological accuracy
                    (ongoing process)
                  </li>
                </ol>
              </div>

              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-xl font-semibold mb-2">What AI Does NOT Generate</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Scripture text (always from verified sources)</li>
                  <li>Strong's Concordance data (from public domain lexicon)</li>
                  <li>Relevance scores (from documented methodology)</li>
                  <li>Doctrinal statements or theological positions</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4: Quality Control */}
          <section id="quality-control" className="space-y-4 scroll-mt-8">
            <h2 className="text-3xl font-bold">4. Quality Control Measures</h2>

            <div className="space-y-4">
              <p className="text-lg text-muted-foreground">
                Every page undergoes automated quality validation before publication:
              </p>

              <div className="grid gap-4">
                <div className="border rounded-lg p-4 bg-card">
                  <h3 className="font-semibold mb-2">Content Completeness</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc list-inside">
                    <li>Minimum 1,400 words total content</li>
                    <li>5+ verse references with relevance scores</li>
                    <li>At least 3 Strong's Concordance entries (where applicable)</li>
                    <li>5 FAQ items with substantive answers</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4 bg-card">
                  <h3 className="font-semibold mb-2">Link Density</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc list-inside">
                    <li>5-15 internal links per page (optimal for SEO)</li>
                    <li>Thematic clustering (related names and situations)</li>
                    <li>Breadcrumb navigation with Schema.org markup</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4 bg-card">
                  <h3 className="font-semibold mb-2">Technical SEO</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc list-inside">
                    <li>Canonical URLs for all pages</li>
                    <li>JSON-LD structured data (Article, FAQPage, BreadcrumbList)</li>
                    <li>OpenGraph and Twitter meta tags</li>
                    <li>Unique meta descriptions (no duplicates)</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4 bg-card">
                  <h3 className="font-semibold mb-2">Performance</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc list-inside">
                    <li>Server-side rendering (SSR) for instant page loads</li>
                    <li>Minimal client-side JavaScript (Interactive Islands)</li>
                    <li>Target: LCP &lt; 2.0s, INP &lt; 200ms</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Translation Selection */}
          <section id="translation-selection" className="space-y-4 scroll-mt-8">
            <h2 className="text-3xl font-bold">5. Translation Selection</h2>

            <div className="space-y-4">
              <p className="text-lg text-muted-foreground">
                We provide 5 English translations for comparison, chosen for:
              </p>

              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-6">
                  <h3 className="text-lg font-semibold">King James Version (KJV, 1611)</h3>
                  <p className="text-sm text-muted-foreground">
                    Historical significance, poetic language, widely quoted. Public domain.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-6">
                  <h3 className="text-lg font-semibold">World English Bible (WEB, 2000)</h3>
                  <p className="text-sm text-muted-foreground">
                    Modern English, formal equivalence, free from copyright. Based on ASV/Majority Text.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-6">
                  <h3 className="text-lg font-semibold">American Standard Version (ASV, 1901)</h3>
                  <p className="text-sm text-muted-foreground">
                    Scholarly accuracy, literal translation. Public domain.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-6">
                  <h3 className="text-lg font-semibold">Bible in Basic English (BBE, 1965)</h3>
                  <p className="text-sm text-muted-foreground">
                    Simple vocabulary (850 basic words), accessibility for ESL readers. Public domain.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-6">
                  <h3 className="text-lg font-semibold">Young's Literal Translation (YLT, 1898)</h3>
                  <p className="text-sm text-muted-foreground">
                    Preserves Hebrew/Greek grammar, word order. Useful for linguistic study. Public domain.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Strong's Integration */}
          <section id="strongs-integration" className="space-y-4 scroll-mt-8">
            <h2 className="text-3xl font-bold">6. Strong's Concordance Integration</h2>

            <div className="space-y-4">
              <p className="text-lg text-muted-foreground">
                James Strong's Exhaustive Concordance (1890) assigns unique numbers to every original
                Hebrew and Greek word in Scripture. We integrate this data to:
              </p>

              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Display original Hebrew/Greek words for key terms</li>
                <li>Provide transliterations for pronunciation</li>
                <li>Show concise definitions from Strong's lexicon</li>
                <li>Link words across verses for thematic study</li>
              </ul>

              <div className="bg-muted/30 border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Example:</strong> In Philippians 4:6 ("Be anxious for nothing"), the Greek word
                  for "anxious" is μεριμνάω (merimnáō, Strong's G3309), meaning "to be troubled with cares."
                  This nuance helps readers understand the verse's depth.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-lg font-semibold mb-2">Selection Criteria</h3>
                <p className="text-muted-foreground">
                  For each primary verse, we display the top 3 Strong's entries based on:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                  <li>Theological significance (key concepts like "love," "faith," "righteousness")</li>
                  <li>Relevance to the situation being addressed</li>
                  <li>Clarity of original language insight</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Section 7: Updates & Corrections */}
          <section id="updates" className="space-y-4 scroll-mt-8">
            <h2 className="text-3xl font-bold">7. Updates & Corrections</h2>

            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-xl font-semibold mb-2">Update Frequency</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>Scripture Text:</strong> Never updated (locked to source translations)</li>
                  <li><strong>Relevance Scores:</strong> Reviewed quarterly, updated as needed</li>
                  <li><strong>AI Content:</strong> Regenerated when quality issues are flagged</li>
                  <li><strong>Strong's Data:</strong> Static (public domain lexicon)</li>
                  <li><strong>Links/Navigation:</strong> Updated dynamically as new content is added</li>
                </ul>
              </div>

              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-xl font-semibold mb-2">Correction Process</h3>
                <p className="text-muted-foreground mb-4">
                  If you notice an error, please report it to{" "}
                  <a href="mailto:corrections@thelordwill.com" className="text-primary hover:underline">
                    corrections@thelordwill.com
                  </a>{" "}
                  with:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Page URL</li>
                  <li>Description of the issue</li>
                  <li>Source citation for correction (if applicable)</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  We review all submissions within 7 business days and update content accordingly.
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Version Tracking:</strong> All pages include lastmod timestamps in our sitemap,
                  allowing search engines and users to see when content was last updated.
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <section className="bg-gradient-to-r from-primary/10 to-transparent border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-3">Our Commitment</h2>
            <p className="text-muted-foreground mb-4">
              We are committed to maintaining the highest standards of accuracy, transparency,
              and biblical fidelity. This editorial process is regularly reviewed and updated
              to reflect best practices in biblical scholarship and digital publishing.
            </p>
            <p className="text-sm text-muted-foreground">
              Questions about our editorial process?{" "}
              <Link href="/about" className="text-primary hover:underline">
                Learn more about us
              </Link>{" "}
              or{" "}
              <a href="mailto:contact@thelordwill.com" className="text-primary hover:underline">
                contact our team
              </a>
              .
            </p>
          </section>
        </article>
      </main>
    </>
  );
}

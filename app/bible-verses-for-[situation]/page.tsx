import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCanonicalUrl, titleCase } from "@/lib/utils";
import {
  getSituationWithVerses,
  getTopStrongsFromVerse,
  formatVerseReference,
} from "@/lib/db/situation-queries";
import {
  generateIntroduction,
  generateFAQs,
  validateContentQuality,
} from "@/lib/content/generator";
import {
  TranslationComparison,
  prepareTranslations,
} from "@/components/translation-comparison";
import { StrongsDisplay } from "@/components/strongs-display";
import { FAQSection } from "@/components/faq-section";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { InternalLinks, ThematicCluster } from "@/components/internal-links";
import {
  generateLinkingStrategy,
  generateBreadcrumbs,
  validateLinkingDensity,
  getTrendingNames,
} from "@/lib/seo/internal-linking";

// Force SSR - disable static generation
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    situation: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { situation } = await params;
  if (!process.env.DATABASE_URL) {
    const title = `Bible Verses for ${titleCase(situation)}`;
    const canonicalUrl = getCanonicalUrl(`/bible-verses-for-${situation}`);

    return {
      title,
      alternates: {
        canonical: canonicalUrl,
      },
    };
  }

  const data = await getSituationWithVerses(situation, 10);

  if (!data) {
    return {
      title: "Situation Not Found",
    };
  }

  const title = `Bible Verses for ${data.title} - Scripture & Comfort`;
  const description = data.metaDescription;
  const canonicalUrl = getCanonicalUrl(`/bible-verses-for-${situation}`);
  const imageUrl = getCanonicalUrl(`/api/og?situation=${encodeURIComponent(data.title)}&type=situation`);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "article",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Bible Verses for ${data.title}`,
        },
      ],
      siteName: "The Lord Will",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    keywords: [
      `Bible verses for ${data.title}`,
      `Scripture for ${data.title}`,
      `${data.title} Bible verses`,
      "Bible verses",
      "Christian comfort",
      "Biblical guidance",
      "original Hebrew Greek",
      "Strong's Concordance",
    ],
  };
}

export default async function SituationVersesPage({ params }: PageProps) {
  const { situation } = await params;
  if (!process.env.DATABASE_URL) {
    const title = titleCase(situation);

    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Bible Verses for {title}</h1>
        <p className="mt-4 text-muted-foreground">
          Content will be available once the database is connected.
        </p>
      </main>
    );
  }

  const data = await getSituationWithVerses(situation, 10);

  if (!data) {
    notFound();
  }

  // Get primary verse for detailed analysis
  const primaryMapping = data.verseMappings[0];
  if (!primaryMapping) {
    notFound();
  }

  const primaryVerse = primaryMapping.verse;
  const primaryReference = formatVerseReference(primaryVerse);

  // Get top Strong's numbers from primary verse
  const topStrongs = getTopStrongsFromVerse(primaryVerse, 3);

  // Prepare data for AI generation
  const versesForGeneration = data.verseMappings.slice(0, 5).map((mapping) => ({
    reference: formatVerseReference(mapping.verse),
    text: mapping.verse.textKjv || mapping.verse.textWeb || '',
  }));

  // Generate AI-powered introduction
  const introduction = await generateIntroduction({
    situation: data.title,
    verses: versesForGeneration,
    targetWordCount: 300,
  });

  // Generate FAQs
  const faqs = await generateFAQs(data.title, versesForGeneration);

  // Generate breadcrumbs
  const breadcrumbs = generateBreadcrumbs('situation', data.title, situation);

  // Generate internal linking strategy
  const linkingStrategy = await generateLinkingStrategy('situation', situation, breadcrumbs);

  // Get trending names for additional links
  const trendingNames = await getTrendingNames(2);

  // Validate linking density
  const linkingDensity = validateLinkingDensity(linkingStrategy.totalLinks);

  // Validate content quality
  const qualityReport = validateContentQuality({
    introduction: introduction.content,
    translationCount: prepareTranslations(primaryVerse).filter(t => t.text).length,
    strongsCount: topStrongs.length,
    faqCount: faqs.length,
  });

  // Log quality issues in development
  if (!qualityReport.meetsMinimumStandards && process.env.NODE_ENV === 'development') {
    console.warn(`Content quality issues for ${situation}:`, qualityReport.issues);
  }

  // JSON-LD Schema for the specific situation page
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Bible Verses for ${data.title}`,
    description: data.metaDescription,
    author: {
      "@type": "Organization",
      name: "The Lord Will",
    },
    publisher: {
      "@type": "Organization",
      name: "The Lord Will",
      logo: {
        "@type": "ImageObject",
        url: getCanonicalUrl("/logo.png"),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": getCanonicalUrl(`/bible-verses-for-${situation}`),
    },
    about: {
      "@type": "Thing",
      name: data.title,
    },
    wordCount: introduction.wordCount,
  };

  const canonicalUrl = getCanonicalUrl(`/bible-verses-for-${situation}`);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main className="min-h-screen py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Desktop: Two-column layout | Mobile: Single column */}
          <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-8">
            {/* Main Content */}
            <article className="space-y-12">
              {/* Header */}
              <header className="space-y-4">
                {/* Breadcrumbs with Schema.org markup */}
                <Breadcrumbs items={breadcrumbs} />

                <h1 className="text-4xl md:text-5xl font-bold">
                  Bible Verses for {data.title}
                </h1>

                <p className="text-xl text-muted-foreground leading-relaxed">
                  {data.metaDescription}
                </p>

                {/* Content quality & linking density badges (dev only) */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="flex gap-4 text-xs">
                    <div className="flex gap-2">
                      <span className={qualityReport.meetsMinimumStandards ? 'text-green-600' : 'text-red-600'}>
                        Quality: {qualityReport.meetsMinimumStandards ? '✓' : '✗'}
                      </span>
                      <span>Words: {qualityReport.wordCount}</span>
                      <span>Uniqueness: {qualityReport.uniquenessScore}%</span>
                    </div>
                    <div className={linkingDensity.isValid ? 'text-green-600' : 'text-red-600'}>
                      Links: {linkingStrategy.totalLinks} ({linkingDensity.isValid ? '✓' : '✗'})
                    </div>
                  </div>
                )}
              </header>

              {/* Ad Slot 1: ATF Leaderboard (728x90 or responsive) */}
              <div
                id="atf-leaderboard"
                className="min-h-[90px] flex items-center justify-center bg-muted/30 border border-dashed border-muted-foreground/20 rounded"
                aria-label="Advertisement"
              >
                {process.env.NODE_ENV === 'development' && (
                  <span className="text-xs text-muted-foreground">ATF Leaderboard Ad (728x90)</span>
                )}
              </div>

          {/* AI-Generated Introduction (300+ words) */}
          <section className="prose prose-lg max-w-none">
            <div className="bg-gradient-to-r from-primary/5 to-transparent border-l-4 border-primary pl-6 py-4">
              <p className="text-lg leading-relaxed text-foreground">
                {introduction.content}
              </p>
            </div>
          </section>

          {/* Primary Verse - Translation Comparison */}
          <section className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Primary Verse: {primaryReference}
              </h2>
              <p className="text-muted-foreground">
                Compare multiple translations for deeper linguistic insight
              </p>
            </div>

            <TranslationComparison
              reference={primaryReference}
              translations={prepareTranslations(primaryVerse)}
              defaultVersion="KJV"
              layout="tabs"
            />

            {/* Relevance note if available */}
            {primaryMapping.manualNote && (
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Note:</strong> {primaryMapping.manualNote}
                </p>
              </div>
            )}
          </section>

          {/* Strong's Numbers - Original Language */}
          {topStrongs.length > 0 && (
            <section>
              <StrongsDisplay entries={topStrongs} reference={primaryReference} />
            </section>
          )}

              {/* Additional Verses */}
              {data.verseMappings.length > 1 && (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">
                      More Verses About {data.title}
                    </h2>
                    <p className="text-muted-foreground">
                      Additional Scripture passages ranked by relevance
                    </p>
                  </div>

                  <div className="space-y-6">
                    {data.verseMappings.slice(1).map((mapping, index) => {
                      const verse = mapping.verse;
                      const reference = formatVerseReference(verse);

                      return (
                        <>
                          <div
                            key={verse.id}
                            className="border rounded-lg p-6 bg-card hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-lg font-semibold">{reference}</h3>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  Relevance: {mapping.relevanceScore}/100
                                </span>
                              </div>
                            </div>

                            <blockquote className="text-muted-foreground leading-relaxed mb-4 italic border-l-2 border-primary pl-4">
                              "{verse.textKjv || verse.textWeb}"
                            </blockquote>

                            {/* Show alternate translations for high-relevance verses */}
                            {mapping.relevanceScore >= 80 && index < 2 && (
                              <details className="mt-4">
                                <summary className="text-sm text-primary cursor-pointer hover:underline">
                                  Compare translations
                                </summary>
                                <div className="mt-4">
                                  <TranslationComparison
                                    reference={reference}
                                    translations={prepareTranslations(verse)}
                                    layout="grid"
                                  />
                                </div>
                              </details>
                            )}
                          </div>

                          {/* Ad Slot 2: Mid-Content Rectangle (300x250) after 3rd verse */}
                          {index === 2 && (
                            <div
                              id="mid-content-rect"
                              className="min-h-[250px] flex items-center justify-center bg-muted/30 border border-dashed border-muted-foreground/20 rounded my-6"
                              aria-label="Advertisement"
                            >
                              {process.env.NODE_ENV === 'development' && (
                                <span className="text-xs text-muted-foreground">Mid-Content Rectangle Ad (300x250)</span>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* FAQ Section with JSON-LD */}
              {faqs.length > 0 && (
                <section>
                  <FAQSection faqs={faqs} pageUrl={canonicalUrl} />
                </section>
              )}

              {/* Thematic Cluster Links */}
              {linkingStrategy.thematicLinks.length > 0 && (
                <section>
                  <ThematicCluster
                    title="Related Biblical Topics"
                    description="Discover connections between this situation and biblical names mentioned in these verses."
                    links={linkingStrategy.thematicLinks}
                  />
                </section>
              )}

              {/* Related Situations (3 links for link density) */}
              {linkingStrategy.relatedSituations.length > 0 && (
                <section>
                  <InternalLinks
                    title="Related Situations"
                    links={linkingStrategy.relatedSituations}
                  />
                </section>
              )}

              {/* Trending Names (2 links for link density) */}
              {trendingNames.length > 0 && (
                <section>
                  <InternalLinks
                    title="Popular Biblical Names"
                    links={trendingNames}
                    showCategory={false}
                  />
                </section>
              )}

              {/* Call to Action */}
              <section className="bg-gradient-to-r from-primary/10 to-transparent border rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-3">
                  Apply These Verses to Your Life
                </h2>
                <p className="text-muted-foreground mb-4">
                  Scripture comes alive when we meditate on it and apply it to our daily circumstances.
                  Take time to read these verses in their full context, pray for understanding,
                  and ask God how they apply to your situation with {data.title.toLowerCase()}.
                </p>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    Bookmark This Page
                  </button>
                  <button className="px-4 py-2 border rounded-md hover:bg-muted transition-colors">
                    Share with Others
                  </button>
                </div>
              </section>
            </article>

            {/* Sidebar - Desktop Only */}
            <aside className="hidden lg:block space-y-6">
              {/* Ad Slot 3: Sidebar Sticky (300x600 or 300x250) */}
              <div className="sticky top-4">
                <div
                  id="sidebar-sticky"
                  className="min-h-[600px] w-[300px] flex items-center justify-center bg-muted/30 border border-dashed border-muted-foreground/20 rounded"
                  aria-label="Advertisement"
                >
                  {process.env.NODE_ENV === 'development' && (
                    <span className="text-xs text-muted-foreground text-center px-4">
                      Sidebar Sticky Ad<br/>(300x600 or 300x250)
                    </span>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

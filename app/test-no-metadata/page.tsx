// This is identical to bible-verses-for/[slug]/page.tsx but WITHOUT generateMetadata
// to test if metadata generation is causing the error

import { notFound } from "next/navigation";
import { getCanonicalUrl } from "@/lib/utils";
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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TestNoMetadataPage() {
  const slug = 'anxiety';

  const situationData = await getSituationWithVerses(slug, 10);

  if (!situationData) {
    notFound();
  }

  const primaryMapping = situationData.verseMappings[0];
  if (!primaryMapping) {
    notFound();
  }

  const primaryVerse = primaryMapping.verse;
  const primaryReference = formatVerseReference(primaryVerse);

  const topStrongs = getTopStrongsFromVerse(primaryVerse, 3);

  const versesForGeneration = situationData.verseMappings.slice(0, 5).map((mapping) => ({
    reference: formatVerseReference(mapping.verse),
    text: mapping.verse.textKjv || mapping.verse.textWeb || '',
  }));

  const introduction = await generateIntroduction({
    situation: situationData.title,
    verses: versesForGeneration,
    targetWordCount: 300,
  });

  const faqs = await generateFAQs(situationData.title, versesForGeneration);

  const breadcrumbs = generateBreadcrumbs('situation', situationData.title, slug);

  const linkingStrategy = await generateLinkingStrategy('situation', slug, breadcrumbs);

  const trendingNames = await getTrendingNames(2);

  const linkingDensity = validateLinkingDensity(linkingStrategy.totalLinks);

  const qualityReport = validateContentQuality({
    introduction: introduction.content,
    translationCount: prepareTranslations(primaryVerse).filter(t => t.text).length,
    strongsCount: topStrongs.length,
    faqCount: faqs.length,
  });

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Bible Verses for ${situationData.title}`,
    description: situationData.metaDescription,
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
      "@id": getCanonicalUrl(`/bible-verses-for/${slug}`),
    },
    about: {
      "@type": "Thing",
      name: situationData.title,
    },
    wordCount: introduction.wordCount,
  };

  const canonicalUrl = getCanonicalUrl(`/bible-verses-for/${slug}`);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main className="min-h-screen py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-8">
            <article className="space-y-12">
              <header className="space-y-4">
                <Breadcrumbs items={breadcrumbs} />

                <h1 className="text-4xl md:text-5xl font-bold">
                  Bible Verses for {situationData.title}
                </h1>

                <p className="text-xl text-muted-foreground leading-relaxed">
                  {situationData.metaDescription}
                </p>

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

              <div
                id="atf-leaderboard"
                className="min-h-[90px] flex items-center justify-center bg-muted/30 border border-dashed border-muted-foreground/20 rounded"
                aria-label="Advertisement"
              >
                {process.env.NODE_ENV === 'development' && (
                  <span className="text-xs text-muted-foreground">ATF Leaderboard Ad (728x90)</span>
                )}
              </div>

          <section className="prose prose-lg max-w-none">
            <div className="bg-gradient-to-r from-primary/5 to-transparent border-l-4 border-primary pl-6 py-4">
              <p className="text-lg leading-relaxed text-foreground">
                {introduction.content}
              </p>
            </div>
          </section>

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

            {primaryMapping.manualNote && (
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Note:</strong> {primaryMapping.manualNote}
                </p>
              </div>
            )}
          </section>

          {topStrongs.length > 0 && (
            <section>
              <StrongsDisplay entries={topStrongs} reference={primaryReference} />
            </section>
          )}

              {situationData.verseMappings.length > 1 && (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">
                      More Verses About {situationData.title}
                    </h2>
                    <p className="text-muted-foreground">
                      Additional Scripture passages ranked by relevance
                    </p>
                  </div>

                  <div className="space-y-6">
                    {situationData.verseMappings.slice(1).map((mapping, index) => {
                      const verse = mapping.verse;
                      const reference = formatVerseReference(verse);

                      return (
                        <div key={verse.id} className="space-y-6">
                          <div
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
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {faqs.length > 0 && (
                <section>
                  <FAQSection faqs={faqs} pageUrl={canonicalUrl} />
                </section>
              )}

              {linkingStrategy.thematicLinks.length > 0 && (
                <section>
                  <ThematicCluster
                    title="Related Biblical Topics"
                    description="Discover connections between this situation and biblical names mentioned in these verses."
                    links={linkingStrategy.thematicLinks}
                  />
                </section>
              )}

              {linkingStrategy.relatedSituations.length > 0 && (
                <section>
                  <InternalLinks
                    title="Related Situations"
                    links={linkingStrategy.relatedSituations}
                  />
                </section>
              )}

              {trendingNames.length > 0 && (
                <section>
                  <InternalLinks
                    title="Popular Biblical Names"
                    links={trendingNames}
                    showCategory={false}
                  />
                </section>
              )}

              <section className="bg-gradient-to-r from-primary/10 to-transparent border rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-3">
                  Apply These Verses to Your Life
                </h2>
                <p className="text-muted-foreground mb-4">
                  Scripture comes alive when we meditate on it and apply it to our daily circumstances.
                  Take time to read these verses in their full context, pray for understanding,
                  and ask God how they apply to your situation with {situationData.title.toLowerCase()}.
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

            <aside className="hidden lg:block space-y-6">
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

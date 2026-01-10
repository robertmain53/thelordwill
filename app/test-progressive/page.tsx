// Progressive rendering test - add sections one by one to find the error
import { notFound } from "next/navigation";
import { getCanonicalUrl } from "@/lib/utils";
import { getSituationWithVerses, getTopStrongsFromVerse, formatVerseReference } from "@/lib/db/situation-queries";
import { generateIntroduction, generateFAQs, validateContentQuality } from "@/lib/content/generator";
import { TranslationComparison } from "@/components/translation-comparison";
import { prepareTranslations } from "@/lib/translations";
import { StrongsDisplay } from "@/components/strongs-display";
import { FAQSection } from "@/components/faq-section";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { InternalLinks, ThematicCluster } from "@/components/internal-links";
import { generateLinkingStrategy, generateBreadcrumbs, validateLinkingDensity, getTrendingNames } from "@/lib/seo/internal-linking";

export const dynamic = 'force-dynamic';

export default async function TestProgressivePage() {
  const slug = 'anxiety';

  const situationData = await getSituationWithVerses(slug, 10);
  if (!situationData) notFound();

  const primaryMapping = situationData.verseMappings[0];
  if (!primaryMapping) notFound();

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
          {/* STEP 1: Test layout wrapper */}
          <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-8">

            {/* STEP 2: Test article wrapper */}
            <article className="space-y-12">

              {/* STEP 3: Test header */}
              <header className="space-y-4">
                <Breadcrumbs items={breadcrumbs} />
                <h1 className="text-4xl md:text-5xl font-bold">
                  Bible Verses for {situationData.title}
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {situationData.metaDescription}
                </p>
              </header>

              {/* STEP 4: Test introduction section */}
              <section className="prose prose-lg max-w-none">
                <div className="bg-gradient-to-r from-primary/5 to-transparent border-l-4 border-primary pl-6 py-4">
                  <p className="text-lg leading-relaxed text-foreground">
                    {introduction.content}
                  </p>
                </div>
              </section>

              {/* STEP 5: Test primary verse section */}
              <section className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">
                    Primary Verse: {primaryReference}
                  </h2>
                </div>

                <TranslationComparison
                  reference={primaryReference}
                  translations={prepareTranslations(primaryVerse)}
                  defaultVersion="KJV"
                  layout="tabs"
                />
              </section>

              {/* STEP 6: Test Strong's section (conditional) */}
              {topStrongs.length > 0 && (
                <section>
                  <StrongsDisplay entries={topStrongs} reference={primaryReference} />
                </section>
              )}

              {/* STEP 7: Test additional verses section */}
              {situationData.verseMappings.length > 1 && (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">
                      More Verses About {situationData.title}
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {situationData.verseMappings.slice(1).map((mapping, index) => {
                      const verse = mapping.verse;
                      const reference = formatVerseReference(verse);

                      return (
                        <div key={verse.id} className="space-y-6">
                          <div className="border rounded-lg p-6 bg-card">
                            <h3 className="text-lg font-semibold">{reference}</h3>
                            <blockquote className="text-muted-foreground italic">
                              "{verse.textKjv || verse.textWeb}"
                            </blockquote>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* STEP 8: Test FAQ section */}
              {faqs.length > 0 && (
                <section>
                  <FAQSection faqs={faqs} pageUrl={canonicalUrl} />
                </section>
              )}

              {/* STEP 9: Test internal links */}
              {linkingStrategy.relatedSituations.length > 0 && (
                <section>
                  <InternalLinks
                    title="Related Situations"
                    links={linkingStrategy.relatedSituations}
                  />
                </section>
              )}

              <div className="bg-green-100 p-6 rounded">
                <p className="font-bold text-green-800">✓ All sections rendered successfully!</p>
              </div>

            </article>

            {/* STEP 10: Test sidebar */}
            <aside className="hidden lg:block space-y-6">
              <div className="sticky top-4">
                <div className="min-h-[600px] w-[300px] bg-muted/30 border rounded">
                  <p className="p-4 text-sm text-center">Sidebar</p>
                </div>
              </div>
            </aside>

          </div>
        </div>
      </main>
    </>
  );
}

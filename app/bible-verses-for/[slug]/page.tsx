import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCanonicalUrl, titleCase } from "@/lib/utils";
import { EEATStrip } from "@/components/eeat-strip";
import {
  getSituationWithVerses,
  getTopStrongsFromVerse,
  formatVerseReference,
} from "@/lib/db/situation-queries";
import { getProfession } from "@/lib/db/queries";
import {
  generateIntroduction,
  generateFAQs,
} from "@/lib/content/generator";
import { TranslationComparison } from "@/components/translation-comparison";
import { prepareTranslations } from "@/lib/translations";
import { StrongsDisplay } from "@/components/strongs-display";
import { FAQSection } from "@/components/faq-section";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { InternalLinks, ThematicCluster } from "@/components/internal-links";
import { buildArticleSchema, buildBreadcrumbList } from "@/lib/seo/jsonld";
import {
  generateLinkingStrategy,
  generateBreadcrumbs,
  getTrendingNames,
} from "@/lib/seo/internal-linking";
import { RelatedSection } from "@/components/related-section";
import { getRelatedLinks } from "@/lib/internal-linking";
import { PosterSectionServer } from "@/components/poster-section";
import { getGraphLinkSet } from "@/lib/internal-linking/graph";
import { RelatedResourcesSection } from "@/components/related-resources-section";
import { VerseIntelligenceBlock } from "@/components/verse-intelligence-block";

// Force SSR - disable static generation
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!process.env.DATABASE_URL) {
    const title = `Bible Verses for ${titleCase(slug)}`;
    const canonicalUrl = getCanonicalUrl(`/bible-verses-for/${slug}`);

    return {
      title,
      alternates: {
        canonical: canonicalUrl,
      },
    };
  }

  const situationData = await getSituationWithVerses(slug, 10);

  if (situationData) {
    const title = `Bible Verses for ${situationData.title} - Scripture & Comfort`;
    const description = situationData.metaDescription;
    const canonicalUrl = getCanonicalUrl(`/bible-verses-for/${slug}`);
    const imageUrl = getCanonicalUrl(
      `/api/og?situation=${encodeURIComponent(situationData.title)}&type=situation`
    );

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
            alt: `Bible Verses for ${situationData.title}`,
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
        `Bible verses for ${situationData.title}`,
        `Scripture for ${situationData.title}`,
        `${situationData.title} Bible verses`,
        "Bible verses",
        "Christian comfort",
        "Biblical guidance",
        "original Hebrew Greek",
        "Strong's Concordance",
      ],
    };
  }

  const profession = await getProfession(slug);
  if (!profession) {
    return {
      title: "Page Not Found",
    };
  }

  const title = `Bible Verses for ${profession.title} - Scripture & Wisdom`;
  const description = profession.metaDescription ?? profession.description;
  const canonicalUrl = getCanonicalUrl(`/bible-verses-for/${slug}`);
  const imageUrl = getCanonicalUrl(
    `/api/og?profession=${encodeURIComponent(profession.title)}&type=profession`
  );

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
          alt: `Bible Verses for ${profession.title}`,
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
      `Bible verses for ${profession.title}`,
      `Scripture for ${profession.title}`,
      `${profession.title} Bible verses`,
      "Bible verses",
      "Biblical wisdom",
      "Christian profession",
      "Faith at work",
    ],
  };
}

const CATEGORY_HIGHLIGHTS: Record<string, string> = {
  emotions: "renewed emotional resilience",
  health: "restorative healing and strength",
  relationships: "restored unity and trust",
  faith: "steady, obedient trust in God",
  guidance: "clarity for hard decisions",
  "spiritual-warfare": "confidence against unseen opposition",
  peace: "calm over anxiety and fear",
  grief: "comfort throughout loss",
  protection: "peace amidst uncertainty",
  encouragement: "encouragement for worn hearts",
};

function buildWhoThisIsFor(title: string) {
  const cleanedTitle = title.toLowerCase();
  return `People navigating ${cleanedTitle} will find this collection tailored to their need for Scripture-led clarity.`;
}

function extractVerseSnippet(text?: string | null) {
  if (!text) return "";
  const cleaned = text.replace(/\s+/g, " ").trim();
  const sentences = cleaned.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean);
  if (sentences.length > 0) {
    const sentence = sentences[0];
    return sentence.length <= 200 ? sentence : `${sentence.slice(0, 200)}…`;
  }
  return cleaned.length <= 200 ? cleaned : `${cleaned.slice(0, 200)}…`;
}

function buildWhyItMatters(category: string | null | undefined, slug: string, title: string) {
  const normalized = category?.toLowerCase();
  if (normalized && CATEGORY_HIGHLIGHTS[normalized]) {
    return `This set of verses sustains ${CATEGORY_HIGHLIGHTS[normalized]}, so you can keep trusting even when your circumstances feel heavy.`;
  }

  if (slug.includes("peace")) {
    return "It anchors peace over fear, reminding you that calm obedience wins the day.";
  }
  if (slug.includes("healing") || slug.includes("health")) {
    return "The passages prioritize healing for body, mind, and relationships, inviting you to receive restoration.";
  }

  return `It matters because ${title.toLowerCase()} deserves Scripture that keeps your heart steady and your decisions aligned with God.`;
}

export default async function SituationVersesPage({ params }: PageProps) {
  const { slug } = await params;
  if (!process.env.DATABASE_URL) {
    const title = titleCase(slug);

    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Bible Verses for {title}</h1>
        <p className="mt-4 text-muted-foreground">
          Content will be available once the database is connected.
        </p>
      </main>
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thelordwill.com";
  const todayISO = new Date().toISOString().slice(0, 10);

  const situationData = await getSituationWithVerses(slug, 10);

  if (!situationData) {
    const profession = await getProfession(slug);

    if (!profession) {
      notFound();
    }

    const description = profession.metaDescription ?? profession.description;
    const canonicalUrl = getCanonicalUrl(`/bible-verses-for/${slug}`);
    const breadcrumbs = [
      { label: "Home", href: "/", position: 1 },
      { label: "Bible Verses", href: "/situations", position: 2 },
      { label: `Bible Verses for ${profession.title}`, href: `/bible-verses-for/${slug}`, position: 3 },
    ];

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildBreadcrumbList(breadcrumbs, siteUrl)),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              buildArticleSchema({
                title: `Bible Verses for ${profession.title} - Scripture & Wisdom`,
                description,
                url: canonicalUrl,
                imageUrl: getCanonicalUrl(
                  `/api/og?profession=${encodeURIComponent(profession.title)}&type=profession`
                ),
                dateModifiedISO: todayISO,
                language: "en",
                category: "Bible Verses",
                aboutName: `${profession.title} profession`,
              })
            ),
          }}
        />

        <main className="min-h-screen py-12 px-4">
          <article className="max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Bible Verses for {profession.title}
              </h1>
              <EEATStrip
                authorName="The Lord Will Editorial Team"
                reviewerName="Ugo Candido"
                reviewerCredential="Engineer"
                lastUpdatedISO={todayISO}
                categoryLabel="Bible Verses"
              />
              <p className="text-xl text-muted-foreground">
                {description}
              </p>
            </header>

            <section className="space-y-6">
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">
                  Biblical Wisdom for {profession.title}s
                </h2>
                <p className="text-muted-foreground">
                  Relevant Bible verses for {profession.title}s will be displayed here.
                </p>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">
                  Applying Faith at Work
                </h2>
                <p className="text-muted-foreground">
                  Practical guidance for applying biblical principles in your profession as a {profession.title}.
                </p>
              </div>
            </section>
          </article>
        </main>
      </>
    );
  }

  // Get primary verse for detailed analysis
  const primaryMapping = situationData.verseMappings[0];
  if (!primaryMapping) {
    notFound();
  }

  const primaryVerse = primaryMapping.verse;
  const primaryVerseCanonicalUrl = getCanonicalUrl(
    `/verse/${primaryVerse.bookId}/${primaryVerse.chapter}/${primaryVerse.verseNumber}`,
  );
  const primaryReference = formatVerseReference(primaryVerse);

  // Get top Strong's numbers from primary verse
  const topStrongs = getTopStrongsFromVerse(primaryVerse, 3);

  // Prepare data for AI generation
  const versesForGeneration = situationData.verseMappings.slice(0, 5).map((mapping) => ({
    reference: formatVerseReference(mapping.verse),
    text: mapping.verse.textKjv || mapping.verse.textWeb || '',
  }));

  // Generate AI-powered introduction
  const introduction = await generateIntroduction({
    situation: situationData.title,
    verses: versesForGeneration,
    targetWordCount: 300,
  });

  // Generate FAQs
  const faqs = await generateFAQs(situationData.title, versesForGeneration);

  // Generate breadcrumbs
  const breadcrumbs = generateBreadcrumbs('situation', situationData.title, slug);

  // Generate internal linking strategy
  const linkingStrategy = await generateLinkingStrategy('situation', slug, breadcrumbs);

  // Get trending names for additional links
  const trendingNames = await getTrendingNames(2);

  // Get cross-entity related links (places, itineraries sharing verses)
  const crossEntityLinks = await getRelatedLinks("situation", {
    id: situationData.id,
    slug: situationData.slug,
    title: situationData.title,
    category: situationData.category,
  });

  const verseRows = situationData.verseMappings.map((mapping) => ({
    reference: formatVerseReference(mapping.verse),
    bookId: mapping.verse.bookId,
    chapter: mapping.verse.chapter,
    verseNumber: mapping.verse.verseNumber,
    relevanceScore: mapping.relevanceScore,
    snippet: mapping.verse.textKjv || mapping.verse.textWeb || undefined,
  }));

  const graphLinks = await getGraphLinkSet({
    entityType: "situation",
    record: {
      id: situationData.id,
      slug: situationData.slug,
      title: situationData.title,
      category: situationData.category,
    },
    verseRows,
    precomputedEntityLinks: crossEntityLinks,
  });

  const whoText = buildWhoThisIsFor(situationData.title);
  const whatText = extractVerseSnippet(
    primaryVerse.textKjv || primaryVerse.textWeb || primaryVerse.textAsv || primaryVerse.textBbe,
  );
  const whyText = buildWhyItMatters(situationData.category, slug, situationData.title);

  const canonicalUrl = getCanonicalUrl(`/bible-verses-for/${slug}`);
  const lastUpdatedISO =
    situationData.updatedAt
      ? new Date(situationData.updatedAt).toISOString().slice(0, 10)
      : todayISO;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildBreadcrumbList(breadcrumbs, siteUrl)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildArticleSchema({
              title: `Bible Verses for ${situationData.title} - Scripture & Comfort`,
              description: situationData.metaDescription,
              url: canonicalUrl,
              imageUrl: getCanonicalUrl(
                `/api/og?situation=${encodeURIComponent(situationData.title)}&type=situation`
              ),
              dateModifiedISO: lastUpdatedISO,
              language: "en",
              category: "Bible Verses",
              aboutName: situationData.title,
            })
          ),
        }}
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
                  Bible Verses for {situationData.title}
                </h1>

                <EEATStrip
                  authorName="The Lord Will Editorial Team"
                  reviewerName="Ugo Candido"
                  reviewerCredential="Engineer"
                  lastUpdatedISO={lastUpdatedISO}
                  categoryLabel="Bible Verses"
                />

                <p className="text-xl text-muted-foreground leading-relaxed">
                  {situationData.metaDescription}
                </p>

              </header>

              <section className="rounded-2xl border border-primary/30 bg-card/90 p-6 space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Q/A snapshot for this theme
                </h2>
                <div className="grid gap-4 md:grid-cols-3 text-sm text-gray-700">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-primary mb-2">
                      Who is this for?
                    </p>
                    <p>{whoText}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-primary mb-2">
                      What does the verse say?
                    </p>
                    <p>{whatText || "Scripture snapshot will appear once this verse is ready."}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-primary mb-2">
                      Why it matters
                    </p>
                    <p>{whyText}</p>
                  </div>
                </div>
              </section>

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

          {/* Verse Poster Section */}
      <section>
        <PosterSectionServer
          slug={slug}
          situationTitle={situationData.title}
          verseRef={primaryReference}
          verseText={primaryVerse.textKjv || primaryVerse.textWeb || ""}
        />
      </section>

      <section className="mb-10">
        <VerseIntelligenceBlock
          verseId={primaryVerse.id}
          bookId={primaryVerse.bookId}
          canonicalUrl={primaryVerseCanonicalUrl}
        />
      </section>

              {/* Additional Verses */}
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
                        </div>
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

              {/* Cross-Entity Related Content (places, itineraries sharing verses) */}
              {crossEntityLinks.length > 0 && (
                <RelatedSection title="Related Content" links={crossEntityLinks} />
              )}

              <RelatedResourcesSection
                verseLinks={graphLinks.verseLinks}
                entityLinks={graphLinks.entityLinks}
              />

              {/* Call to Action */}
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

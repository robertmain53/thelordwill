import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getCanonicalUrl } from "@/lib/utils";
import { TranslationComparison } from "@/components/translation-comparison";
import { prepareTranslations } from "@/lib/translations";
import { EEATStrip } from "@/components/eeat-strip";
import { FAQSection, type FAQItem } from "@/components/faq-section";
import { buildArticleSchema, buildBreadcrumbList } from "@/lib/seo/jsonld";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

const DEFAULT_PRAYER_POINT_FAQS: FAQItem[] = [
  {
    question: "How do I use these prayer points effectively?",
    answer: "Begin by reading the accompanying Bible verses to build your faith. Meditate on them, then pray the points aloud, personalizing them to your specific situation."
  },
  {
    question: "Do I need to pray these exactly as written?",
    answer: "No, these serve as a guide. We encourage you to let the Holy Spirit lead you and adapt the prayers to your own words and circumstances."
  },
  {
    question: "What is the best time to pray these points?",
    answer: "You can pray them anytime. Many find it helpful to pray them early in the morning to set the tone for the day, or at night before rest."
  }
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const prayerPoint = await prisma.prayerPoint.findUnique({
    where: { slug },
    select: {
      title: true,
      metaTitle: true,
      metaDescription: true,
      slug: true,
    },
  });

  if (!prayerPoint) {
    return {
      title: "Prayer Point Not Found",
    };
  }

  return {
    title: prayerPoint.metaTitle || `${prayerPoint.title} | The Lord Will`,
    description: prayerPoint.metaDescription || prayerPoint.title,
    alternates: {
      canonical: getCanonicalUrl(`/prayer-points/${prayerPoint.slug}`),
    },
  };
}

export default async function PrayerPointPage({ params }: PageProps) {
  const { slug } = await params;
  const prayerPoint = await prisma.prayerPoint.findUnique({
    where: { slug },
    include: {
      verseMappings: {
        include: {
          verse: {
            include: {
              book: true,
            },
          },
        },
        orderBy: {
          relevanceScore: 'desc',
        },
      },
      relatedPrayerPoints: {
        include: {
          prayerPoint: {
            select: {
              slug: true,
              title: true,
              description: true,
            },
          },
        },
      },
    },
  });

  if (!prayerPoint) {
    notFound();
  }

  // Define breadcrumbs for Schema and UI context if needed
  const breadcrumbs = [
    { name: "Home", item: getCanonicalUrl("/") },
    { name: "Prayer Points", item: getCanonicalUrl("/prayer-points") },
    { name: prayerPoint.title, item: getCanonicalUrl(`/prayer-points/${slug}`) },
  ];

  // If no verses are mapped yet, show placeholder content
  const hasVerses = prayerPoint.verseMappings.length > 0;

  // Get related prayer points (from the same category)
  const relatedPoints = await prisma.prayerPoint.findMany({
    where: {
      category: prayerPoint.category,
      slug: {
        not: prayerPoint.slug,
      },
    },
    select: {
      slug: true,
      title: true,
      description: true,
    },
    take: 3,
    orderBy: {
      priority: 'desc',
    },
  });

  // Handle FAQs safely (assuming it might be a JSON field or relation, defaulting if missing)
  const faqs = (prayerPoint as { faqs?: FAQItem[] | null }).faqs ?? undefined;
  const displayFaqs = faqs && faqs.length > 0 ? faqs : DEFAULT_PRAYER_POINT_FAQS;

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Structured Data Scripts */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildBreadcrumbList(breadcrumbs)),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              buildArticleSchema({
                title: `${prayerPoint.title}`,
                description:
                  prayerPoint.description ||
                  `Scripture-anchored prayer points and practical guidance for ${prayerPoint.title}.`,
                url: getCanonicalUrl(`/prayer-points/${slug}`),
                imageUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://thelordwill.com"}/api/og/prayer-points/${slug}.png`,
                dateModifiedISO: new Date(prayerPoint.updatedAt).toISOString().slice(0, 10),
                language: "en",
                category: "Prayer Points",
                aboutName: prayerPoint.title,
              }),
            ),
          }}
        />

        {/* Breadcrumb Navigation */}
        <nav className="mb-4 text-sm text-muted-foreground flex items-center flex-wrap gap-2">
          <Link href="/prayer-points" className="hover:text-primary">
            Prayer Points
          </Link>
          <span>›</span>
          <span>{prayerPoint.title}</span>
        </nav>

        {/* E-E-A-T Signal Strip */}
        <div className="mb-8">
          <EEATStrip
            authorName="The Lord Will Editorial Team"
            reviewerName="Ugo Candido"
            reviewerCredential="Engineer"
            lastUpdatedISO={new Date(prayerPoint.updatedAt).toISOString().slice(0, 10)}
            categoryLabel="Prayer Points"
          />
        </div>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {prayerPoint.title}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {prayerPoint.description}
          </p>
        </header>

        {/* Introduction */}
        {prayerPoint.content && (
          <section className="mb-12 bg-card border rounded-lg p-8">
            <div
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: prayerPoint.content }}
            />
          </section>
        )}

        {/* Bible Verses */}
        {hasVerses ? (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">
              Bible Verses for {prayerPoint.title}
            </h2>
            <div className="space-y-8">
              {prayerPoint.verseMappings.map((mapping, index) => {
                const verse = mapping.verse;
                const book = verse.book;
                const reference = `${book.name} ${verse.chapter}:${verse.verseNumber}`;

                return (
                  <article
                    key={mapping.id}
                    className="border-l-4 border-primary pl-6 py-2"
                  >
                    <header className="mb-4">
                      <h3 className="text-lg font-semibold text-primary">
                        {index + 1}. {reference}
                      </h3>
                      {mapping.prayerFocus && (
                        <span className="inline-block mt-2 text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                          {mapping.prayerFocus}
                        </span>
                      )}
                    </header>

                    {/* Verse Text */}
                    <blockquote className="text-lg leading-relaxed mb-4">
                      {verse.textKjv}
                    </blockquote>

                    {/* Context Note */}
                    {mapping.contextNote && (
                      <p className="text-sm text-muted-foreground italic mb-4">
                        {mapping.contextNote}
                      </p>
                    )}

                    {/* Translation Comparison */}
                    <TranslationComparison
                      translations={prepareTranslations(verse)}
                      reference={reference}
                    />
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="mb-12 bg-muted/50 border border-dashed rounded-lg p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🙏</span>
              </div>
              <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                We're currently curating powerful Bible verses for {prayerPoint.title.toLowerCase()}.
                These prayer points will be enhanced with carefully selected Scripture passages to strengthen
                your faith and guide your intercession.
              </p>
              <p className="text-sm text-muted-foreground">
                Check back soon or explore other prayer point topics below.
              </p>
            </div>
          </section>
        )}

        {/* How to Pray Section */}
        <section className="mb-12 bg-card border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">How to Use These Prayer Points</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <ol className="list-decimal list-inside space-y-3">
              <li>
                <strong>Read the Scripture</strong> - Begin by reading and meditating on each verse. Let God's Word sink into your heart.
              </li>
              <li>
                <strong>Declare the Word</strong> - Speak these verses aloud as declarations over your life and situation.
              </li>
              <li>
                <strong>Personalize Your Prayer</strong> - Use these verses as a foundation, then pray specifically about your circumstances.
              </li>
              <li>
                <strong>Pray with Faith</strong> - Believe that God's Word accomplishes what He sends it to do (Isaiah 55:11).
              </li>
              <li>
                <strong>Be Persistent</strong> - Continue praying these points regularly until you see breakthrough.
              </li>
            </ol>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-12 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Frequently asked questions</h2>
          <FAQSection
            faqs={displayFaqs}
            pageUrl={getCanonicalUrl(`/prayer-points/${slug}`)}
          />
        </section>

        {/* Related Prayer Points */}
        {relatedPoints.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Related Prayer Points</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedPoints.map((point) => (
                <Link
                  key={point.slug}
                  href={`/prayer-points/${point.slug}`}
                  className="group border rounded-lg p-6 bg-card hover:shadow-md hover:border-primary transition-all"
                >
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {point.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {point.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4">Start Your Day with Prayer</h2>
          <p className="text-muted-foreground mb-6">
            Get fresh, powerful prayer points delivered daily. Begin each day with Scripture-based prayers
            for breakthrough and blessing.
          </p>
          <Link
            href="/prayer-points/today"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            View Today's Prayer Points
            <span>→</span>
          </Link>
        </section>
      </div>
    </main>
  );
}

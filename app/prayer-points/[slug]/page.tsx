import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getCanonicalUrl } from "@/lib/utils";
import { TranslationComparison } from "@/components/translation-comparison";
import { prepareTranslations } from "@/lib/translations";
import { EEATStrip } from "@/components/eeat-strip";
import { FAQSection, type FAQItem } from "@/components/faq-section";
import { buildBreadcrumbList, buildPrayerPointEntitySchema } from "@/lib/seo/jsonld";
import { RelatedSection } from "@/components/related-section";
import { getRelatedLinks } from "@/lib/internal-linking";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

type PrayerFocus =
  | "declaration"
  | "supplication"
  | "intercession"
  | "warfare"
  | string;

const DEFAULT_PRAYER_POINT_FAQS: FAQItem[] = [
  {
    question: "How do I use these prayer points effectively?",
    answer:
      "Begin by reading the accompanying Bible verses to build your faith. Meditate on them, then pray the points aloud, personalizing them to your specific situation.",
  },
  {
    question: "Do I need to pray these exactly as written?",
    answer:
      "No, these serve as a guide. We encourage you to let the Holy Spirit lead you and adapt the prayers to your own words and circumstances.",
  },
  {
    question: "What is the best time to pray these points?",
    answer:
      "You can pray them anytime. Many find it helpful to pray them early in the morning to set the tone for the day, or at night before rest.",
  },
];

function clamp(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) : s;
}

function normalizeKey(input?: string | null): string {
  return (input || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function scoreBand(score?: number | null): "high" | "medium" | "low" {
  const n = typeof score === "number" ? score : 50;
  if (n >= 75) return "high";
  if (n >= 55) return "medium";
  return "low";
}

function focusVerb(focus?: PrayerFocus | null): string {
  const f = (focus || "").toLowerCase();
  if (f === "declaration") return "declare";
  if (f === "supplication") return "ask";
  if (f === "intercession") return "intercede";
  if (f === "warfare") return "resist";
  return "pray";
}

function focusAngle(focus?: PrayerFocus | null): string {
  const f = (focus || "").toLowerCase();
  if (f === "declaration") return "a promise to speak with faith";
  if (f === "supplication") return "a need to bring honestly before God";
  if (f === "intercession") return "a burden to carry for others";
  if (f === "warfare")
    return "a stand to take against fear, sin, or spiritual opposition";
  return "a Scripture anchor to pray with clarity";
}

function keyTheme(clusterKey: string): {
  label: string;
  scenario: string;
  desiredOutcome: string;
} {
  const k = normalizeKey(clusterKey);
  const has = (needle: string) => k.includes(needle);

  if (has("breakthrough")) {
    return {
      label: "breakthrough",
      scenario: "when progress feels blocked and you need God’s way forward",
      desiredOutcome: "endurance, wisdom, and open doors aligned with God’s will",
    };
  }
  if (has("healing")) {
    return {
      label: "healing",
      scenario: "when your body, mind, or relationships need restoration",
      desiredOutcome: "strength, comfort, and wise next steps",
    };
  }
  if (has("protection") || has("safety")) {
    return {
      label: "protection",
      scenario: "when you are exposed to risk, uncertainty, or fear",
      desiredOutcome: "peace, discernment, and practical protection",
    };
  }
  if (has("deliverance") || has("freedom")) {
    return {
      label: "deliverance",
      scenario:
        "when you feel spiritually oppressed or stuck in destructive patterns",
      desiredOutcome: "repentance, renewed mind, and sustained freedom",
    };
  }
  if (has("financial") || has("provision") || has("money")) {
    return {
      label: "provision",
      scenario: "when resources are tight and decisions carry weight",
      desiredOutcome: "daily provision, wisdom, and integrity",
    };
  }
  if (has("peace") || has("anxiety") || has("fear")) {
    return {
      label: "peace over fear",
      scenario: "when worry and fear begin to dominate your thoughts",
      desiredOutcome: "calm, trust, and steadiness in obedience",
    };
  }
  if (has("family") || has("marriage") || has("children")) {
    return {
      label: "family",
      scenario: "when relationships need healing, unity, and godly leadership",
      desiredOutcome: "love, wisdom, patience, and mutual honor",
    };
  }

  return {
    label: "guidance",
    scenario: "when you need clarity, endurance, or a firm spiritual anchor",
    desiredOutcome: "faithful action and deeper trust in God",
  };
}

function buildWhyItApplies(args: {
  prayerFocus?: PrayerFocus | null;
  relevanceScore?: number | null;
  clusterKey: string;
  reference: string;
}): string {
  const band = scoreBand(args.relevanceScore);
  const theme = keyTheme(args.clusterKey);
  const verb = focusVerb(args.prayerFocus);
  const angle = focusAngle(args.prayerFocus);

  if (band === "high") {
    return clamp(
      `Why it applies: This passage is a strong fit for the “${theme.label}” cluster ${theme.scenario}. Use it as ${angle}—to ${verb} God’s Word in a way that shapes your decisions and expectations today.`,
      260,
    );
  }
  if (band === "medium") {
    return clamp(
      `Why it applies: This verse supports the “${theme.label}” focus by grounding prayer in Scripture when ${theme.scenario}. Treat ${args.reference} as ${angle} and connect it to one concrete request or decision.`,
      260,
    );
  }
  return clamp(
    `Why it applies: This is a supportive cross-reference for the “${theme.label}” theme. When ${theme.scenario}, use it to steady your mind and keep your prayer aligned with God’s character and promises.`,
    260,
  );
}

function buildHowToPrayToday(args: {
  prayerFocus?: PrayerFocus | null;
  clusterKey: string;
}): string {
  const theme = keyTheme(args.clusterKey);
  const f = (args.prayerFocus || "").toLowerCase();

  if (f === "declaration") {
    return `How to pray it today: Name one specific area where you need ${theme.label}. Speak this verse aloud as a faith statement, then ask God for the next obedient step within 24 hours.`;
  }
  if (f === "supplication") {
    return `How to pray it today: Turn the verse into a direct request. Ask for ${theme.desiredOutcome}, and be precise about what you need and what you will do if God provides direction.`;
  }
  if (f === "intercession") {
    return `How to pray it today: Pray this verse over a specific person or group. Request ${theme.desiredOutcome} for them, and add one practical action you can take to support them.`;
  }
  if (f === "warfare") {
    return `How to pray it today: Use the verse to resist fear and accusation. Renounce what contradicts Scripture, then ask God for strength to remain steady and faithful in action.`;
  }
  return `How to pray it today: Personalize the verse with your situation. Ask for ${theme.desiredOutcome}, then write one concrete step that expresses trust in God’s guidance.`;
}

function buildSynthesis(args: {
  clusterKey: string;
  focuses: PrayerFocus[];
  count: number;
}): { title: string; body: string } {
  const theme = keyTheme(args.clusterKey);
  const fset = new Set(
    args.focuses.map((f) => (f || "").toLowerCase()).filter(Boolean),
  );

  const parts: string[] = [];
  if (fset.has("declaration")) parts.push("faith-filled declaration");
  if (fset.has("supplication")) parts.push("honest petition");
  if (fset.has("intercession")) parts.push("love-driven intercession");
  if (fset.has("warfare"))
    parts.push("steady resistance against fear and opposition");

  const method = parts.length ? parts.join(", ") : "Scripture-led prayer";

  return {
    title: "How these verses work together",
    body: `Taken together, these ${args.count} passages form a coherent “${theme.label}” prayer path: they shape your mindset with truth, guide your requests, and move you from anxiety or confusion into faithful action. The pattern is ${method}: you anchor in Scripture, pray specifically, and then act consistently with what you prayed.`,
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
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
    return { title: "Prayer Point Not Found" };
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

  // Only fetch published prayer points for public pages
  const prayerPoint = await prisma.prayerPoint.findFirst({
    where: {
      slug,
      status: "published",
    },
    include: {
      verseMappings: {
        include: {
          verse: {
            include: { book: true },
          },
        },
        orderBy: { relevanceScore: "desc" },
      },
      relatedPrayerPoints: {
        include: {
          relatedPrayerPoint: {
            select: { slug: true, title: true, description: true, status: true },
          },
        },
      },
    },
  });

  // 404 for drafts or non-existent items
  if (!prayerPoint) notFound();

  const clusterKey = prayerPoint.slug || prayerPoint.category || slug;

  const breadcrumbs = [
    { label: "Home", href: "/", position: 1 },
    { label: "Prayer Points", href: "/prayer-points", position: 2 },
    { label: prayerPoint.title, href: `/prayer-points/${slug}`, position: 3 },
  ];

  const hasVerses = prayerPoint.verseMappings.length > 0;

  // Related list is "same category", filtered to published only
  const relatedPoints = prayerPoint.category
    ? await prisma.prayerPoint.findMany({
        where: {
          category: prayerPoint.category,
          slug: { not: prayerPoint.slug },
          status: "published",
          OR: [{ content: { not: null } }, { description: { not: "" } }],
        },
        select: { slug: true, title: true, description: true },
        take: 3,
        orderBy: { priority: "desc" },
      })
    : [];

  // Get cross-entity related links (places, situations, etc.)
  const crossEntityLinks = await getRelatedLinks("prayer-point", {
    id: prayerPoint.id,
    slug: prayerPoint.slug,
    title: prayerPoint.title,
    category: prayerPoint.category,
  });

  const faqs = (prayerPoint as { faqs?: FAQItem[] | null }).faqs ?? undefined;
  const displayFaqs =
    faqs && faqs.length > 0 ? faqs : DEFAULT_PRAYER_POINT_FAQS;

  const focusesForSynthesis: PrayerFocus[] = prayerPoint.verseMappings
    .map((m) => (m.prayerFocus || "") as PrayerFocus)
    .filter(Boolean);

  const synthesis = buildSynthesis({
    clusterKey,
    focuses: focusesForSynthesis,
    count: prayerPoint.verseMappings.length,
  });

  const canonicalUrl = getCanonicalUrl(`/prayer-points/${slug}`);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thelordwill.com";
  const lastUpdatedISO = new Date(prayerPoint.updatedAt)
    .toISOString()
    .slice(0, 10);

  const descriptionText =
    prayerPoint.description?.trim() ||
    `Scripture-anchored prayer points and practical guidance for ${prayerPoint.title}.`;

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              buildBreadcrumbList(breadcrumbs, getCanonicalUrl("/")),
            ),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              buildPrayerPointEntitySchema({
                id: prayerPoint.id,
                slug: prayerPoint.slug,
                title: prayerPoint.title,
                description: descriptionText,
                url: canonicalUrl,
                imageUrl: `${siteUrl}/api/og/prayer-points/${slug}.png`,
                dateModifiedISO: lastUpdatedISO,
                category: prayerPoint.category,
                verseCount: prayerPoint.verseMappings.length,
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

        {/* E-E-A-T Strip */}
        <div className="mb-8">
          <EEATStrip
            authorName="The Lord Will Editorial Team"
            reviewerName="Ugo Candido"
            reviewerCredential="Engineer"
            lastUpdatedISO={lastUpdatedISO}
            categoryLabel="Prayer Points"
          />
        </div>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {prayerPoint.title}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {descriptionText}
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

                const whyItApplies = buildWhyItApplies({
                  prayerFocus: mapping.prayerFocus as PrayerFocus,
                  relevanceScore: mapping.relevanceScore,
                  clusterKey,
                  reference,
                });

                const howToPray = buildHowToPrayToday({
                  prayerFocus: mapping.prayerFocus as PrayerFocus,
                  clusterKey,
                });

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

                    <blockquote className="text-lg leading-relaxed mb-4">
                      {verse.textKjv}
                    </blockquote>

                    {/* Information Gain: Why it applies */}
                    <p className="text-sm text-muted-foreground mb-3">
                      {whyItApplies}
                    </p>

                    {/* Actionable: How to pray it today */}
                    <p className="text-sm text-muted-foreground mb-4">
                      {howToPray}
                    </p>

                    {mapping.contextNote && (
                      <p className="text-sm text-muted-foreground italic mb-4">
                        {mapping.contextNote}
                      </p>
                    )}

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
                We&apos;re currently curating powerful Bible verses for{" "}
                {prayerPoint.title.toLowerCase()}. These prayer points will be
                enhanced with carefully selected Scripture passages to
                strengthen your faith and guide your intercession.
              </p>
              <p className="text-sm text-muted-foreground">
                Check back soon or explore other prayer point topics below.
              </p>
            </div>
          </section>
        )}

        {/* Synthesis + Framework (Information Gain) */}
        {hasVerses && (
          <section className="mb-12 bg-card border rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-3">{synthesis.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {synthesis.body}
            </p>

            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold mb-2">
                A simple prayer framework
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>
                  <strong>Anchor:</strong> Re-read one verse slowly and identify
                  one key claim about God.
                </li>
                <li>
                  <strong>Ask:</strong> Turn that claim into a specific request
                  for today (not vague intentions).
                </li>
                <li>
                  <strong>Align:</strong> Name one attitude or behavior to
                  repent of or realign with Scripture.
                </li>
                <li>
                  <strong>Act:</strong> Choose one concrete step consistent with
                  your prayer within 24 hours.
                </li>
              </ol>
            </div>
          </section>
        )}

        {/* How to Pray Section */}
        <section className="mb-12 bg-card border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">
            How to Use These Prayer Points
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <ol className="list-decimal list-inside space-y-3">
              <li>
                <strong>Read the Scripture</strong> - Begin by reading and
                meditating on each verse. Let God&apos;s Word sink into your
                heart.
              </li>
              <li>
                <strong>Declare the Word</strong> - Speak these verses aloud as
                declarations over your life and situation.
              </li>
              <li>
                <strong>Personalize Your Prayer</strong> - Use these verses as a
                foundation, then pray specifically about your circumstances.
              </li>
              <li>
                <strong>Pray with Faith</strong> - Believe that God&apos;s Word
                accomplishes what He sends it to do (Isaiah 55:11).
              </li>
              <li>
                <strong>Be Persistent</strong> - Continue praying these points
                regularly until you see breakthrough.
              </li>
            </ol>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-12 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Frequently asked questions
          </h2>
          <FAQSection faqs={displayFaqs} pageUrl={canonicalUrl} />
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

        {/* Cross-Entity Related Content */}
        {crossEntityLinks.length > 0 && (
          <RelatedSection title="Related Content" links={crossEntityLinks} />
        )}

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4">
            Start Your Day with Prayer
          </h2>
          <p className="text-muted-foreground mb-6">
            Get fresh, powerful prayer points delivered daily. Begin each day
            with Scripture-based prayers for breakthrough and blessing.
          </p>
          <Link
            href="/prayer-points/today"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            View Today&apos;s Prayer Points
            <span>→</span>
          </Link>
        </section>
      </div>
    </main>
  );
}

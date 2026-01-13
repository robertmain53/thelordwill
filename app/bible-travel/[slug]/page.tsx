import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCanonicalUrl } from "@/lib/utils";
import { TRAVEL_ITINERARIES } from "@/data/travel-itineraries";
import { EEATStrip } from "@/components/eeat-strip";
import { FAQSection } from "@/components/faq-section";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { buildArticleSchema } from "@/lib/seo/jsonld";
import { TourLeadForm } from "@/components/tour-lead-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const it = TRAVEL_ITINERARIES.find((x) => x.slug === slug);
  if (!it) return { title: "Itinerary Not Found" };

  return {
    title: it.metaTitle,
    description: it.metaDescription,
    alternates: {
      canonical: getCanonicalUrl(`/bible-travel/${it.slug}`),
    },
  };
}

export default async function TravelItineraryPage({ params }: PageProps) {
  const { slug } = await params;
  const it = TRAVEL_ITINERARIES.find((x) => x.slug === slug);
  if (!it) notFound();

  const canonicalUrl = getCanonicalUrl(`/bible-travel/${it.slug}`);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thelordwill.com";
  const lastUpdatedISO = new Date().toISOString().slice(0, 10);

  const breadcrumbs = [
    { label: "Home", href: "/", position: 1 },
    { label: "Bible Travel", href: "/bible-travel", position: 2 },
    { label: it.title, href: `/bible-travel/${it.slug}`, position: 3 },
  ];

  const articleSchema = buildArticleSchema({
    title: it.metaTitle,
    description: it.metaDescription,
    url: canonicalUrl,
    imageUrl: `${siteUrl}/api/og/travel/${it.slug}.png`,
    dateModifiedISO: lastUpdatedISO,
    language: "en",
    category: "Bible Travel",
    aboutName: it.title,
  });

  const toPlaceSlug = (name: string) =>
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <main className="min-h-screen py-12 px-4">
        <article className="max-w-5xl mx-auto space-y-10">
          <Breadcrumbs items={breadcrumbs} />

          <header className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">{it.title}</h1>

            <EEATStrip
              authorName="The Lord Will Editorial Team"
              reviewerName="Ugo Candido"
              reviewerCredential="Engineer"
              lastUpdatedISO={lastUpdatedISO}
              categoryLabel="Bible Travel"
            />

            <p className="text-xl text-muted-foreground leading-relaxed">{it.metaDescription}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="border rounded-lg p-4 bg-card">
                <div className="font-semibold">Duration</div>
                <div className="text-muted-foreground">{it.days} days</div>
              </div>
              <div className="border rounded-lg p-4 bg-card">
                <div className="font-semibold">Region</div>
                <div className="text-muted-foreground">{it.region}</div>
              </div>
              <div className="border rounded-lg p-4 bg-card">
                <div className="font-semibold">Best season</div>
                <div className="text-muted-foreground">{it.bestSeason}</div>
              </div>
            </div>
          </header>

          <section className="border rounded-xl p-6 bg-card">
            <h2 className="text-2xl font-bold mb-3">Who this itinerary is for</h2>
            <p className="text-muted-foreground">{it.whoItsFor}</p>
          </section>

          <section className="border rounded-xl p-6 bg-card">
            <h2 className="text-2xl font-bold mb-3">Highlights</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              {it.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-bold">Day-by-day plan</h2>
            <div className="space-y-4">
              {it.dailyPlan.map((d) => (
                <div key={d.day} className="border rounded-lg p-6 bg-card">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-semibold">
                      Day {d.day}: {d.title}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                      Readings: {d.readings.length}
                    </span>
                  </div>

                  <div className="mt-3 text-sm">
                    <div className="text-muted-foreground">
                      <span className="font-semibold text-foreground">Places:</span>{" "}
                      {d.places.map((p, idx) => (
                        <span key={`${p}-${idx}`}>
                          <Link
                            href={`/bible-places/${toPlaceSlug(p)}`}
                            className="underline underline-offset-2 hover:text-foreground"
                          >
                            {p}
                          </Link>
                          {idx < d.places.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                    <div className="text-muted-foreground mt-1">
                      <span className="font-semibold text-foreground">Readings:</span>{" "}
                      {d.readings.join("; ")}
                    </div>
                    <p className="text-muted-foreground mt-3">{d.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="border rounded-xl p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
            <h2 className="text-2xl font-bold mb-3">Request a tour quote</h2>
            <p className="text-muted-foreground mb-6">
              Planning for a church group or a first trip? Submit your preferences and we will propose a practical route.
            </p>
            <TourLeadForm
              placeName={it.title}
              placeSlug={it.slug}
              contextSlug={it.slug}
              contextType="itinerary"
            />

            <p className="text-xs text-muted-foreground mt-3">
              Prefer browsing destinations first?{" "}
              <Link href="/bible-places" className="underline hover:text-foreground">
                Explore Bible Places
              </Link>
              .
            </p>
          </section>

          <section className="border rounded-xl p-6 bg-card">
            <FAQSection
              faqs={it.faqs}
              pageUrl={canonicalUrl}
              title="Frequently asked questions about this itinerary"
              description="Logistics, pacing, and how to use Scripture readings during your trip."
            />
          </section>
        </article>
      </main>
    </>
  );
}
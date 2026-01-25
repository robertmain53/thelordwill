// app/[locale]/bible-travel/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { TRAVEL_ITINERARIES } from "@/data/travel-itineraries";
import { isValidLocale, type Locale, DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { buildAlternates } from "@/lib/i18n/links";
import { LocaleFallbackBanner, getFallbackRobotsMeta } from "@/components/locale-fallback-banner";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ItineraryListItem = {
  slug: string;
  title: string;
  metaDescription: string | null;
  days: number;
  region: string;
  _count: { dayPlans: number };
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    return {};
  }

  const alternates = buildAlternates("/bible-travel", locale);
  const isTranslated = locale === DEFAULT_LOCALE;

  return {
    title: "Bible Travel & Pilgrimage Itineraries",
    description: "Practical, Scripture-first travel plans designed for real-world pacing with daily readings and reflection structure.",
    alternates,
    robots: getFallbackRobotsMeta(locale, isTranslated),
  };
}

export default async function BibleTravelHubPage({ params }: PageProps) {
  const { locale: localeParam } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const isTranslated = locale === DEFAULT_LOCALE;

  // Fetch published itineraries from DB
  const dbItineraries: ItineraryListItem[] = await prisma.travelItinerary.findMany({
    where: { status: "published" },
    select: {
      slug: true,
      title: true,
      metaDescription: true,
      days: true,
      region: true,
      _count: { select: { dayPlans: true } },
    },
    orderBy: [{ days: "asc" }, { title: "asc" }],
  });

  const hasDbItineraries = dbItineraries.length > 0;

  return (
    <>
      {!isTranslated && (
        <LocaleFallbackBanner locale={locale} currentPath={`/${locale}/bible-travel`} />
      )}

      <main className="min-h-screen py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <header className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Bible Travel & Pilgrimage Itineraries</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Practical, Scripture-first travel plans designed for real-world pacing. Each itinerary includes daily readings,
              reflection structure, and planning notes.
            </p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hasDbItineraries ? (
              dbItineraries.map((it) => (
                <Link
                  key={it.slug}
                  href={`/${locale}/bible-travel/${it.slug}`}
                  className="group border rounded-lg p-6 bg-card hover:shadow-md hover:border-primary transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-2xl font-semibold group-hover:text-primary transition-colors">
                      {it.title}
                    </h2>
                    <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                      {it.days} days
                    </span>
                  </div>
                  <p className="mt-3 text-muted-foreground line-clamp-3">
                    {it.metaDescription || `A ${it.days}-day pilgrimage itinerary in ${it.region}.`}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <span>Region: <span className="text-foreground">{it.region}</span></span>
                    {it._count.dayPlans > 0 && (
                      <span>{it._count.dayPlans} day plans</span>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              TRAVEL_ITINERARIES.map((it) => (
                <Link
                  key={it.slug}
                  href={`/${locale}/bible-travel/${it.slug}`}
                  className="group border rounded-lg p-6 bg-card hover:shadow-md hover:border-primary transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-2xl font-semibold group-hover:text-primary transition-colors">
                      {it.title}
                    </h2>
                    <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                      {it.days} days
                    </span>
                  </div>
                  <p className="mt-3 text-muted-foreground">{it.metaDescription}</p>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Region: <span className="text-foreground">{it.region}</span>
                  </div>
                </Link>
              ))
            )}
          </section>

          {!hasDbItineraries && TRAVEL_ITINERARIES.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No travel itineraries available yet. Check back soon!
              </p>
            </div>
          )}

          <section className="mt-10 border rounded-xl p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
            <h2 className="text-2xl font-bold mb-3">Want help planning a discipleship-first tour?</h2>
            <p className="text-muted-foreground mb-6">
              If you are planning for a church group or a first-time pilgrimage, request a quote and we can recommend a practical route.
            </p>
            <Link
              href={`/${locale}/bible-places`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Explore Bible Places
              <span>→</span>
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getCanonicalUrl } from "@/lib/utils";
import { TranslationComparison } from "@/components/translation-comparison";
import { prepareTranslations } from "@/lib/translations";

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour to check for new day

export const metadata: Metadata = {
  title: "Prayer Points for Today | Daily Scripture-Based Prayers",
  description: "Start your day with powerful, Scripture-backed prayer points. Fresh daily prayers for breakthrough, protection, and blessing updated every 24 hours.",
  alternates: {
    canonical: getCanonicalUrl("/prayer-points/today"),
  },
};

async function getTodaysPrayerPoint() {
  // Get today's date (start of day in UTC)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Check if we already have a prayer point for today
  let dailyRecord = await prisma.dailyPrayerPoint.findUnique({
    where: { date: today },
  });

  let prayerPointId: string;

  if (dailyRecord) {
    // Use existing selection
    prayerPointId = dailyRecord.prayerPointId;
  } else {
    // Select a random prayer point from the daily rotation pool
    const rotationPool = await prisma.prayerPoint.findMany({
      where: { dailyRotation: true },
      select: { id: true },
    });

    if (rotationPool.length === 0) {
      // Fallback: if no prayer points in rotation, get any prayer point
      const fallback = await prisma.prayerPoint.findFirst({
        select: { id: true },
        orderBy: { priority: 'desc' },
      });

      if (!fallback) {
        throw new Error('No prayer points available');
      }

      prayerPointId = fallback.id;
    } else {
      // Randomly select from rotation pool
      const randomIndex = Math.floor(Math.random() * rotationPool.length);
      prayerPointId = rotationPool[randomIndex].id;
    }

    // Store today's selection
    try {
      await prisma.dailyPrayerPoint.create({
        data: {
          date: today,
          prayerPointId,
        },
      });
    } catch (error) {
      // If creation fails (race condition), fetch the existing record
      dailyRecord = await prisma.dailyPrayerPoint.findUnique({
        where: { date: today },
      });
      if (dailyRecord) {
        prayerPointId = dailyRecord.prayerPointId;
      }
    }
  }

  // Fetch the full prayer point with verses
  const prayerPoint = await prisma.prayerPoint.findUnique({
    where: { id: prayerPointId },
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
        take: 4, // Limit to 4 verses for daily rotation
      },
    },
  });

  return prayerPoint;
}

export default async function TodaysPrayerPointsPage() {
  const prayerPoint = await getTodaysPrayerPoint();

  if (!prayerPoint) {
    return (
      <main className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Prayer Points for Today</h1>
          <p className="text-muted-foreground">
            No prayer points are available at this time. Please check back later.
          </p>
        </div>
      </main>
    );
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const hasVerses = prayerPoint.verseMappings.length > 0;

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href="/prayer-points" className="hover:text-primary">
            Prayer Points
          </Link>
          <span className="mx-2">›</span>
          <span>Today</span>
        </nav>

        {/* Header */}
        <div className="mb-12 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 rounded-xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">
                {today}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold">
                Prayer Points for Today
              </h1>
            </div>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Today's focus: <span className="font-semibold text-foreground">{prayerPoint.title}</span>
          </p>
        </div>

        {/* Topic Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">{prayerPoint.title}</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {prayerPoint.description}
          </p>
        </section>

        {/* Today's Prayer Points */}
        {hasVerses ? (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Today's Scripture-Based Prayers</h2>
              <Link
                href={`/prayer-points/${prayerPoint.slug}`}
                className="text-sm text-primary hover:underline"
              >
                View all verses →
              </Link>
            </div>

            <div className="space-y-8">
              {prayerPoint.verseMappings.map((mapping, index) => {
                const verse = mapping.verse;
                const book = verse.book;
                const reference = `${book.name} ${verse.chapter}:${verse.verseNumber}`;

                return (
                  <article
                    key={mapping.id}
                    className="bg-card border rounded-xl p-8"
                  >
                    <header className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-primary">
                          Prayer Point #{index + 1}
                        </h3>
                        {mapping.prayerFocus && (
                          <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                            {mapping.prayerFocus}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-muted-foreground">
                        {reference}
                      </p>
                    </header>

                    {/* Verse Text */}
                    <blockquote className="text-lg leading-relaxed mb-6 pl-4 border-l-4 border-primary">
                      {verse.textKjv}
                    </blockquote>

                    {/* Prayer Context */}
                    {mapping.contextNote && (
                      <div className="bg-muted/50 rounded-lg p-4 mb-6">
                        <p className="text-sm font-semibold mb-2">How to Pray:</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {mapping.contextNote}
                        </p>
                      </div>
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
                We're currently curating powerful Bible verses for today's prayer focus: {prayerPoint.title.toLowerCase()}.
                Check back tomorrow for a fresh topic, or explore our complete collection of prayer points.
              </p>
              <Link
                href="/prayer-points"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Browse All Prayer Points
                <span>→</span>
              </Link>
            </div>
          </section>
        )}

        {/* Prayer Guide */}
        <section className="mb-12 bg-card border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">How to Use Today's Prayer Points</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary">
                1
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Set Aside Time</h3>
                <p className="text-sm">
                  Find a quiet place where you can focus without distractions. Morning is ideal, but any time works.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary">
                2
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Read Each Scripture</h3>
                <p className="text-sm">
                  Read each verse slowly and meditatively. Let God's Word speak to your heart before you begin praying.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary">
                3
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Pray with Faith</h3>
                <p className="text-sm">
                  Use these verses as your prayer foundation. Declare them over your life, personalize them to your situation, and believe God hears you.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary">
                4
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Return Tomorrow</h3>
                <p className="text-sm">
                  Come back tomorrow for fresh prayer points on a new topic. Consistent daily prayer builds spiritual strength and brings breakthrough.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-6 bg-card">
            <h3 className="text-xl font-bold mb-3">Explore More Prayer Points</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Browse our complete collection of Scripture-based prayer points for every situation.
            </p>
            <Link
              href="/prayer-points"
              className="inline-flex items-center gap-2 text-primary hover:underline font-semibold"
            >
              View All Prayer Points
              <span>→</span>
            </Link>
          </div>

          <div className="border rounded-lg p-6 bg-card">
            <h3 className="text-xl font-bold mb-3">Full {prayerPoint.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              View the complete collection of verses for this prayer topic.
            </p>
            <Link
              href={`/prayer-points/${prayerPoint.slug}`}
              className="inline-flex items-center gap-2 text-primary hover:underline font-semibold"
            >
              View Full Page
              <span>→</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

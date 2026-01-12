import type { Metadata } from "next";
import Link from "next/link";
import { getCanonicalUrl } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Prayer Points with Bible Verses | The Lord Will",
  description: "Powerful prayer points backed by Scripture for breakthrough, spiritual warfare, fasting, and every life situation. Biblical prayers that move mountains.",
  alternates: {
    canonical: getCanonicalUrl("/prayer-points"),
  },
};

export default async function PrayerPointsPage() {
  const prayerPoints = await prisma.prayerPoint.findMany({
    select: {
      slug: true,
      title: true,
      description: true,
      category: true,
      priority: true,
      _count: {
        select: {
          verseMappings: true,
        },
      },
    },
    orderBy: {
      priority: 'desc',
    },
  });

  // Group by category
  const categorized = prayerPoints.reduce((acc, point) => {
    const category = point.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(point);
    return acc;
  }, {} as Record<string, typeof prayerPoints>);

  // Category display names
  const categoryNames: Record<string, string> = {
    'breakthrough': 'Breakthrough & Victory',
    'spiritual-warfare': 'Spiritual Warfare',
    'financial': 'Financial Breakthrough',
    'fasting': 'Fasting & Prayer',
    'healing': 'Healing & Restoration',
    'deliverance': 'Deliverance & Freedom',
    'worship': 'Worship & Thanksgiving',
    'protection': 'Protection & Safety',
    'intercession': 'Intercession',
    'daily': 'Daily Prayer',
    'general': 'Powerful Prayers',
  };

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Prayer Points with Bible Verses
          </h1>
          <p className="text-xl text-muted-foreground">
            Powerful, Scripture-backed prayer points for breakthrough, spiritual warfare, and every life situation
          </p>
        </header>

        {/* Featured: Prayer Points for Today */}
        <section className="mb-16 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 rounded-xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-3xl md:text-4xl">🙏</span>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Prayer Points for Today
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Start your day with fresh, powerful prayer points from Scripture. Updated daily with targeted prayers for breakthrough, protection, and blessing.
              </p>
              <Link
                href="/prayer-points/today"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                View Today's Prayer Points
                <span className="text-lg">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* All Prayer Points by Category */}
        {Object.entries(categorized)
          .sort(([a], [b]) => {
            // Sort categories by the highest priority item in each category
            const maxA = Math.max(...categorized[a].map(p => p.priority));
            const maxB = Math.max(...categorized[b].map(p => p.priority));
            return maxB - maxA;
          })
          .map(([category, items]) => (
            <section key={category} className="mb-12">
              <h2 className="text-2xl font-bold mb-6">
                {categoryNames[category] || category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((prayerPoint) => (
                  <Link
                    key={prayerPoint.slug}
                    href={`/prayer-points/${prayerPoint.slug}`}
                    className="group border rounded-lg p-6 bg-card hover:shadow-md hover:border-primary transition-all"
                  >
                    <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                      {prayerPoint.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {prayerPoint.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {prayerPoint._count.verseMappings > 0
                          ? `${prayerPoint._count.verseMappings} verses`
                          : 'Coming soon'}
                      </span>
                      <span className="text-sm text-primary group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}

        {prayerPoints.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No prayer points have been added yet. Check back soon!
            </p>
          </div>
        )}

        {/* Info Section */}
        <section className="mt-16 bg-card border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Why Pray with Scripture?</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Praying God's Word back to Him is one of the most powerful forms of prayer. When we align our prayers
              with Scripture, we're praying according to God's will, and we can have confidence that He hears us
              (1 John 5:14-15).
            </p>
            <p>
              These prayer points are carefully crafted to include relevant Bible verses, giving you the spiritual
              authority and biblical foundation to pray with boldness and faith. Whether you're seeking breakthrough,
              engaging in spiritual warfare, or interceding for others, let God's Word guide your prayers.
            </p>
            <p className="font-semibold">
              "So shall my word be that goeth forth out of my mouth: it shall not return unto me void, but it shall
              accomplish that which I please" (Isaiah 55:11, KJV)
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

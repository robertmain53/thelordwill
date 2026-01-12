import type { Metadata } from "next";
import Link from "next/link";
import { getCanonicalUrl } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Bible Verses for Every Situation | The Lord Will",
  description: "Find relevant Bible verses for every life situation. Discover Scripture that addresses anxiety, fear, hope, peace, and more.",
  alternates: {
    canonical: getCanonicalUrl("/situations"),
  },
};

export default async function SituationsPage() {
  const situations = await prisma.situation.findMany({
    select: {
      slug: true,
      title: true,
      metaDescription: true,
      category: true,
      _count: {
        select: {
          verseMappings: true,
        },
      },
    },
    orderBy: {
      title: 'asc',
    },
  });

  // Group situations by category
  const categorized = situations.reduce((acc, situation) => {
    const category = situation.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(situation);
    return acc;
  }, {} as Record<string, typeof situations>);

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Bible Verses for Every Situation
          </h1>
          <p className="text-xl text-muted-foreground">
            Discover relevant Scripture for life's challenges and circumstances
          </p>
        </header>

        {Object.entries(categorized).map(([category, items]) => (
          <section key={category} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 capitalize">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((situation) => (
                <Link
                  key={situation.slug}
                  href={`/bible-verses-for/${situation.slug}`}
                  className="group border rounded-lg p-6 bg-card hover:shadow-md hover:border-primary transition-all"
                >
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {situation.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {situation.metaDescription}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {situation._count.verseMappings} verses
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

        {situations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No situations have been added yet. Check back soon!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

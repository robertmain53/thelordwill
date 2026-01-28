// app/situations/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getHubLinks } from "@/lib/internal-linking";
import { ExploreMore } from "@/components/related-section";
import {
  groupByCategorySlugWithDbLabels,
  normalizeCategorySlug,
} from "@/lib/content/category-labels";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SituationListItem = {
  slug: string;
  title: string;
  metaDescription: string;
  category: string | null;
  updatedAt: Date;
};

export default async function SituationsPage() {
  // Only published content goes to public list
  const situations: SituationListItem[] = await prisma.situation.findMany({
    where: { status: "published" },
    select: {
      slug: true,
      title: true,
      metaDescription: true,
      category: true,
      updatedAt: true,
    },
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
    take: 500,
  });

  // Collect distinct category slugs from published items
  const slugs = Array.from(
    new Set(situations.map((s) => normalizeCategorySlug(s.category))),
  );

  // Fetch labels from DB (overrides static fallbacks)
  const dbLabels = await prisma.taxonomyLabel.findMany({
    where: {
      scope: "situationCategory",
      key: { in: slugs },
      isActive: true,
    },
    select: { key: true, label: true, sortOrder: true },
  });

  // Group by slug using centralized helper (merges DB + static fallbacks)
  const categories = groupByCategorySlugWithDbLabels(
    situations,
    (s) => s.category,
    dbLabels,
  );

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold">Situations</h1>
          <p className="text-muted-foreground">
            Scripture-anchored guidance for real-life situations.
          </p>
        </header>

        {situations.length === 0 ? (
          <div className="text-muted-foreground">No published situations yet.</div>
        ) : (
          categories.map((c) => (
            <section key={c.slug} className="space-y-4">
              <h2 className="text-2xl font-bold">{c.label}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {c.items.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/bible-verses-for/${s.slug}`}
                    className="border rounded-lg p-5 bg-card hover:shadow-md hover:border-primary transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold">{s.title}</h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {s.updatedAt.toISOString().slice(0, 10)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                      {s.metaDescription}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}

        {/* Explore More Section - Links to other hubs */}
        <ExploreMore currentSection="/situations" hubs={getHubLinks()} />
      </div>
    </main>
  );
}

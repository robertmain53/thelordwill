// app/[locale]/prayer-points/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { isValidLocale, type Locale, DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { buildAlternates } from "@/lib/i18n/links";
import { LocaleFallbackBanner, getFallbackRobotsMeta } from "@/components/locale-fallback-banner";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PrayerPointListItem = {
  slug: string;
  title: string;
  description: string;
  category: string | null;
  priority: number;
  _count: { verseMappings: number };
};

function normalizeKey(v: string | null | undefined): string {
  const s = (v || "").trim();
  return s || "other";
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    return {};
  }

  const alternates = buildAlternates("/prayer-points", locale);

  // For non-English, content is fallback (noindex)
  const isTranslated = locale === DEFAULT_LOCALE;

  return {
    title: "Prayer Points",
    description: "Scripture-anchored topics with curated verses and practical prayer guidance.",
    alternates,
    robots: getFallbackRobotsMeta(locale, isTranslated),
  };
}

export default async function PrayerPointsPage({ params }: PageProps) {
  const { locale: localeParam } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const isTranslated = locale === DEFAULT_LOCALE;

  const prayerPoints: PrayerPointListItem[] = await prisma.prayerPoint.findMany({
    where: { status: "published" },
    select: {
      slug: true,
      title: true,
      description: true,
      category: true,
      priority: true,
      _count: { select: { verseMappings: true } },
    },
    orderBy: [{ priority: "desc" }, { title: "asc" }],
    take: 200,
  });

  // Collect distinct category keys from content
  const keys = Array.from(
    new Set(prayerPoints.map((p) => normalizeKey(p.category))),
  );

  // Resolve labels from DB (fully decoupled)
  const labels = await prisma.taxonomyLabel.findMany({
    where: {
      scope: "prayerPointCategory",
      key: { in: keys },
      isActive: true,
    },
    select: { key: true, label: true, sortOrder: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });

  const labelMap = new Map<string, { label: string; sortOrder: number }>();
  for (const l of labels) labelMap.set(l.key, { label: l.label, sortOrder: l.sortOrder });

  // Group by key; show label from DB; fallback if missing label record
  const groups = new Map<
    string,
    { key: string; label: string; sortOrder: number; items: PrayerPointListItem[] }
  >();

  for (const p of prayerPoints) {
    const key = normalizeKey(p.category);
    const meta = labelMap.get(key);

    const label = meta?.label || "Other";
    const sortOrder = meta?.sortOrder ?? 999;

    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, { key, label, sortOrder, items: [p] });
    } else {
      existing.items.push(p);
    }
  }

  const categories = Array.from(groups.values()).sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.label.localeCompare(b.label, "en");
  });

  return (
    <>
      {!isTranslated && (
        <LocaleFallbackBanner locale={locale} currentPath={`/${locale}/prayer-points`} />
      )}

      <main className="min-h-screen py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-10">
          <header className="space-y-2">
            <h1 className="text-4xl font-bold">Prayer Points</h1>
            <p className="text-muted-foreground">
              Scripture-anchored topics with curated verses and practical prayer guidance.
            </p>
          </header>

          {categories.map((c) => (
            <section key={c.key} className="space-y-4">
              <h2 className="text-2xl font-bold">{c.label}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {c.items.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/${locale}/prayer-points/${p.slug}`}
                    className="border rounded-lg p-5 bg-card hover:shadow-md hover:border-primary transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold">{p.title}</h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {p._count.verseMappings} verse{p._count.verseMappings === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{p.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          {prayerPoints.length === 0 && (
            <div className="text-muted-foreground">No published prayer points yet.</div>
          )}
        </div>
      </main>
    </>
  );
}

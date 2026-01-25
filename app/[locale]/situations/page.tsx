// app/[locale]/situations/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { isValidLocale, type Locale, DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { buildAlternates } from "@/lib/i18n/links";
import { LocaleFallbackBanner, getFallbackRobotsMeta } from "@/components/locale-fallback-banner";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SituationListItem = {
  slug: string;
  title: string;
  metaDescription: string;
  category: string | null;
  updatedAt: Date;
};

const SCOPE = "situationCategory";
const FALLBACK_CATEGORY_KEY = "other";
const FALLBACK_CATEGORY_LABEL = "Other";

function normKey(v: string | null | undefined): string {
  const s = (v || "").trim();
  return s ? s : FALLBACK_CATEGORY_KEY;
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    return {};
  }

  const alternates = buildAlternates("/situations", locale);
  const isTranslated = locale === DEFAULT_LOCALE;

  return {
    title: "Situations - Bible Verses for Life Circumstances",
    description: "Scripture-anchored guidance for real-life situations.",
    alternates,
    robots: getFallbackRobotsMeta(locale, isTranslated),
  };
}

export default async function SituationsPage({ params }: PageProps) {
  const { locale: localeParam } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const isTranslated = locale === DEFAULT_LOCALE;

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

  const categoryKeys = Array.from(
    new Set(situations.map((s) => normKey(s.category))),
  );

  const labelRows = await prisma.taxonomyLabel.findMany({
    where: {
      scope: SCOPE,
      key: { in: categoryKeys },
    },
    select: { key: true, label: true },
  });

  const labelMap = new Map<string, string>();
  for (const r of labelRows) {
    const k = (r.key || "").trim();
    const lbl = (r.label || "").trim();
    if (k && lbl) labelMap.set(k, lbl);
  }

  if (!labelMap.has(FALLBACK_CATEGORY_KEY)) {
    labelMap.set(FALLBACK_CATEGORY_KEY, FALLBACK_CATEGORY_LABEL);
  }

  const groups = new Map<string, SituationListItem[]>();
  for (const s of situations) {
    const key = normKey(s.category);
    const arr = groups.get(key) || [];
    arr.push(s);
    groups.set(key, arr);
  }

  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    const la = labelMap.get(a) || a;
    const lb = labelMap.get(b) || b;
    return la.localeCompare(lb, "en");
  });

  return (
    <>
      {!isTranslated && (
        <LocaleFallbackBanner locale={locale} currentPath={`/${locale}/situations`} />
      )}

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
            sortedKeys.map((key) => {
              const label = labelMap.get(key) || key;
              const items = groups.get(key) || [];
              return (
                <section key={key} className="space-y-4">
                  <h2 className="text-2xl font-bold">{label}</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((s) => (
                      <Link
                        key={s.slug}
                        href={`/${locale}/bible-verses-for/${s.slug}`}
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
              );
            })
          )}
        </div>
      </main>
    </>
  );
}

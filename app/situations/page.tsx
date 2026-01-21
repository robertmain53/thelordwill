// app/situations/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SituationListItem = {
  slug: string;
  title: string;
  metaDescription: string;
  category: string | null;
  updatedAt: Date;
};

type CategoryLabelRow = {
  key: string;
  label: string;
};

const SCOPE = "situationCategory";
const FALLBACK_CATEGORY_KEY = "other";
const FALLBACK_CATEGORY_LABEL = "Other";

function normKey(v: string | null | undefined): string {
  const s = (v || "").trim();
  return s ? s : FALLBACK_CATEGORY_KEY;
}

function buildCategoryLabelMap(rows: CategoryLabelRow[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const r of rows) {
    const k = (r.key || "").trim();
    const lbl = (r.label || "").trim();
    if (k && lbl) m.set(k, lbl);
  }
  return m;
}

export default async function SituationsPage() {
  // 1) Only published content goes to public list
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

  // 2) Collect distinct category keys from published items
  const categoryKeys = Array.from(
    new Set(situations.map((s) => normKey(s.category))),
  );

  // 3) Fetch labels for those keys (decoupled taxonomy)
  // Adjust this model name/fields if yours differ.
  const labelRows: CategoryLabelRow[] = await prisma.taxonomyLabel.findMany({
    where: {
      scope: SCOPE,
      key: { in: categoryKeys },
    },
    select: { key: true, label: true },
  });

  const labelMap = buildCategoryLabelMap(labelRows);

  // Ensure fallback exists
  if (!labelMap.has(FALLBACK_CATEGORY_KEY)) {
    labelMap.set(FALLBACK_CATEGORY_KEY, FALLBACK_CATEGORY_LABEL);
  }

  // 4) Group situations by category key
  const groups = new Map<string, SituationListItem[]>();
  for (const s of situations) {
    const key = normKey(s.category);
    const arr = groups.get(key) || [];
    arr.push(s);
    groups.set(key, arr);
  }

  // 5) Sort categories by their *labels* (not keys), stable + readable
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    const la = labelMap.get(a) || a;
    const lb = labelMap.get(b) || b;
    return la.localeCompare(lb, "en");
  });

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
                      href={`/situations/${s.slug}`}
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
  );
}

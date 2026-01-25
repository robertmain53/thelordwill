// app/admin/coverage/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type CoverageStats = {
  entityType: string;
  entityLabel: string;
  adminPath: string;
  total: number;
  published: number;
  draft: number;
  missingContent: number;
  missingMeta: number;
  missingVerseMappings: number;
};

type FailingRecord = {
  id: string;
  title: string;
  status: string;
  issues: string[];
};

type EntityIssues = {
  entityType: string;
  entityLabel: string;
  adminPath: string;
  records: FailingRecord[];
};

async function getCoverageStats(): Promise<CoverageStats[]> {
  const stats: CoverageStats[] = [];

  // Situations
  const situations = await prisma.situation.findMany({
    select: {
      id: true,
      status: true,
      content: true,
      metaDescription: true,
      _count: { select: { verseMappings: true } },
    },
  });
  stats.push({
    entityType: "situation",
    entityLabel: "Situations",
    adminPath: "/admin/situations",
    total: situations.length,
    published: situations.filter((s) => s.status === "published").length,
    draft: situations.filter((s) => s.status !== "published").length,
    missingContent: situations.filter((s) => !s.content?.trim()).length,
    missingMeta: situations.filter((s) => !s.metaDescription?.trim()).length,
    missingVerseMappings: situations.filter((s) => s._count.verseMappings === 0).length,
  });

  // Professions
  const professions = await prisma.profession.findMany({
    select: {
      id: true,
      status: true,
      content: true,
      description: true,
      metaDescription: true,
    },
  });
  stats.push({
    entityType: "profession",
    entityLabel: "Professions",
    adminPath: "/admin/professions",
    total: professions.length,
    published: professions.filter((p) => p.status === "published").length,
    draft: professions.filter((p) => p.status !== "published").length,
    missingContent: professions.filter((p) => !p.content?.trim()).length,
    missingMeta: professions.filter((p) => !p.metaDescription?.trim()).length,
    missingVerseMappings: 0,
  });

  // Prayer Points
  const prayerPoints = await prisma.prayerPoint.findMany({
    select: {
      id: true,
      status: true,
      content: true,
      description: true,
      metaDescription: true,
      _count: { select: { verseMappings: true } },
    },
  });
  stats.push({
    entityType: "prayerPoint",
    entityLabel: "Prayer Points",
    adminPath: "/admin/prayer-points",
    total: prayerPoints.length,
    published: prayerPoints.filter((p) => p.status === "published").length,
    draft: prayerPoints.filter((p) => p.status !== "published").length,
    missingContent: prayerPoints.filter((p) => !p.content?.trim()).length,
    missingMeta: prayerPoints.filter((p) => !p.metaDescription?.trim()).length,
    missingVerseMappings: prayerPoints.filter((p) => p._count.verseMappings === 0).length,
  });

  // Places
  const places = await prisma.place.findMany({
    select: {
      id: true,
      status: true,
      description: true,
      historicalInfo: true,
      biblicalContext: true,
      metaDescription: true,
      _count: { select: { verseMentions: true } },
    },
  });
  stats.push({
    entityType: "place",
    entityLabel: "Places",
    adminPath: "/admin/places",
    total: places.length,
    published: places.filter((p) => p.status === "published").length,
    draft: places.filter((p) => p.status !== "published").length,
    missingContent: places.filter(
      (p) => !p.historicalInfo?.trim() && !p.biblicalContext?.trim()
    ).length,
    missingMeta: places.filter((p) => !p.metaDescription?.trim()).length,
    missingVerseMappings: places.filter((p) => p._count.verseMentions === 0).length,
  });

  // Travel Itineraries
  const itineraries = await prisma.travelItinerary.findMany({
    select: {
      id: true,
      status: true,
      content: true,
      metaTitle: true,
      metaDescription: true,
      _count: { select: { dayPlans: true, faqs: true } },
    },
  });
  stats.push({
    entityType: "travelItinerary",
    entityLabel: "Travel Itineraries",
    adminPath: "/admin/travel-itineraries",
    total: itineraries.length,
    published: itineraries.filter((i) => i.status === "published").length,
    draft: itineraries.filter((i) => i.status !== "published").length,
    missingContent: itineraries.filter((i) => !i.content?.trim()).length,
    missingMeta: itineraries.filter(
      (i) => !i.metaTitle?.trim() || !i.metaDescription?.trim()
    ).length,
    missingVerseMappings: itineraries.filter((i) => i._count.dayPlans === 0).length,
  });

  return stats;
}

async function getFailingRecords(): Promise<EntityIssues[]> {
  const issues: EntityIssues[] = [];

  // Situations with issues (published only)
  const situations = await prisma.situation.findMany({
    where: { status: "published" },
    select: {
      id: true,
      title: true,
      status: true,
      content: true,
      metaDescription: true,
      _count: { select: { verseMappings: true } },
    },
  });
  const situationIssues: FailingRecord[] = [];
  for (const s of situations) {
    const problems: string[] = [];
    if (!s.content?.trim()) problems.push("Missing content");
    if (!s.metaDescription?.trim()) problems.push("Missing meta description");
    if (s._count.verseMappings === 0) problems.push("No verse mappings");
    if (problems.length > 0) {
      situationIssues.push({ id: s.id, title: s.title, status: s.status, issues: problems });
    }
  }
  if (situationIssues.length > 0) {
    issues.push({
      entityType: "situation",
      entityLabel: "Situations",
      adminPath: "/admin/situations",
      records: situationIssues,
    });
  }

  // Professions with issues (published only)
  const professions = await prisma.profession.findMany({
    where: { status: "published" },
    select: {
      id: true,
      title: true,
      status: true,
      content: true,
      metaDescription: true,
    },
  });
  const professionIssues: FailingRecord[] = [];
  for (const p of professions) {
    const problems: string[] = [];
    if (!p.content?.trim()) problems.push("Missing content");
    if (!p.metaDescription?.trim()) problems.push("Missing meta description");
    if (problems.length > 0) {
      professionIssues.push({ id: p.id, title: p.title, status: p.status, issues: problems });
    }
  }
  if (professionIssues.length > 0) {
    issues.push({
      entityType: "profession",
      entityLabel: "Professions",
      adminPath: "/admin/professions",
      records: professionIssues,
    });
  }

  // Prayer Points with issues (published only)
  const prayerPoints = await prisma.prayerPoint.findMany({
    where: { status: "published" },
    select: {
      id: true,
      title: true,
      status: true,
      content: true,
      metaDescription: true,
      _count: { select: { verseMappings: true } },
    },
  });
  const prayerPointIssues: FailingRecord[] = [];
  for (const p of prayerPoints) {
    const problems: string[] = [];
    if (!p.content?.trim()) problems.push("Missing content");
    if (!p.metaDescription?.trim()) problems.push("Missing meta description");
    if (p._count.verseMappings === 0) problems.push("No verse mappings");
    if (problems.length > 0) {
      prayerPointIssues.push({ id: p.id, title: p.title, status: p.status, issues: problems });
    }
  }
  if (prayerPointIssues.length > 0) {
    issues.push({
      entityType: "prayerPoint",
      entityLabel: "Prayer Points",
      adminPath: "/admin/prayer-points",
      records: prayerPointIssues,
    });
  }

  // Places with issues (published only)
  const places = await prisma.place.findMany({
    where: { status: "published" },
    select: {
      id: true,
      name: true,
      status: true,
      historicalInfo: true,
      biblicalContext: true,
      metaDescription: true,
      _count: { select: { verseMentions: true } },
    },
  });
  const placeIssues: FailingRecord[] = [];
  for (const p of places) {
    const problems: string[] = [];
    if (!p.historicalInfo?.trim() && !p.biblicalContext?.trim()) problems.push("Missing content");
    if (!p.metaDescription?.trim()) problems.push("Missing meta description");
    if (p._count.verseMentions === 0) problems.push("No verse mentions");
    if (problems.length > 0) {
      placeIssues.push({ id: p.id, title: p.name, status: p.status, issues: problems });
    }
  }
  if (placeIssues.length > 0) {
    issues.push({
      entityType: "place",
      entityLabel: "Places",
      adminPath: "/admin/places",
      records: placeIssues,
    });
  }

  // Travel Itineraries with issues (published only)
  const itineraries = await prisma.travelItinerary.findMany({
    where: { status: "published" },
    select: {
      id: true,
      title: true,
      status: true,
      content: true,
      metaTitle: true,
      metaDescription: true,
      _count: { select: { dayPlans: true } },
    },
  });
  const itineraryIssues: FailingRecord[] = [];
  for (const i of itineraries) {
    const problems: string[] = [];
    if (!i.content?.trim()) problems.push("Missing content");
    if (!i.metaTitle?.trim() || !i.metaDescription?.trim()) problems.push("Missing meta");
    if (i._count.dayPlans === 0) problems.push("No day plans");
    if (problems.length > 0) {
      itineraryIssues.push({ id: i.id, title: i.title, status: i.status, issues: problems });
    }
  }
  if (itineraryIssues.length > 0) {
    issues.push({
      entityType: "travelItinerary",
      entityLabel: "Travel Itineraries",
      adminPath: "/admin/travel-itineraries",
      records: itineraryIssues,
    });
  }

  return issues;
}

function StatusBadge({ value, total, type }: { value: number; total: number; type: "good" | "warning" | "neutral" }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const colorMap = {
    good: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    neutral: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorMap[type]}`}>
      {value} ({pct}%)
    </span>
  );
}

export default async function CoveragePage() {
  const [stats, failingRecords] = await Promise.all([
    getCoverageStats(),
    getFailingRecords(),
  ]);

  const totals = stats.reduce(
    (acc, s) => ({
      total: acc.total + s.total,
      published: acc.published + s.published,
      draft: acc.draft + s.draft,
      missingContent: acc.missingContent + s.missingContent,
      missingMeta: acc.missingMeta + s.missingMeta,
      missingVerseMappings: acc.missingVerseMappings + s.missingVerseMappings,
    }),
    { total: 0, published: 0, draft: 0, missingContent: 0, missingMeta: 0, missingVerseMappings: 0 }
  );

  const totalFailingRecords = failingRecords.reduce((acc, e) => acc + e.records.length, 0);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
            ← Admin
          </Link>
        </div>
        <h1 className="text-3xl font-bold">Content Coverage</h1>
        <p className="text-muted-foreground">
          Overview of content completeness across all entity types.
        </p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-2xl font-bold">{totals.total}</div>
          <div className="text-sm text-muted-foreground">Total Records</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-2xl font-bold text-green-600">{totals.published}</div>
          <div className="text-sm text-muted-foreground">Published</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-2xl font-bold text-gray-500">{totals.draft}</div>
          <div className="text-sm text-muted-foreground">Draft</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-2xl font-bold text-amber-600">{totals.missingContent}</div>
          <div className="text-sm text-muted-foreground">Missing Content</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-2xl font-bold text-amber-600">{totals.missingMeta}</div>
          <div className="text-sm text-muted-foreground">Missing Meta</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-2xl font-bold text-amber-600">{totals.missingVerseMappings}</div>
          <div className="text-sm text-muted-foreground">Missing Verses</div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="border rounded-xl bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-semibold">Entity Type</th>
              <th className="text-right p-4 font-semibold">Total</th>
              <th className="text-right p-4 font-semibold">Published</th>
              <th className="text-right p-4 font-semibold">Draft</th>
              <th className="text-right p-4 font-semibold">Missing Content</th>
              <th className="text-right p-4 font-semibold">Missing Meta</th>
              <th className="text-right p-4 font-semibold">Missing Verses</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {stats.map((s) => (
              <tr key={s.entityType} className="hover:bg-muted/30 transition-colors">
                <td className="p-4">
                  <Link href={s.adminPath} className="font-medium hover:text-primary hover:underline">
                    {s.entityLabel}
                  </Link>
                </td>
                <td className="p-4 text-right font-mono">{s.total}</td>
                <td className="p-4 text-right">
                  <StatusBadge value={s.published} total={s.total} type="good" />
                </td>
                <td className="p-4 text-right">
                  <StatusBadge value={s.draft} total={s.total} type="neutral" />
                </td>
                <td className="p-4 text-right">
                  {s.missingContent > 0 ? (
                    <StatusBadge value={s.missingContent} total={s.total} type="warning" />
                  ) : (
                    <span className="text-green-600">✓</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  {s.missingMeta > 0 ? (
                    <StatusBadge value={s.missingMeta} total={s.total} type="warning" />
                  ) : (
                    <span className="text-green-600">✓</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  {s.missingVerseMappings > 0 ? (
                    <StatusBadge value={s.missingVerseMappings} total={s.total} type="warning" />
                  ) : (
                    <span className="text-green-600">✓</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-muted/50 font-semibold">
            <tr>
              <td className="p-4">Totals</td>
              <td className="p-4 text-right font-mono">{totals.total}</td>
              <td className="p-4 text-right">
                <StatusBadge value={totals.published} total={totals.total} type="good" />
              </td>
              <td className="p-4 text-right">
                <StatusBadge value={totals.draft} total={totals.total} type="neutral" />
              </td>
              <td className="p-4 text-right">
                {totals.missingContent > 0 ? (
                  <StatusBadge value={totals.missingContent} total={totals.total} type="warning" />
                ) : (
                  <span className="text-green-600">✓</span>
                )}
              </td>
              <td className="p-4 text-right">
                {totals.missingMeta > 0 ? (
                  <StatusBadge value={totals.missingMeta} total={totals.total} type="warning" />
                ) : (
                  <span className="text-green-600">✓</span>
                )}
              </td>
              <td className="p-4 text-right">
                {totals.missingVerseMappings > 0 ? (
                  <StatusBadge value={totals.missingVerseMappings} total={totals.total} type="warning" />
                ) : (
                  <span className="text-green-600">✓</span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Failing Records Section */}
      {totalFailingRecords > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">
            Published Records with Issues ({totalFailingRecords})
          </h2>
          <p className="text-muted-foreground">
            These published records have missing required fields. Click to edit.
          </p>

          {failingRecords.map((entity) => (
            <div key={entity.entityType} className="border rounded-xl bg-card overflow-hidden">
              <div className="bg-muted/50 p-4 border-b">
                <h3 className="font-semibold">
                  {entity.entityLabel} ({entity.records.length} issues)
                </h3>
              </div>
              <div className="divide-y">
                {entity.records.map((record) => (
                  <div key={record.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`${entity.adminPath}/${record.id}`}
                        className="font-medium text-primary hover:underline truncate block"
                      >
                        {record.title}
                      </Link>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {record.issues.map((issue) => (
                          <span
                            key={issue}
                            className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200"
                          >
                            {issue}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Link
                      href={`${entity.adminPath}/${record.id}`}
                      className="shrink-0 px-3 py-1.5 text-sm border rounded hover:bg-muted"
                    >
                      Edit
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalFailingRecords === 0 && (
        <div className="border rounded-xl bg-green-50 p-8 text-center">
          <div className="text-3xl mb-3">✓</div>
          <h2 className="text-xl font-bold text-green-800 mb-2">All Published Content Complete</h2>
          <p className="text-green-700">
            All published records have the required content, meta descriptions, and verse mappings.
          </p>
        </div>
      )}

      {/* Translation Status Banner */}
      <div className="border rounded-xl bg-blue-50 p-6">
        <h2 className="text-xl font-bold text-blue-800 mb-3">Translation Status</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">EN</div>
            <div className="text-sm text-muted-foreground">Primary</div>
            <div className="text-xs text-green-700 mt-1">{totals.published} published</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">ES</div>
            <div className="text-sm text-muted-foreground">Fallback</div>
            <div className="text-xs text-amber-700 mt-1">0 translated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">PT</div>
            <div className="text-sm text-muted-foreground">Fallback</div>
            <div className="text-xs text-amber-700 mt-1">0 translated</div>
          </div>
        </div>
        <p className="text-sm text-blue-700">
          ES and PT routes render English content with a fallback banner and noindex meta tag until translations are added.
        </p>
      </div>

      {/* Legend */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p><strong>Missing Content:</strong> Records without main content body (historicalInfo/biblicalContext for Places, content for others)</p>
        <p><strong>Missing Meta:</strong> Records without metaDescription (or metaTitle for itineraries)</p>
        <p><strong>Missing Verses:</strong> Records without verse mappings (dayPlans for itineraries)</p>
      </div>
    </div>
  );
}

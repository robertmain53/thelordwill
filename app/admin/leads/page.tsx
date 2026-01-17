// app/admin/leads/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function asString(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function clampInt(v: string | undefined, min: number, max: number, fallback: number): number {
  const n = Number.parseInt(v || "", 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function buildWhere(status?: string, q?: string, contextType?: string) {
  const where: any = {};
  if (status && status !== "all") where.status = status;
  if (contextType && contextType !== "all") where.contextType = contextType;

  if (q && q.trim()) {
    const query = q.trim();
    where.OR = [
      { email: { contains: query, mode: "insensitive" } },
      { name: { contains: query, mode: "insensitive" } },
      { contextSlug: { contains: query, mode: "insensitive" } },
      { contextName: { contains: query, mode: "insensitive" } },
      { sourcePage: { contains: query, mode: "insensitive" } },
      { utmSource: { contains: query, mode: "insensitive" } },
      { utmCampaign: { contains: query, mode: "insensitive" } },
      { gclid: { contains: query, mode: "insensitive" } },
    ];
  }
  return where;
}

function buildHref(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "" || v === "all") continue;
    sp.set(k, String(v));
  }
  const qs = sp.toString();
  return `/admin/leads${qs ? `?${qs}` : ""}`;
}

export default async function AdminLeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;

  const status = asString(sp.status) || "all";
  const contextType = asString(sp.contextType) || "all";
  const q = asString(sp.q) || "";
  const page = clampInt(asString(sp.page), 1, 10_000, 1);
  const pageSize = clampInt(asString(sp.pageSize), 10, 200, 50);

  const where = buildWhere(status, q, contextType);

  const [total, leads] = await Promise.all([
    prisma.tourLead.count({ where }),
    prisma.tourLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true,
        createdAt: true,
        status: true,
        name: true,
        email: true,
        phone: true,
        country: true,
        budget: true,
        groupSize: true,
        groupSizeRaw: true,
        travelDates: true,
        contextType: true,
        contextSlug: true,
        contextName: true,
        sourcePlace: true,
        sourcePage: true,
        sourceReferrer: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        utmTerm: true,
        utmContent: true,
        gclid: true,
        fbclid: true,
        affiliateId: true,
        commission: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  const statuses = ["all", "new", "contacted", "quoted", "booked", "lost"];
  const contextTypes = ["all", "place", "itinerary"];

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Tour Leads</h1>
          <p className="text-muted-foreground">
            Total: <span className="font-medium text-foreground">{total}</span> · Page{" "}
            <span className="font-medium text-foreground">
              {page}/{totalPages}
            </span>
          </p>
        </header>

        {/* Filters */}
        <section className="border rounded-xl bg-card p-4">
          <form className="grid grid-cols-1 md:grid-cols-12 gap-3" action="/admin/leads" method="get">
            <div className="md:col-span-5">
              <label className="block text-sm font-medium mb-1" htmlFor="q">
                Search
              </label>
              <input
                id="q"
                name="q"
                defaultValue={q}
                placeholder="email, name, slug, source page, UTM…"
                className="w-full rounded-md border px-3 py-2 bg-background"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-1" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={status}
                className="w-full rounded-md border px-3 py-2 bg-background"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" htmlFor="contextType">
                Context
              </label>
              <select
                id="contextType"
                name="contextType"
                defaultValue={contextType}
                className="w-full rounded-md border px-3 py-2 bg-background"
              >
                {contextTypes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" htmlFor="pageSize">
                Page size
              </label>
              <select
                id="pageSize"
                name="pageSize"
                defaultValue={String(pageSize)}
                className="w-full rounded-md border px-3 py-2 bg-background"
              >
                {[25, 50, 100, 200].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {/* Keep page reset */}
            <input type="hidden" name="page" value="1" />

            <div className="md:col-span-12 flex items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground font-medium"
              >
                Apply
              </button>

              <Link
                href="/admin/leads"
                className="inline-flex items-center justify-center rounded-md border px-4 py-2 font-medium"
              >
                Reset
              </Link>

              <div className="ml-auto text-sm text-muted-foreground">
                Showing {leads.length} of {total}
              </div>
            </div>
          </form>
        </section>

        {/* Table */}
        <section className="border rounded-xl bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Context</th>
                  <th className="px-4 py-3">Prefs</th>
                  <th className="px-4 py-3">Attribution</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">ID</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-muted-foreground" colSpan={8}>
                      No leads found for the current filters.
                    </td>
                  </tr>
                ) : (
                  leads.map((l) => (
                    <tr key={l.id} className="border-t">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{l.name}</div>
                        <div className="text-muted-foreground">{l.email}</div>
                        {(l.phone || l.country) && (
                          <div className="text-muted-foreground">
                            {l.phone || "—"} · {l.country || "—"}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{l.contextType || "—"}</div>
                        <div className="text-muted-foreground">{l.contextSlug || "—"}</div>
                        {l.contextName && <div className="text-muted-foreground">{l.contextName}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-muted-foreground">Group:</span>{" "}
                          {l.groupSize ?? "—"}
                          {l.groupSizeRaw ? ` (${l.groupSizeRaw})` : ""}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Budget:</span> {l.budget || "—"}
                        </div>
                        <div className="text-muted-foreground">{l.travelDates || ""}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-muted-foreground">
                          utm_source: <span className="text-foreground">{l.utmSource || "—"}</span>
                        </div>
                        <div className="text-muted-foreground">
                          utm_campaign: <span className="text-foreground">{l.utmCampaign || "—"}</span>
                        </div>
                        <div className="text-muted-foreground">
                          gclid: <span className="text-foreground">{l.gclid || "—"}</span>
                        </div>
                        <div className="text-muted-foreground">
                          fbclid: <span className="text-foreground">{l.fbclid || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-muted-foreground">
                          place: <span className="text-foreground">{l.sourcePlace || "—"}</span>
                        </div>
                        <div className="text-muted-foreground truncate max-w-[260px]" title={l.sourcePage || ""}>
                          page: <span className="text-foreground">{l.sourcePage || "—"}</span>
                        </div>
                        <div className="text-muted-foreground truncate max-w-[260px]" title={l.sourceReferrer || ""}>
                          ref: <span className="text-foreground">{l.sourceReferrer || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{l.id}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t bg-muted/20 px-4 py-3 flex items-center gap-3">
            <Link
              href={buildHref({ q, status, contextType, pageSize, page: 1 })}
              className="text-sm underline"
            >
              First
            </Link>
            <Link
              href={buildHref({ q, status, contextType, pageSize, page: prevPage })}
              className="text-sm underline"
            >
              Prev
            </Link>

            <span className="text-sm text-muted-foreground">
              Page <span className="text-foreground font-medium">{page}</span> / {totalPages}
            </span>

            <Link
              href={buildHref({ q, status, contextType, pageSize, page: nextPage })}
              className="text-sm underline"
            >
              Next
            </Link>
            <Link
              href={buildHref({ q, status, contextType, pageSize, page: totalPages })}
              className="text-sm underline"
            >
              Last
            </Link>

            <div className="ml-auto text-xs text-muted-foreground">
              Commission (est.):{" "}
              <span className="text-foreground font-medium">
                {leads.reduce((sum, l) => sum + (l.commission ?? 0), 0).toFixed(0)}
              </span>{" "}
              · Affiliate: <span className="text-foreground font-medium">{leads[0]?.affiliateId || "—"}</span>
            </div>
          </div>
        </section>

        <section className="text-xs text-muted-foreground">
          Note: this is a minimal internal dashboard. If you want hard protection, add middleware auth or restrict by IP/Vercel protection.
        </section>
      </div>
    </main>
  );
}

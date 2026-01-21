// app/admin/leads/page.tsx
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type SP = {
  q?: string;
  status?: string;
  contextType?: string;
  page?: string;
};

const STATUS_OPTIONS = ["all", "new", "contacted", "booked", "closed"] as const;
type StatusOpt = (typeof STATUS_OPTIONS)[number];

function normalizeStatus(v: string | undefined): StatusOpt {
  const s = (v || "").trim().toLowerCase();
  return (STATUS_OPTIONS as readonly string[]).includes(s) ? (s as StatusOpt) : "all";
}

function toInt(v: string | undefined, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : fallback;
}

function buildWhere(status: StatusOpt, q: string, contextType: string): Prisma.TourLeadWhereInput {
  const AND: Prisma.TourLeadWhereInput[] = [];

  if (status !== "all") AND.push({ status });
  if (contextType) AND.push({ contextType });

  if (q) {
    AND.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { country: { contains: q, mode: "insensitive" } },
        { sourcePlace: { contains: q, mode: "insensitive" } },
        { sourcePage: { contains: q, mode: "insensitive" } },
        { contextName: { contains: q, mode: "insensitive" } },
        { contextSlug: { contains: q, mode: "insensitive" } },
        { utmSource: { contains: q, mode: "insensitive" } },
        { utmCampaign: { contains: q, mode: "insensitive" } },
        { gclid: { contains: q, mode: "insensitive" } },
        { fbclid: { contains: q, mode: "insensitive" } },
        { affiliateId: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  return AND.length ? { AND } : {};
}

function isoDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toISOString().slice(0, 10);
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const q = (sp?.q || "").trim();
  const status = normalizeStatus(sp?.status);
  const contextType = (sp?.contextType || "").trim();
  const page = toInt(sp?.page, 1);

  const take = 50;
  const skip = (page - 1) * take;

  const where = buildWhere(status, q, contextType);

  const [total, leads] = await Promise.all([
    prisma.tourLead.count({ where }),
    prisma.tourLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        status: true,

        name: true,
        email: true,
        phone: true,
        country: true,

        interestedIn: true,
        travelDates: true,
        groupSize: true,
        groupSizeRaw: true,
        budget: true,

        notes: true,
        contactedAt: true,
        bookedAt: true,

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

        place: {
          select: { name: true, slug: true },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / take));

  const baseHref = "/admin/leads";
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (status !== "all") qs.set("status", status);
  if (contextType) qs.set("contextType", contextType);

  const mkHref = (p: number) => {
    const copy = new URLSearchParams(qs.toString());
    if (p > 1) copy.set("page", String(p));
    return `${baseHref}?${copy.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leads</h1>
        <p className="text-muted-foreground">Review tour leads captured from public pages.</p>
      </div>

      {/* Filters */}
      <form className="flex flex-col md:flex-row gap-2" action={baseHref} method="get">
        <input
          name="q"
          defaultValue={q}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Search name, email, phone, context, utm, gclid, notes…"
        />

        <select name="status" defaultValue={status} className="border rounded px-3 py-2">
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s}
            </option>
          ))}
        </select>

        <select name="contextType" defaultValue={contextType} className="border rounded px-3 py-2">
          <option value="">All context types</option>
          <option value="place">place</option>
          <option value="itinerary">itinerary</option>
          <option value="situation">situation</option>
          <option value="profession">profession</option>
          <option value="prayer-point">prayer-point</option>
        </select>

        <button className="border rounded px-4 py-2 hover:bg-muted" type="submit">
          Apply
        </button>
      </form>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{leads.length}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span> leads
        {totalPages > 1 ? ` (page ${page} of ${totalPages})` : ""}.
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted text-xs font-semibold">
          <div className="col-span-2">Created</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">Contact</div>
          <div className="col-span-3">Context</div>
          <div className="col-span-2">Attribution</div>
        </div>

        {leads.length === 0 ? (
          <div className="px-4 py-10 text-sm text-muted-foreground">No leads found.</div>
        ) : (
          leads.map((l) => (
            <div key={l.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-t text-sm items-start">
              <div className="col-span-2 text-xs text-muted-foreground">
                {isoDate(l.createdAt)}
                <div className="mt-1">
                  <span className="text-[11px]">contacted:</span> {isoDate(l.contactedAt)}
                </div>
                <div>
                  <span className="text-[11px]">booked:</span> {isoDate(l.bookedAt)}
                </div>
              </div>

              <div className="col-span-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs border bg-muted">
                  {l.status || "—"}
                </span>
                {typeof l.commission === "number" ? (
                  <div className="mt-1 text-xs text-muted-foreground">
                    commission: {l.commission.toFixed(2)}
                  </div>
                ) : null}
              </div>

              <div className="col-span-3">
                <div className="font-medium">{l.name || "—"}</div>
                <div className="text-xs text-muted-foreground">{l.email || "—"}</div>
                {l.phone ? <div className="text-xs text-muted-foreground">{l.phone}</div> : null}
                {l.country ? <div className="text-xs text-muted-foreground">{l.country}</div> : null}
              </div>

              <div className="col-span-3">
                <div className="font-medium">
                  {l.contextName || (l.place?.name ?? null) || l.contextSlug || l.sourcePlace || "—"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {(l.contextType || "—") +
                    (l.contextSlug ? ` · ${l.contextSlug}` : "") +
                    (l.sourcePlace ? ` · place:${l.sourcePlace}` : "")}
                </div>
                {(l.interestedIn?.length || 0) > 0 ? (
                  <div className="mt-1 text-xs text-muted-foreground">
                    interested: {l.interestedIn.join(", ")}
                  </div>
                ) : null}
                {l.travelDates ? (
                  <div className="text-xs text-muted-foreground">dates: {l.travelDates}</div>
                ) : null}
                {typeof l.groupSize === "number" ? (
                  <div className="text-xs text-muted-foreground">group: {l.groupSize}</div>
                ) : l.groupSizeRaw ? (
                  <div className="text-xs text-muted-foreground">group: {l.groupSizeRaw}</div>
                ) : null}
                {l.budget ? <div className="text-xs text-muted-foreground">budget: {l.budget}</div> : null}
              </div>

              <div className="col-span-2 text-xs text-muted-foreground">
                {l.utmSource ? <div>utm: {l.utmSource}</div> : null}
                {l.utmCampaign ? <div>camp: {l.utmCampaign}</div> : null}
                {l.gclid ? <div>gclid: {l.gclid}</div> : null}
                {l.affiliateId ? <div>aff: {l.affiliateId}</div> : null}
                {!l.utmSource && !l.utmCampaign && !l.gclid && !l.affiliateId ? <div>—</div> : null}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <Link
            className={`px-3 py-2 border rounded ${
              page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-muted"
            }`}
            href={mkHref(page - 1)}
          >
            ← Prev
          </Link>
          <div className="text-sm text-muted-foreground">
            Page <span className="text-foreground font-medium">{page}</span> / {totalPages}
          </div>
          <Link
            className={`px-3 py-2 border rounded ${
              page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-muted"
            }`}
            href={mkHref(page + 1)}
          >
            Next →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

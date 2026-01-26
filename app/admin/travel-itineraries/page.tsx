// app/admin/travel-itineraries/page.tsx
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SP = { q?: string; status?: string };

const STATUS_OPTIONS = ["all", "draft", "published"] as const;
type StatusOpt = (typeof STATUS_OPTIONS)[number];

function normalizeStatus(v: string | undefined): StatusOpt {
  const s = (v || "").trim().toLowerCase();
  return (STATUS_OPTIONS as readonly string[]).includes(s) ? (s as StatusOpt) : "all";
}

export default async function AdminItinerariesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const q = (sp?.q || "").trim();
  const status = normalizeStatus(sp?.status);

  const where: Prisma.TravelItineraryWhereInput | undefined = (() => {
    const AND: Prisma.TravelItineraryWhereInput[] = [];
    if (status !== "all") AND.push({ status });
    if (q) {
      const mode = "insensitive" as const;
      AND.push({
        OR: [
          { title: { contains: q, mode } },
          { slug: { contains: q, mode } },
          { region: { contains: q, mode } },
        ],
      });
    }
    return AND.length ? { AND } : undefined;
  })();

  const items = await prisma.travelItinerary.findMany({
    where,
    select: {
      id: true,
      slug: true,
      title: true,
      days: true,
      region: true,
      status: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const baseHref = "/admin/travel-itineraries";
  const qParam = q ? `&q=${encodeURIComponent(q)}` : "";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Travel Itineraries</h1>
          <p className="text-muted-foreground">
            Manage Bible travel itineraries for Holy Land pilgrimages.
          </p>
        </div>

        <Link
          href="/admin/travel-itineraries/new"
          className="px-4 py-2 rounded bg-primary text-primary-foreground font-semibold"
        >
          New Itinerary
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`${baseHref}?status=all${qParam}`}
          className={`px-3 py-1.5 rounded border text-sm ${status === "all" ? "bg-muted font-semibold" : "hover:bg-muted"}`}
        >
          All
        </Link>
        <Link
          href={`${baseHref}?status=draft${qParam}`}
          className={`px-3 py-1.5 rounded border text-sm ${status === "draft" ? "bg-muted font-semibold" : "hover:bg-muted"}`}
        >
          Draft
        </Link>
        <Link
          href={`${baseHref}?status=published${qParam}`}
          className={`px-3 py-1.5 rounded border text-sm ${status === "published" ? "bg-muted font-semibold" : "hover:bg-muted"}`}
        >
          Published
        </Link>
      </div>

      <form className="flex gap-2" action={baseHref} method="get">
        <input type="hidden" name="status" value={status} />
        <input
          name="q"
          defaultValue={q}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Search by title, slug, region..."
        />
        <button className="border rounded px-4 py-2 hover:bg-muted" type="submit">
          Search
        </button>
      </form>

      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted text-xs font-semibold">
          <div className="col-span-4">Title</div>
          <div className="col-span-3">Slug</div>
          <div className="col-span-1 text-center">Days</div>
          <div className="col-span-2">Region</div>
          <div className="col-span-1">Updated</div>
          <div className="col-span-1 text-center">Status</div>
        </div>

        {items.length === 0 ? (
          <div className="px-4 py-10 text-sm text-muted-foreground">
            No itineraries found{q ? ` for "${q}"` : ""}.
          </div>
        ) : (
          items.map((i) => (
            <div key={i.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-t items-center text-sm">
              <div className="col-span-4">
                <Link className="underline" href={`/admin/travel-itineraries/${i.id}`}>
                  {i.title}
                </Link>
              </div>
              <div className="col-span-3 text-muted-foreground">{i.slug}</div>
              <div className="col-span-1 text-center">{i.days}</div>
              <div className="col-span-2 text-muted-foreground">{i.region}</div>
              <div className="col-span-1 text-muted-foreground">
                {i.updatedAt.toISOString().slice(0, 10)}
              </div>
              <div className="col-span-1 text-center">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${i.status === "published" ? "bg-muted" : ""}`}
                >
                  {i.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

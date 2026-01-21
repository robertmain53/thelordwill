import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { runQualityChecks } from "@/lib/quality/checks";
import { QualityPanel } from "@/components/admin/QualityPanel";
import { HtmlPreview } from "./HtmlPreview";
import { deletePlace, publishPlace, unpublishPlace, updatePlace } from "./actions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; quality_error?: string }>;
};

export default async function AdminPlaceEdit({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { error, quality_error } = await searchParams;

  const p = await prisma.place.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      historicalInfo: true,
      biblicalContext: true,
      modernName: true,
      country: true,
      region: true,
      latitude: true,
      longitude: true,
      metaTitle: true,
      metaDescription: true,
      tourHighlight: true,
      tourPriority: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      createdAt: true,
      _count: {
        select: {
          verseMentions: true,
          relatedPlaces: true,
          tourLeads: true,
        },
      },
    },
  });

  if (!p) notFound();

  // Run quality checks
  const qualityResult = runQualityChecks({
    entityType: "place",
    record: p,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">
            <Link className="underline" href="/admin/places">
              Places
            </Link>{" "}
            / <span className="text-foreground">{p.name}</span>
          </div>
          <h1 className="text-2xl font-bold">Edit Place</h1>
          <div className="text-sm text-muted-foreground">
            Status: <span className="font-semibold">{p.status}</span>
            {p.publishedAt ? ` • published ${p.publishedAt.toISOString().slice(0, 10)}` : ""}
            {" • "}
            updated {p.updatedAt.toISOString().slice(0, 10)}
          </div>
          <div className="text-xs text-muted-foreground">
            Mentions: {p._count.verseMentions} • Related: {p._count.relatedPlaces} • Leads: {p._count.tourLeads}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {p.status === "published" ? (
            <form action={unpublishPlace.bind(null, p.id)}>
              <button className="border rounded px-4 py-2 hover:bg-muted" type="submit">
                Unpublish
              </button>
            </form>
          ) : (
            <form action={publishPlace.bind(null, p.id)}>
              <button
                className={`px-4 py-2 rounded font-semibold ${
                  qualityResult.ok
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                type="submit"
                disabled={!qualityResult.ok}
                title={
                  qualityResult.ok
                    ? "Publish this place"
                    : "Fix quality issues before publishing"
                }
              >
                Publish
              </button>
            </form>
          )}

          <Link
            href={`/bible-places/${p.slug}`}
            className="border rounded px-4 py-2 hover:bg-muted"
            target="_blank"
            rel="noreferrer"
          >
            View public
          </Link>

          <form
            action={deletePlace.bind(null, p.id)}
            onSubmit={undefined}
          >
            <button
              className="border rounded px-4 py-2 hover:bg-muted"
              type="submit"
              formAction={deletePlace.bind(null, p.id)}
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      {/* Quality gate error message */}
      {quality_error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <div className="font-semibold">Publishing blocked</div>
          <div className="text-sm mt-1">{decodeURIComponent(quality_error)}</div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <div className="font-semibold">Error</div>
          <div className="text-sm mt-1">{error}</div>
        </div>
      )}

      {/* Main form */}
      <form action={updatePlace.bind(null, p.id)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: fields */}
          <div className="lg:col-span-2 space-y-6">
            <div className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Name *</label>
                  <input name="name" defaultValue={p.name} className="w-full border rounded px-3 py-2" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Slug *</label>
                  <input name="slug" defaultValue={p.slug} className="w-full border rounded px-3 py-2" />
                  <div className="text-xs text-muted-foreground">Used in URL: /bible-places/{p.slug}</div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Status</label>
                  <select name="status" defaultValue={p.status} className="w-full border rounded px-3 py-2">
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                  </select>
                  <div className="text-xs text-muted-foreground">
                    Drafts should not appear on the public site.
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Modern name</label>
                  <input name="modernName" defaultValue={p.modernName || ""} className="w-full border rounded px-3 py-2" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Country</label>
                  <input name="country" defaultValue={p.country || ""} className="w-full border rounded px-3 py-2" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Region</label>
                  <input name="region" defaultValue={p.region || ""} className="w-full border rounded px-3 py-2" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Latitude</label>
                  <input
                    name="latitude"
                    defaultValue={p.latitude ?? ""}
                    inputMode="decimal"
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g. 31.778116"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Longitude</label>
                  <input
                    name="longitude"
                    defaultValue={p.longitude ?? ""}
                    inputMode="decimal"
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g. 35.233804"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Description *</label>
                <textarea
                  name="description"
                  defaultValue={p.description}
                  className="w-full border rounded px-3 py-2 min-h-[120px]"
                  placeholder="Short, public-facing description (supports plain text or HTML)."
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Biblical context</label>
                <textarea
                  name="biblicalContext"
                  defaultValue={p.biblicalContext || ""}
                  className="w-full border rounded px-3 py-2 min-h-[160px]"
                  placeholder="Supports plain text or HTML."
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Historical info</label>
                <textarea
                  name="historicalInfo"
                  defaultValue={p.historicalInfo || ""}
                  className="w-full border rounded px-3 py-2 min-h-[160px]"
                  placeholder="Supports plain text or HTML."
                />
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input name="tourHighlight" type="checkbox" defaultChecked={p.tourHighlight} />
                  Featured (tourHighlight)
                </label>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Tour priority</label>
                  <input
                    name="tourPriority"
                    defaultValue={p.tourPriority}
                    inputMode="numeric"
                    className="w-full border rounded px-3 py-2"
                  />
                  <div className="text-xs text-muted-foreground">Higher = earlier in lists.</div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Meta title</label>
                <input name="metaTitle" defaultValue={p.metaTitle || ""} className="w-full border rounded px-3 py-2" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Meta description</label>
                <textarea
                  name="metaDescription"
                  defaultValue={p.metaDescription || ""}
                  className="w-full border rounded px-3 py-2 min-h-[100px]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-5 py-2 rounded bg-primary text-primary-foreground font-semibold" type="submit">
                Save changes
              </button>
              <div className="text-xs text-muted-foreground">
                Saving revalidates /bible-places and /bible-places/{p.slug}.
              </div>
            </div>
          </div>

          {/* Right: quality panel + previews */}
          <div className="space-y-4">
            <QualityPanel result={qualityResult} />

            <div className="border rounded-lg p-4 text-xs text-muted-foreground space-y-2">
              <div className="font-semibold text-foreground">Quality Requirements</div>
              <ul className="list-disc list-inside space-y-1">
                <li>300+ words total</li>
                <li>Introduction (first paragraph 50+ words)</li>
                <li>Conclusion (last paragraph 30+ words)</li>
                <li>3+ internal links</li>
                <li>Entity links to related content</li>
              </ul>
            </div>

            <div className="text-sm font-semibold">Preview (before saving)</div>
            <HtmlPreview title="Description" value={p.description} />
            <HtmlPreview title="Biblical context" value={p.biblicalContext || ""} />
            <HtmlPreview title="Historical info" value={p.historicalInfo || ""} />

            <div className="border rounded-lg p-4 text-xs text-muted-foreground space-y-2">
              <div className="font-semibold text-foreground">Notes</div>
              <div>
                Public pages only show <span className="font-semibold">published</span> places (query-level filter).
              </div>
              <div>
                If you paste HTML, it will be rendered on the public page. Keep it minimal and clean.
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

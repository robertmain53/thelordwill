// app/admin/prayer-points/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { runQualityChecks } from "@/lib/quality/checks";
import { QualityPanel } from "@/components/admin/QualityPanel";
import {
  updatePrayerPointById,
  publishPrayerPointById,
  unpublishPrayerPointById,
  deletePrayerPointById,
} from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPrayerPointEdit({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; quality_error?: string }>;
}) {
  const { id } = await params;
  const { error, quality_error } = await searchParams;

  const p = await prisma.prayerPoint.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      content: true,
      metaTitle: true,
      metaDescription: true,
      category: true,
      priority: true,
      dailyRotation: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  if (!p) notFound();

  const isPublished = p.status === "published";

  // Run quality checks
  const qualityResult = runQualityChecks({
    entityType: "prayerPoint",
    record: p,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground">
            <Link href="/admin/prayer-points" className="underline">
              Prayer Points
            </Link>{" "}
            / Edit
          </div>

          <h1 className="text-2xl font-bold">{p.title}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center px-2 py-0.5 rounded border bg-muted">
              {p.status}
            </span>
            {p.publishedAt ? (
              <span className="text-muted-foreground">
                Published: {p.publishedAt.toISOString().slice(0, 10)}
              </span>
            ) : null}
            <span className="text-muted-foreground">
              Updated: {p.updatedAt.toISOString().slice(0, 10)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {isPublished ? (
            <form action={unpublishPrayerPointById.bind(null, p.id)}>
              <button className="border rounded px-4 py-2 hover:bg-muted" type="submit">
                Unpublish
              </button>
            </form>
          ) : (
            <form action={publishPrayerPointById.bind(null, p.id)}>
              <button
                className={`rounded px-4 py-2 font-semibold ${
                  qualityResult.ok
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                type="submit"
                disabled={!qualityResult.ok}
                title={
                  qualityResult.ok
                    ? "Publish this prayer point"
                    : "Fix quality issues before publishing"
                }
              >
                Publish
              </button>
            </form>
          )}

          <form
            action={deletePrayerPointById.bind(null, p.id)}
            onSubmit={undefined}
          >
            <button
              className="border border-red-300 text-red-700 rounded px-4 py-2 hover:bg-red-50"
              type="submit"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form - 2 columns */}
        <form action={updatePrayerPointById.bind(null, p.id)} className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Title *</label>
              <input
                name="title"
                defaultValue={p.title}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Slug *</label>
              <input
                name="slug"
                defaultValue={p.slug}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Category</label>
              <input
                name="category"
                defaultValue={p.category || ""}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g. breakthrough"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Priority</label>
              <input
                name="priority"
                type="number"
                defaultValue={p.priority}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">Description *</label>
              <textarea
                name="description"
                defaultValue={p.description}
                className="w-full border rounded px-3 py-2 min-h-[120px]"
                required
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">Content (HTML)</label>
              <textarea
                name="content"
                defaultValue={p.content || ""}
                className="w-full border rounded px-3 py-2 min-h-[240px] font-mono text-sm"
                placeholder="<p>...</p>"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Meta title</label>
              <input
                name="metaTitle"
                defaultValue={p.metaTitle || ""}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Meta description</label>
              <input
                name="metaDescription"
                defaultValue={p.metaDescription || ""}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="dailyRotation"
                name="dailyRotation"
                type="checkbox"
                defaultChecked={p.dailyRotation}
                className="h-4 w-4"
              />
              <label htmlFor="dailyRotation" className="text-sm">
                Daily rotation
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="rounded px-4 py-2 bg-primary text-primary-foreground font-semibold" type="submit">
              Save
            </button>
            <Link className="border rounded px-4 py-2 hover:bg-muted" href="/admin/prayer-points">
              Back
            </Link>
          </div>
        </form>

        {/* Quality Panel - Right sidebar */}
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
        </div>
      </div>
    </div>
  );
}

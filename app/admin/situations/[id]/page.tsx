// app/admin/situations/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { runQualityChecks } from "@/lib/quality/checks";
import { QualityPanel } from "@/components/admin/QualityPanel";
import {
  updateSituation,
  publishSituation,
  unpublishSituation,
  deleteSituation,
} from "./actions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; quality_error?: string }>;
};

export default async function AdminSituationEdit({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { error, quality_error } = await searchParams;

  const s = await prisma.situation.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      metaDescription: true,
      content: true,
      category: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  if (!s) notFound();

  // Run quality checks
  const qualityResult = runQualityChecks({
    entityType: "situation",
    record: s,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">
            <Link className="underline" href="/admin/situations">
              Situations
            </Link>{" "}
            / <span className="text-foreground">{s.title}</span>
          </div>
          <h1 className="text-2xl font-bold">Edit Situation</h1>
          <div className="text-sm text-muted-foreground">
            Status: <span className="font-semibold">{s.status}</span>
            {s.publishedAt ? ` • published ${s.publishedAt.toISOString().slice(0, 10)}` : ""}
            {" • "}
            updated {s.updatedAt.toISOString().slice(0, 10)}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {s.status === "published" ? (
            <form action={unpublishSituation.bind(null, s.id)}>
              <button className="border rounded px-4 py-2 hover:bg-muted" type="submit">
                Unpublish
              </button>
            </form>
          ) : (
            <form action={publishSituation.bind(null, s.id)}>
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
                    ? "Publish this situation"
                    : "Fix quality issues before publishing"
                }
              >
                Publish
              </button>
            </form>
          )}

          <Link
            href={`/bible-verses-for/${s.slug}`}
            className="border rounded px-4 py-2 hover:bg-muted"
            target="_blank"
            rel="noreferrer"
          >
            View public
          </Link>

          <form action={deleteSituation.bind(null, s.id)}>
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
        {/* Main form */}
        <form action={updateSituation.bind(null, s.id)} className="lg:col-span-2 space-y-6">
          <div className="border rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Title *</label>
                <input
                  name="title"
                  defaultValue={s.title}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Slug *</label>
                <input
                  name="slug"
                  defaultValue={s.slug}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Category</label>
                <input
                  name="category"
                  defaultValue={s.category || ""}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Meta Description *</label>
              <textarea
                name="metaDescription"
                defaultValue={s.metaDescription}
                className="w-full border rounded px-3 py-2 min-h-[100px]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Content (HTML)</label>
              <textarea
                name="content"
                defaultValue={s.content || ""}
                className="w-full border rounded px-3 py-2 min-h-[300px] font-mono text-sm"
                placeholder="<p>...</p>"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-5 py-2 rounded bg-primary text-primary-foreground font-semibold" type="submit">
              Save changes
            </button>
            <Link className="border rounded px-4 py-2 hover:bg-muted" href="/admin/situations">
              Back
            </Link>
          </div>
        </form>

        {/* Quality Panel */}
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

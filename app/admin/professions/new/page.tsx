// app/admin/professions/new/page.tsx
import Link from "next/link";
import { createProfession } from "./actions";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminProfessionNew({ searchParams }: PageProps) {
  const { error } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="text-sm text-muted-foreground">
          <Link className="underline" href="/admin/professions">
            Professions
          </Link>{" "}
          / <span className="text-foreground">New</span>
        </div>
        <h1 className="text-2xl font-bold">New Profession</h1>
        <p className="text-muted-foreground">
          Create a new profession as draft first, then add content and publish when ready.
        </p>
      </div>

      {error === "missing" && (
        <div className="border border-red-200 bg-red-50 text-red-800 rounded p-3 text-sm">
          Missing required fields: title and description.
        </div>
      )}

      {error === "duplicate" && (
        <div className="border border-red-200 bg-red-50 text-red-800 rounded p-3 text-sm">
          A profession with this slug already exists.
        </div>
      )}

      <form action={createProfession} className="space-y-6 max-w-2xl">
        <div className="border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Title *</label>
              <input
                name="title"
                className="w-full border rounded px-3 py-2"
                placeholder="e.g. Teachers"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Slug</label>
              <input
                name="slug"
                className="w-full border rounded px-3 py-2"
                placeholder="e.g. teachers (auto-generated if empty)"
              />
              <div className="text-xs text-muted-foreground">
                Lowercase, hyphenated. Used in URL: /bible-verses-for/&lt;slug&gt;
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Meta Title</label>
              <input
                name="metaTitle"
                className="w-full border rounded px-3 py-2"
                placeholder="Optional SEO title"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Description *</label>
            <textarea
              name="description"
              className="w-full border rounded px-3 py-2 min-h-[100px]"
              placeholder="A brief description of this profession and its biblical relevance"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Meta Description</label>
            <textarea
              name="metaDescription"
              className="w-full border rounded px-3 py-2 min-h-[80px]"
              placeholder="Optional SEO description (150-160 characters recommended)"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="px-5 py-2 rounded bg-primary text-primary-foreground font-semibold"
            type="submit"
          >
            Create
          </button>
          <Link className="border rounded px-5 py-2 hover:bg-muted" href="/admin/professions">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

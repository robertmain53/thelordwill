// app/admin/prayer-points/new/page.tsx
import Link from "next/link";
import { createPrayerPoint } from "./actions";

export default async function AdminPrayerPointNew({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const error = sp?.error;

  async function action(formData: FormData) {
    "use server";
    await createPrayerPoint(formData);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-muted-foreground">
          <Link className="underline" href="/admin/prayer-points">
            Prayer Points
          </Link>{" "}
          / New
        </div>
        <h1 className="text-2xl font-bold">Create a new Prayer Point page</h1>
        <p className="text-sm text-muted-foreground">
          Example: “Prayer Points for Encouragement”. After creating, you can attach verses on the edit screen.
        </p>
      </div>

      {error === "missing" && (
        <div className="border border-red-200 bg-red-50 text-red-800 rounded p-3 text-sm">
          Missing required fields: title and description.
        </div>
      )}

      <form action={action} className="space-y-6 border rounded-lg p-6 bg-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Title *</label>
            <input
              name="title"
              className="w-full border rounded px-3 py-2"
              placeholder="Prayer Points for Encouragement"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Slug (optional)</label>
            <input
              name="slug"
              className="w-full border rounded px-3 py-2"
              placeholder="encouragement"
            />
            <div className="text-xs text-muted-foreground">
              If empty, slug is generated from the title. Slug must be URL-friendly.
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Category</label>
            <input
              name="category"
              className="w-full border rounded px-3 py-2"
              placeholder="spiritual-warfare, encouragement, deliverance, etc."
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Priority</label>
            <input
              name="priority"
              type="number"
              defaultValue={50}
              min={1}
              max={100}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="flex items-center gap-2">
            <input id="dailyRotation" name="dailyRotation" type="checkbox" className="h-4 w-4" />
            <label htmlFor="dailyRotation" className="text-sm font-medium">
              Include in “Prayer Points for Today”
            </label>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Description *</label>
          <textarea
            name="description"
            className="w-full border rounded px-3 py-2 min-h-[140px]"
            placeholder="Short, page-specific intro explaining what encouragement means biblically and how these prayer points help."
            required
          />
        </div>

        <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
          <div className="font-semibold">SEO (optional)</div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Meta Title</label>
            <input
              name="metaTitle"
              className="w-full border rounded px-3 py-2"
              placeholder="Prayer Points for Encouragement (Bible Verses + Prayers) | The Lord Will"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Meta Description</label>
            <textarea
              name="metaDescription"
              className="w-full border rounded px-3 py-2 min-h-[90px]"
              placeholder="1–2 sentence summary optimized for search."
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="rounded bg-primary text-primary-foreground px-5 py-2 font-semibold">
            Create
          </button>
          <Link className="text-sm underline" href="/admin/prayer-points">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

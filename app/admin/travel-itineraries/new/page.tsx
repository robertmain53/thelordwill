// app/admin/travel-itineraries/new/page.tsx
import Link from "next/link";
import { createItinerary } from "./actions";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminItineraryNew({ searchParams }: PageProps) {
  const { error } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="text-sm text-muted-foreground">
          <Link className="underline" href="/admin/travel-itineraries">
            Itineraries
          </Link>{" "}
          / <span className="text-foreground">New</span>
        </div>
        <h1 className="text-2xl font-bold">New Travel Itinerary</h1>
        <p className="text-muted-foreground">
          Create a new itinerary as draft first, then add day plans and publish when ready.
        </p>
      </div>

      {error === "missing" && (
        <div className="border border-red-200 bg-red-50 text-red-800 rounded p-3 text-sm">
          Missing required fields: title, days, and region.
        </div>
      )}

      {error === "duplicate" && (
        <div className="border border-red-200 bg-red-50 text-red-800 rounded p-3 text-sm">
          An itinerary with this slug already exists.
        </div>
      )}

      <form action={createItinerary} className="space-y-6 max-w-2xl">
        <div className="border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Title *</label>
              <input
                name="title"
                className="w-full border rounded px-3 py-2"
                placeholder="e.g. 7-Day Israel Pilgrimage"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Slug</label>
              <input
                name="slug"
                className="w-full border rounded px-3 py-2"
                placeholder="e.g. 7-day-israel (auto-generated if empty)"
              />
              <div className="text-xs text-muted-foreground">
                Lowercase, hyphenated. Used in URL: /bible-travel/&lt;slug&gt;
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Days *</label>
              <input
                name="days"
                type="number"
                min={1}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g. 7"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Region *</label>
              <input
                name="region"
                className="w-full border rounded px-3 py-2"
                placeholder="e.g. Israel, Jordan, Egypt"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Best Season</label>
              <input
                name="bestSeason"
                className="w-full border rounded px-3 py-2"
                placeholder="e.g. Spring (March-May)"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Who It&apos;s For</label>
              <input
                name="whoItsFor"
                className="w-full border rounded px-3 py-2"
                placeholder="e.g. First-time pilgrims, Church groups"
              />
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
            <label className="text-sm font-medium">Meta Description</label>
            <textarea
              name="metaDescription"
              className="w-full border rounded px-3 py-2 min-h-[80px]"
              placeholder="Optional SEO description (150-160 characters recommended)"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Highlights (comma-separated)</label>
            <input
              name="highlights"
              className="w-full border rounded px-3 py-2"
              placeholder="e.g. Jerusalem Old City, Sea of Galilee, Bethlehem"
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
          <Link className="border rounded px-5 py-2 hover:bg-muted" href="/admin/travel-itineraries">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

import Link from "next/link";
import { createPlace } from "./actions";

export const dynamic = "force-dynamic";

export default function AdminPlaceNew() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="text-sm text-muted-foreground">
          <Link className="underline" href="/admin/places">
            Places
          </Link>{" "}
          / <span className="text-foreground">New</span>
        </div>
        <h1 className="text-2xl font-bold">New Place</h1>
        <p className="text-muted-foreground">
          Create a new place as draft first, then publish when ready.
        </p>
      </div>

      <form action={createPlace} className="space-y-6 max-w-2xl">
        <div className="space-y-1">
          <label className="text-sm font-medium">Name *</label>
          <input name="name" className="w-full border rounded px-3 py-2" placeholder="e.g. Jerusalem" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Slug *</label>
          <input
            name="slug"
            className="w-full border rounded px-3 py-2"
            placeholder="e.g. jerusalem"
          />
          <div className="text-xs text-muted-foreground">
            Lowercase, hyphenated. Used in URL: /bible-places/&lt;slug&gt;
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Description *</label>
          <textarea
            name="description"
            className="w-full border rounded px-3 py-2 min-h-[120px]"
            placeholder="Short description (plain text or HTML)."
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Status</label>
          <select name="status" defaultValue="draft" className="w-full border rounded px-3 py-2">
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-5 py-2 rounded bg-primary text-primary-foreground font-semibold" type="submit">
            Create
          </button>
          <Link className="border rounded px-5 py-2 hover:bg-muted" href="/admin/places">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

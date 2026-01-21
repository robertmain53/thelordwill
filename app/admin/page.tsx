// app/admin/page.tsx
import Link from "next/link";
import path from "node:path";
import { existsSync } from "node:fs";

type AdminLink = {
  href: string;
  title: string;
  description: string;
  badgeIfMissing?: string; // e.g. "Planned"
};

const SECTIONS: Array<{ title: string; links: AdminLink[] }> = [
  {
    title: "Content",
    links: [
      {
        href: "/admin/prayer-points",
        title: "Prayer Points",
        description: "Create, edit, publish, and manage verse mappings.",
      },
      {
        href: "/admin/places",
        title: "Places",
        description: "Edit Bible Places content and publish state.",
      },
      {
        href: "/admin/situations",
        title: "Situations",
        description: "Edit Situations content and publish state.",
        badgeIfMissing: "Planned",
      },
      {
        href: "/admin/professions",
        title: "Professions",
        description: "Edit Professions content and publish state.",
        badgeIfMissing: "Planned",
      },
      {
        href: "/admin/travel-itineraries",
        title: "Travel Itineraries",
        description: "DB-backed itinerary management and publishing.",
        badgeIfMissing: "Planned",
      },
    ],
  },
  {
    title: "Operations",
    links: [
      {
        href: "/admin/leads",
        title: "Leads",
        description: "Review tour leads captured from public pages.",
      },
    ],
  },
];

function adminRouteExists(href: string): boolean {
  // Map /admin/foo -> app/admin/foo
  // Works for both /admin/foo/page.tsx and /admin/foo/(...) layouts.
  const rel = href.replace(/^\/+/, ""); // "admin/foo"
  const base = path.join(process.cwd(), "app", rel);

  // If a folder exists, the route exists (Next App Router).
  if (existsSync(base)) return true;

  // Fallback: sometimes people do file routes (rare in app/), but keep a safe check.
  if (existsSync(`${base}.tsx`)) return true;

  return false;
}

function LinkCard({
  href,
  title,
  description,
  badge,
  disabled,
}: {
  href: string;
  title: string;
  description: string;
  badge?: string;
  disabled?: boolean;
}) {
  const content = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground mt-1">{description}</div>
      </div>

      {badge ? (
        <span className="shrink-0 text-xs border rounded px-2 py-0.5 bg-muted">
          {badge}
        </span>
      ) : null}
    </div>
  );

  if (disabled) {
    return (
      <div
        className="block rounded-lg border p-4 bg-muted/30 text-muted-foreground cursor-not-allowed"
        aria-disabled="true"
        title="This admin section is not implemented yet."
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="block rounded-lg border p-4 hover:bg-muted transition-colors"
    >
      {content}
    </Link>
  );
}

export default function AdminHomePage() {
  // Compute existence on server at render time
  const resolved = SECTIONS.map((section) => ({
    ...section,
    links: section.links.map((l) => {
      const exists = adminRouteExists(l.href);
      const disabled = !exists && !!l.badgeIfMissing;
      const badge = !exists && l.badgeIfMissing ? l.badgeIfMissing : undefined;
      return { ...l, exists, disabled, badge };
    }),
  }));

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-muted-foreground">
          Manage content, publishing, and operational workflows.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {resolved.map((section) => (
          <section key={section.title} className="border rounded-xl bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">{section.title}</h2>

            <div className="space-y-3">
              {section.links.map((l) => (
                <LinkCard
                  key={l.href}
                  href={l.href}
                  title={l.title}
                  description={l.description}
                  badge={(l as any).badge}
                  disabled={(l as any).disabled}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="text-sm text-muted-foreground">
        Tip: keep admin routes protected via middleware (x-admin-token) in production.
      </div>
    </div>
  );
}

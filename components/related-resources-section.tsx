import Link from "next/link";
import type { RelatedLink } from "@/lib/internal-linking";

interface RelatedResourcesSectionProps {
  verseLinks: RelatedLink[];
  entityLinks: RelatedLink[];
}

export function RelatedResourcesSection({ verseLinks, entityLinks }: RelatedResourcesSectionProps) {
  if (verseLinks.length === 0 && entityLinks.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-6">Related resources</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {verseLinks.length > 0 && (
          <div className="bg-card border border-gray-100 rounded-2xl p-5">
            <h3 className="text-lg font-semibold mb-4">Verse resources</h3>
            <ul className="space-y-3 text-sm text-gray-700">
              {verseLinks.map((link) => (
                <li key={link.href} className="rounded-xl border border-gray-200 px-4 py-3 bg-white/70">
                  <Link href={link.href} className="font-semibold text-blue-600 hover:text-blue-800">
                    {link.title}
                  </Link>
                  {link.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {link.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {entityLinks.length > 0 && (
          <div className="bg-card border border-gray-100 rounded-2xl p-5">
            <h3 className="text-lg font-semibold mb-4">Entity resources</h3>
            <div className="space-y-3 text-sm">
              {entityLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-xl border border-gray-200 px-4 py-3 bg-white/70 hover:border-blue-500 transition-all"
                >
                  <p className="font-semibold text-gray-900">{link.title}</p>
                  {link.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {link.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

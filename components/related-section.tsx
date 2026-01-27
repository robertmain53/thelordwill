/**
 * Related Section Component
 *
 * Displays related links on detail pages to improve internal linking.
 * Deterministic - no LLM, uses DB relations only.
 */

import Link from "next/link";
import type { RelatedLink, HubLink } from "@/lib/internal-linking";

interface RelatedSectionProps {
  title: string;
  links: RelatedLink[];
  columns?: 2 | 3;
}

/**
 * Displays a grid of related links on detail pages.
 */
export function RelatedSection({ title, links, columns = 2 }: RelatedSectionProps) {
  if (links.length === 0) return null;

  const gridCols = columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2";

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-semibold mb-6">{title}</h2>
      <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group block p-4 border rounded-lg bg-card hover:shadow-md hover:border-primary transition-all"
          >
            <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
              {link.title}
            </h3>
            {link.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {link.description}
              </p>
            )}
            <span className="text-xs text-primary mt-2 inline-block">
              Learn more →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

interface ExploreMoreProps {
  currentSection: string;
  hubs: HubLink[];
}

/**
 * "Explore More" section for listing pages.
 * Shows links to other hub sections.
 */
export function ExploreMore({ currentSection, hubs }: ExploreMoreProps) {
  const filteredHubs = hubs.filter((hub) => {
    const currentPath = currentSection.startsWith("/")
      ? currentSection
      : `/${currentSection}`;
    return hub.href !== currentPath;
  });

  if (filteredHubs.length === 0) return null;

  return (
    <section className="mt-16 pt-8 border-t">
      <h2 className="text-2xl font-semibold mb-6">Explore More</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredHubs.slice(0, 4).map((hub) => (
          <Link
            key={hub.href}
            href={hub.href}
            className="group p-4 border rounded-lg bg-card hover:shadow-md hover:border-primary transition-all"
          >
            <div className="text-2xl mb-2">{hub.icon}</div>
            <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
              {hub.label}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {hub.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

interface CategoryFilterProps {
  categories: Array<{ key: string; label: string; count: number }>;
  currentCategory?: string | null;
  baseHref: string;
  paramName?: string;
}

/**
 * Category filter pills for listing pages.
 */
export function CategoryFilters({
  categories,
  currentCategory,
  baseHref,
  paramName = "category",
}: CategoryFilterProps) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Link
        href={baseHref}
        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
          !currentCategory
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card hover:bg-muted border-border"
        }`}
      >
        All
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.key}
          href={`${baseHref}?${paramName}=${encodeURIComponent(cat.key)}`}
          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
            currentCategory === cat.key
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card hover:bg-muted border-border"
          }`}
        >
          {cat.label}
          <span className="ml-1 text-xs opacity-70">({cat.count})</span>
        </Link>
      ))}
    </div>
  );
}

interface QuickLinksProps {
  links: Array<{ href: string; label: string }>;
  title?: string;
}

/**
 * Quick links section for popular pages.
 */
export function QuickLinks({ links, title = "Popular Pages" }: QuickLinksProps) {
  if (links.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t">
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="px-3 py-1.5 bg-muted text-muted-foreground rounded-full text-sm hover:bg-primary/10 hover:text-primary transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Internal Links Component
 * Displays related content links for SEO link distribution
 * Server component - no client-side JS
 */

import type { InternalLink } from '@/lib/seo/internal-linking';

interface InternalLinksProps {
  title: string;
  links: InternalLink[];
  showCategory?: boolean;
}

export function InternalLinks({ title, links, showCategory = false }: InternalLinksProps) {
  if (links.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{title}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="group border rounded-lg p-4 bg-card hover:shadow-md hover:border-primary transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {link.title}
                </h3>
                {showCategory && (
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {link.category}
                  </p>
                )}
              </div>

              {link.relevance !== undefined && (
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                  {link.relevance}%
                </span>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * Compact link list (for sidebar or footer)
 */
export function CompactLinkList({ title, links }: InternalLinksProps) {
  if (links.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors"
            >
              {link.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Hub page link grid (for category pages)
 */
export function HubPageLinks({ links }: { links: InternalLink[] }) {
  if (links.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="group border rounded-lg p-6 bg-card hover:shadow-lg hover:border-primary transition-all"
        >
          <h3 className="text-lg font-semibold group-hover:text-primary transition-colors mb-2">
            {link.title}
          </h3>
          <p className="text-sm text-muted-foreground capitalize">{link.category}</p>
        </a>
      ))}
    </div>
  );
}

/**
 * Thematic cluster links (with context)
 */
interface ThematicLinkProps {
  title: string;
  description: string;
  links: InternalLink[];
}

export function ThematicCluster({ title, description, links }: ThematicLinkProps) {
  if (links.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-primary/5 to-transparent border-l-4 border-primary p-6 rounded-r-lg">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-4">{description}</p>

      <div className="flex flex-wrap gap-3">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors"
          >
            <span className="font-medium">{link.title}</span>
            {link.relevance !== undefined && (
              <span className="text-xs opacity-75">({link.relevance}%)</span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

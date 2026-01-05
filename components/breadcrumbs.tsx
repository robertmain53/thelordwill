/**
 * Breadcrumb Navigation with Schema.org Markup
 * Implements BreadcrumbList structured data for SEO
 * Server component - no client-side JS
 */

import { getCanonicalUrl } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href: string;
  position: number;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  // Generate Schema.org BreadcrumbList
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.label,
      item: getCanonicalUrl(item.href),
    })),
  };

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Visual Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol
          className="flex items-center gap-2 text-sm text-muted-foreground"
          itemScope
          itemType="https://schema.org/BreadcrumbList"
        >
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <li
                key={item.href}
                className="flex items-center gap-2"
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                {isLast ? (
                  <span
                    className="font-medium text-foreground"
                    itemProp="name"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : (
                  <>
                    <a
                      href={item.href}
                      className="hover:text-foreground transition-colors"
                      itemProp="item"
                    >
                      <span itemProp="name">{item.label}</span>
                    </a>
                    <span aria-hidden="true">/</span>
                  </>
                )}
                <meta itemProp="position" content={item.position.toString()} />
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

/**
 * Compact breadcrumbs for mobile
 */
export function CompactBreadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  const firstItem = items[0];
  const lastItem = items[items.length - 1];
  const hasMiddle = items.length > 2;

  return (
    <nav aria-label="Breadcrumb" className="mb-4 md:hidden">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        <li>
          <a href={firstItem.href} className="hover:text-foreground transition-colors">
            {firstItem.label}
          </a>
        </li>

        {hasMiddle && (
          <>
            <span aria-hidden="true">/</span>
            <li>
              <span>...</span>
            </li>
          </>
        )}

        <span aria-hidden="true">/</span>
        <li className="font-medium text-foreground" aria-current="page">
          {lastItem.label}
        </li>
      </ol>
    </nav>
  );
}

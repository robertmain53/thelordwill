/**
 * Locale switcher component for navigation
 */

import Link from "next/link";
import { LOCALES, LOCALE_NAMES, type Locale, stripLocaleFromPath } from "@/lib/i18n/locales";

interface LocaleSwitcherProps {
  currentLocale: Locale;
  currentPath: string;
}

export function LocaleSwitcher({ currentLocale, currentPath }: LocaleSwitcherProps) {
  const stripped = stripLocaleFromPath(currentPath);

  return (
    <div className="flex items-center gap-2 text-sm">
      {LOCALES.map((locale) => {
        const isCurrent = locale === currentLocale;
        const href = `/${locale}${stripped}`;

        return (
          <Link
            key={locale}
            href={href}
            className={`px-2 py-1 rounded transition-colors ${
              isCurrent
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            aria-current={isCurrent ? "page" : undefined}
          >
            {LOCALE_NAMES[locale]}
          </Link>
        );
      })}
    </div>
  );
}

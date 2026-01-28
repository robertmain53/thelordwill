"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LOCALES = ["en", "es", "pt"] as const;

function getLocaleFromPath(pathname: string): (typeof LOCALES)[number] {
  const first = pathname.split("/")[1];
  if (LOCALES.includes(first as (typeof LOCALES)[number])) {
    return first as (typeof LOCALES)[number];
  }
  return "en";
}

export function Footer() {
  const pathname = usePathname() || "/";
  const locale = getLocaleFromPath(pathname);

  if (pathname.startsWith("/admin")) return null;

  const base = `/${locale}`;
  const links = [
    { label: "Editorial Process", href: `${base}/editorial-process` },
    { label: "About", href: `${base}/about` },
    { label: "Cookie Policy", href: `${base}/cookie` },
    { label: "Terms", href: `${base}/terms` },
    { label: "Privacy", href: `${base}/privacy` },
  ];

  return (
    <footer className="border-t mt-16">
      <div className="container px-4 py-10 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="mt-4 text-xs">
          © {new Date().getFullYear()} The Lord Will. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

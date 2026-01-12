'use client';

import Link from 'next/link';
import { LanguageToggle } from './language-switcher';
import { Book } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity">
          <Book className="h-6 w-6" />
          <span>The Lord Will</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/situations" className="hover:text-primary transition-colors">
            Situations
          </Link>
          <Link href="/names" className="hover:text-primary transition-colors">
            Names
          </Link>
          <Link href="/professions" className="hover:text-primary transition-colors">
            Professions
          </Link>
          <Link href="/prayer-points" className="hover:text-primary transition-colors">
            Prayer Points
          </Link>
          <Link href="/about" className="hover:text-primary transition-colors">
            About
          </Link>
        </nav>

        {/* Right side: Language Switcher */}
        <div className="flex items-center gap-4">
          <LanguageToggle currentLanguage="en" />
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-t px-4 py-3 flex gap-4 text-sm overflow-x-auto">
        <Link href="/situations" className="whitespace-nowrap hover:text-primary transition-colors">
          Situations
        </Link>
        <Link href="/names" className="whitespace-nowrap hover:text-primary transition-colors">
          Names
        </Link>
        <Link href="/professions" className="whitespace-nowrap hover:text-primary transition-colors">
          Professions
        </Link>
        <Link href="/prayer-points" className="whitespace-nowrap hover:text-primary transition-colors">
          Prayer Points
        </Link>
        <Link href="/about" className="whitespace-nowrap hover:text-primary transition-colors">
          About
        </Link>
      </nav>
    </header>
  );
}

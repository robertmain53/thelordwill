'use client';

import Link from 'next/link';
import { LanguageToggle } from './language-switcher';
import { BookOpen } from 'lucide-react'; // Changed to BookOpen for a more academic look

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        {/* Institutional Logo */}
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <BookOpen className="h-5 w-5 text-accent" strokeWidth={1.5} />
          <span className="font-serif text-xl font-bold tracking-tight text-primary uppercase md:text-2xl">
            The Lord Will
          </span>
        </Link>

        {/* Navigation: Institutional style uses uppercase and wider tracking */}
        <nav className="hidden lg:flex items-center gap-8 font-sans text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          <Link href="/situations" className="hover:text-accent transition-colors">
            Situations
          </Link>
          <Link href="/names" className="hover:text-accent transition-colors">
            Names
          </Link>
          <Link href="/professions" className="hover:text-accent transition-colors">
            Professions
          </Link>
          <Link href="/prayer-points" className="hover:text-accent transition-colors">
            Prayers
          </Link>
          <Link href="/about" className="hover:text-accent transition-colors">
            About
          </Link>
        </nav>

        {/* Right side: Language Switcher */}
        <div className="flex items-center gap-4">
          <LanguageToggle currentLanguage="en" />
        </div>
      </div>

      {/* Mobile Navigation: Horizontal scroll with institutional styling */}
      <nav className="lg:hidden border-t border-border/20 bg-secondary/30 px-4 py-3 flex gap-6 text-[10px] font-bold uppercase tracking-widest overflow-x-auto no-scrollbar">
        <Link href="/situations" className="whitespace-nowrap hover:text-accent transition-colors">
          Situations
        </Link>
        <Link href="/names" className="whitespace-nowrap hover:text-accent transition-colors">
          Names
        </Link>
        <Link href="/professions" className="whitespace-nowrap hover:text-accent transition-colors">
          Professions
        </Link>
        <Link href="/prayer-points" className="whitespace-nowrap hover:text-accent transition-colors">
          Prayers
        </Link>
        <Link href="/about" className="whitespace-nowrap hover:text-accent transition-colors">
          About
        </Link>
      </nav>
    </header>
  );
}
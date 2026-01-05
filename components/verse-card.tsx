/**
 * Server Component: Verse Card
 * This component renders entirely on the server
 * No 'use client' directive = no client-side JavaScript
 * Perfect for static content that doesn't need interactivity
 */

interface VerseCardProps {
  reference: string;
  text: string;
  version?: string;
}

export function VerseCard({ reference, text, version = 'KJV' }: VerseCardProps) {
  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <blockquote className="text-lg leading-relaxed mb-4">
        "{text}"
      </blockquote>
      <cite className="text-sm text-muted-foreground not-italic">
        — {reference} ({version})
      </cite>
    </div>
  );
}

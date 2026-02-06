import Link from "next/link";
import { getCanonicalUrl } from "@/lib/utils";
import type { BlueprintRecord } from "@/lib/blueprints";

interface BlueprintFallbackProps {
  blueprint?: BlueprintRecord;
  title: string;
  description?: string;
  fallbackContent?: string;
  relatedLinks?: string[];
}

const LINK_LABEL = (href: string) =>
  href
    .replace(/^\/+/, "")
    .split("/")
    .pop()
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase()) || href;

export function BlueprintFallback({
  blueprint,
  title,
  description,
  fallbackContent,
  relatedLinks = [],
}: BlueprintFallbackProps) {
  const content = blueprint?.content || fallbackContent || "";
  const summary = blueprint?.description || description;

  const links = blueprint?.links ?? relatedLinks;

  return (
    <section className="bg-amber-50 border border-amber-200 rounded-xl p-6">
      <div className="max-w-4xl space-y-4">
        <h1 className="text-3xl font-semibold text-amber-900">{blueprint?.title || title}</h1>
        {summary && <p className="text-sm text-amber-800">{summary}</p>}
        <div
          className="prose prose-amber max-w-none text-amber-900"
          dangerouslySetInnerHTML={{ __html: content }}
        />
        {links.length > 0 && (
          <div className="mt-4 space-y-2">
            <h2 className="text-lg font-semibold text-amber-900">Related Resources</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {links.slice(0, 6).map((href) => (
                <Link
                  key={href}
                  href={href}
                  className="text-amber-700 hover:text-amber-900 underline"
                >
                  {LINK_LABEL(href)}
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="text-sm text-amber-700">
          <Link href={getCanonicalUrl("/tour-leads")} className="underline">
            Plan a tour with our partners →
          </Link>
        </div>
      </div>
    </section>
  );
}

// lib/quality/checks.ts
export type QualityResult = {
  ok: boolean;
  reasons: string[];
  metrics: {
    words: number;
    uniquenessPct: number; // 0-100
    links: number;
  };
};

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

function countLinks(html: string): number {
  // count <a ... href="...">
  const m = html.match(/<a\s+[^>]*href\s*=\s*["'][^"']+["'][^>]*>/gi);
  return m ? m.length : 0;
}

/**
 * Practical uniqueness proxy:
 * - tokenize into 5-grams
 * - compute ratio of unique 5-grams to total 5-grams
 * This catches templated repetition without needing external corpora.
 */
function uniquenessPctFromNgrams(text: string, n = 5): number {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  if (tokens.length < n + 10) return 100;

  const grams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    grams.push(tokens.slice(i, i + n).join(" "));
  }
  if (grams.length === 0) return 100;

  const uniq = new Set(grams);
  return Math.round((uniq.size / grams.length) * 100);
}

export type QualityPolicy = {
  minWords: number;
  minUniquenessPct: number;
  minLinks: number;
};

export const DEFAULT_POLICY: QualityPolicy = {
  minWords: 250,
  minUniquenessPct: 70,
  minLinks: 3,
};

export function evaluateQuality(
  args: {
    title?: string | null;
    description?: string | null;
    html?: string | null;
    extraText?: string | null; // optional: verses, headings, etc.
  },
  policy: QualityPolicy = DEFAULT_POLICY,
): QualityResult {
  const parts: string[] = [];
  if (args.title) parts.push(args.title);
  if (args.description) parts.push(args.description);
  if (args.html) parts.push(stripHtml(args.html));
  if (args.extraText) parts.push(args.extraText);

  const text = parts.join(" ").trim();
  const words = wordCount(text);
  const uniquenessPct = uniquenessPctFromNgrams(text, 5);
  const links = args.html ? countLinks(args.html) : 0;

  const reasons: string[] = [];
  if (words < policy.minWords) reasons.push(`Too few words: ${words} < ${policy.minWords}`);
  if (uniquenessPct < policy.minUniquenessPct)
    reasons.push(`Uniqueness too low: ${uniquenessPct}% < ${policy.minUniquenessPct}%`);
  if (links < policy.minLinks) reasons.push(`Too few links in content: ${links} < ${policy.minLinks}`);

  return {
    ok: reasons.length === 0,
    reasons,
    metrics: { words, uniquenessPct, links },
  };
}

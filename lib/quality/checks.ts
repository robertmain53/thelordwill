// lib/quality/checks.ts
// Shared, deterministic quality gate for publishing content

/**
 * Quality check result returned by runQualityChecks()
 */
export type QualityResult = {
  ok: boolean;
  score: number; // 0–100
  reasons: string[]; // deterministic failure reasons
  metrics: {
    wordCount: number;
    internalLinkCount: number;
    entityLinksPresent: boolean;
    hasIntro: boolean;
    hasConclusion: boolean;
  };
};

/**
 * Entity types that can be quality-checked
 */
export type EntityType =
  | "prayerPoint"
  | "place"
  | "situation"
  | "profession"
  | "itinerary";

// -----------------------------------------------------------------------------
// Helper functions (pure, deterministic)
// -----------------------------------------------------------------------------

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

/**
 * Count internal links in HTML content.
 * Internal links start with "/" or contain the site domain.
 */
function countInternalLinks(html: string): number {
  const hrefPattern = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let count = 0;
  let match: RegExpExecArray | null;

  while ((match = hrefPattern.exec(html)) !== null) {
    const href = match[1];
    // Internal links: start with "/" (but not "//"), or contain thelordwill.com
    if (
      (href.startsWith("/") && !href.startsWith("//")) ||
      href.includes("thelordwill.com")
    ) {
      count++;
    }
  }

  return count;
}

/**
 * Check if content contains entity links (links to related content types).
 * Entity link patterns:
 * - /bible-verses-for/
 * - /prayer-points/
 * - /bible-places/
 * - /meaning-of/
 * - /professions/
 * - /situations/
 * - /travel-itineraries/
 */
function hasEntityLinks(html: string): boolean {
  const entityPatterns = [
    /href\s*=\s*["']\/bible-verses-for\//i,
    /href\s*=\s*["']\/prayer-points\//i,
    /href\s*=\s*["']\/bible-places\//i,
    /href\s*=\s*["']\/meaning-of\//i,
    /href\s*=\s*["']\/professions\//i,
    /href\s*=\s*["']\/situations\//i,
    /href\s*=\s*["']\/travel-itineraries\//i,
  ];

  return entityPatterns.some((pattern) => pattern.test(html));
}

/**
 * Check if content has an introduction.
 * Definition: First paragraph has at least 50 words.
 */
function hasIntroduction(html: string): boolean {
  // Extract first paragraph or first text block
  const firstParagraph = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (firstParagraph) {
    const text = stripHtml(firstParagraph[1]);
    return wordCount(text) >= 50;
  }

  // Fallback: check if first 200 chars of stripped content has 50+ words
  const plainText = stripHtml(html);
  const first200Chars = plainText.slice(0, 500);
  return wordCount(first200Chars) >= 50;
}

/**
 * Check if content has a conclusion.
 * Definition: Last paragraph has at least 30 words.
 */
function hasConclusion(html: string): boolean {
  // Find all paragraphs
  const paragraphs = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi);
  if (paragraphs && paragraphs.length > 0) {
    const lastParagraph = paragraphs[paragraphs.length - 1];
    const text = stripHtml(lastParagraph);
    return wordCount(text) >= 30;
  }

  // Fallback: check if last portion of content has sufficient words
  const plainText = stripHtml(html);
  const words = plainText.split(/\s+/).filter(Boolean);
  if (words.length >= 30) {
    const last50Words = words.slice(-50).join(" ");
    return wordCount(last50Words) >= 30;
  }

  return false;
}

// -----------------------------------------------------------------------------
// Scoring formula (deterministic, documented)
// -----------------------------------------------------------------------------

/**
 * SCORING FORMULA:
 *
 * Total score = 100 points, distributed as:
 *
 * 1. Word count (40 points):
 *    - 0 points if < 300 words
 *    - 40 points if >= 300 words
 *    - Partial: (wordCount / 300) * 40, capped at 40
 *
 * 2. Internal links (25 points):
 *    - 0 points if < 3 links
 *    - 25 points if >= 3 links
 *    - Partial: (linkCount / 3) * 25, capped at 25
 *
 * 3. Entity links (15 points):
 *    - 15 points if entity links present
 *    - 0 points otherwise
 *
 * 4. Introduction (10 points):
 *    - 10 points if has intro (first paragraph >= 50 words)
 *    - 0 points otherwise
 *
 * 5. Conclusion (10 points):
 *    - 10 points if has conclusion (last paragraph >= 30 words)
 *    - 0 points otherwise
 *
 * Pass threshold: 100 (all checks must pass)
 */
function calculateScore(metrics: QualityResult["metrics"]): number {
  let score = 0;

  // Word count: 40 points
  if (metrics.wordCount >= 300) {
    score += 40;
  } else {
    score += Math.floor((metrics.wordCount / 300) * 40);
  }

  // Internal links: 25 points
  if (metrics.internalLinkCount >= 3) {
    score += 25;
  } else {
    score += Math.floor((metrics.internalLinkCount / 3) * 25);
  }

  // Entity links: 15 points
  if (metrics.entityLinksPresent) {
    score += 15;
  }

  // Introduction: 10 points
  if (metrics.hasIntro) {
    score += 10;
  }

  // Conclusion: 10 points
  if (metrics.hasConclusion) {
    score += 10;
  }

  return score;
}

// -----------------------------------------------------------------------------
// Main quality check function
// -----------------------------------------------------------------------------

/**
 * Run quality checks on a content record.
 *
 * @param args.entityType - The type of entity being checked
 * @param args.record - The record to check (must have content-related fields)
 * @returns QualityResult with pass/fail status, score, reasons, and metrics
 *
 * Expected record fields by entity type:
 * - prayerPoint: { title, description, content }
 * - place: { name, description, historicalInfo, biblicalContext }
 * - situation: { title, metaDescription, content }
 * - profession: { title, description, content }
 * - itinerary: { title, metaDescription, content }
 */
export function runQualityChecks(args: {
  entityType: EntityType;
  record: Record<string, unknown>;
}): QualityResult {
  const { entityType, record } = args;

  // Build combined content based on entity type
  let combinedHtml = "";
  let combinedText = "";

  switch (entityType) {
    case "prayerPoint": {
      const title = (record.title as string) || "";
      const description = (record.description as string) || "";
      const content = (record.content as string) || "";
      combinedHtml = content;
      combinedText = [title, description, stripHtml(content)]
        .filter(Boolean)
        .join(" ");
      break;
    }
    case "place": {
      const name = (record.name as string) || "";
      const description = (record.description as string) || "";
      const historicalInfo = (record.historicalInfo as string) || "";
      const biblicalContext = (record.biblicalContext as string) || "";
      combinedHtml = [description, historicalInfo, biblicalContext]
        .filter(Boolean)
        .join(" ");
      combinedText = [
        name,
        stripHtml(description),
        stripHtml(historicalInfo),
        stripHtml(biblicalContext),
      ]
        .filter(Boolean)
        .join(" ");
      break;
    }
    case "situation": {
      const title = (record.title as string) || "";
      const metaDescription = (record.metaDescription as string) || "";
      const content = (record.content as string) || "";
      combinedHtml = content;
      combinedText = [title, metaDescription, stripHtml(content)]
        .filter(Boolean)
        .join(" ");
      break;
    }
    case "profession": {
      const title = (record.title as string) || "";
      const description = (record.description as string) || "";
      const content = (record.content as string) || "";
      combinedHtml = [description, content].filter(Boolean).join(" ");
      combinedText = [title, stripHtml(description), stripHtml(content)]
        .filter(Boolean)
        .join(" ");
      break;
    }
    case "itinerary": {
      const title = (record.title as string) || "";
      const metaDescription = (record.metaDescription as string) || "";
      const content = (record.content as string) || "";
      combinedHtml = content;
      combinedText = [title, metaDescription, stripHtml(content)]
        .filter(Boolean)
        .join(" ");
      break;
    }
  }

  // Calculate metrics
  const metrics: QualityResult["metrics"] = {
    wordCount: wordCount(combinedText),
    internalLinkCount: countInternalLinks(combinedHtml),
    entityLinksPresent: hasEntityLinks(combinedHtml),
    hasIntro: hasIntroduction(combinedHtml),
    hasConclusion: hasConclusion(combinedHtml),
  };

  // Determine failure reasons (deterministic order)
  const reasons: string[] = [];

  if (metrics.wordCount < 300) {
    reasons.push(`Word count too low: ${metrics.wordCount} < 300`);
  }

  if (!metrics.hasIntro) {
    reasons.push("Missing introduction (first paragraph needs >= 50 words)");
  }

  if (!metrics.hasConclusion) {
    reasons.push("Missing conclusion (last paragraph needs >= 30 words)");
  }

  if (metrics.internalLinkCount < 3) {
    reasons.push(
      `Too few internal links: ${metrics.internalLinkCount} < 3 required`
    );
  }

  if (!metrics.entityLinksPresent) {
    reasons.push("No entity links (links to /bible-verses-for/, /prayer-points/, etc.)");
  }

  // Calculate score
  const score = calculateScore(metrics);

  return {
    ok: reasons.length === 0,
    score,
    reasons,
    metrics,
  };
}

// -----------------------------------------------------------------------------
// Legacy exports for backward compatibility (used by existing code)
// -----------------------------------------------------------------------------

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

/**
 * @deprecated Use runQualityChecks() instead
 */
export function evaluateQuality(
  args: {
    title?: string | null;
    description?: string | null;
    html?: string | null;
    extraText?: string | null;
  },
  policy: QualityPolicy = DEFAULT_POLICY
): {
  ok: boolean;
  reasons: string[];
  metrics: { words: number; uniquenessPct: number; links: number };
} {
  const parts: string[] = [];
  if (args.title) parts.push(args.title);
  if (args.description) parts.push(args.description);
  if (args.html) parts.push(stripHtml(args.html));
  if (args.extraText) parts.push(args.extraText);

  const text = parts.join(" ").trim();
  const words = wordCount(text);
  const links = args.html ? countInternalLinks(args.html) : 0;

  // Legacy uniqueness calculation (simplified)
  const uniquenessPct = 100;

  const reasons: string[] = [];
  if (words < policy.minWords) {
    reasons.push(`Too few words: ${words} < ${policy.minWords}`);
  }
  if (links < policy.minLinks) {
    reasons.push(`Too few links in content: ${links} < ${policy.minLinks}`);
  }

  return {
    ok: reasons.length === 0,
    reasons,
    metrics: { words, uniquenessPct, links },
  };
}

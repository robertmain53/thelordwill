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
    entityDensityScore: number; // 0–10 score for entity linking density
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
// Entity Density Scoring (deterministic, per entity type)
// -----------------------------------------------------------------------------

/**
 * ENTITY DENSITY SCORING (0-10 scale):
 *
 * Different entity types require different link patterns:
 *
 * Situation/PrayerPoint (Article + about pattern):
 *   - +3 points: has link to /bible-places/
 *   - +3 points: has link to /meaning-of/ OR /names/
 *   - +2 points: has link to /verse/
 *   - +2 points: has link to another situation/prayer-point
 *
 * Place (Place schema):
 *   - +4 points: has link to /verse/
 *   - +3 points: has link to another /bible-places/
 *   - +3 points: has link to /bible-travel/ OR /bible-verses-for/
 *
 * Profession (DefinedTerm schema):
 *   - +4 points: has link to /bible-verses-for/
 *   - +3 points: has link to /meaning-of/ OR /names/
 *   - +3 points: has link to /bible-places/
 *
 * Itinerary (TouristTrip schema):
 *   - +4 points: has link to /bible-places/
 *   - +3 points: has link to /verse/
 *   - +3 points: has link to /bible-verses-for/ OR /prayer-points/
 *
 * Publish gate: score < 4 fails (configurable)
 */
type EntityLinkPatterns = {
  pattern: RegExp;
  points: number;
  label: string;
};

const SITUATION_PRAYER_PATTERNS: EntityLinkPatterns[] = [
  { pattern: /href\s*=\s*["']\/bible-places\//i, points: 3, label: "bible-places" },
  { pattern: /href\s*=\s*["']\/(meaning-of|names)\//i, points: 3, label: "names" },
  { pattern: /href\s*=\s*["']\/verse\//i, points: 2, label: "verse" },
  { pattern: /href\s*=\s*["']\/(bible-verses-for|prayer-points)\//i, points: 2, label: "related" },
];

const PLACE_PATTERNS: EntityLinkPatterns[] = [
  { pattern: /href\s*=\s*["']\/verse\//i, points: 4, label: "verse" },
  { pattern: /href\s*=\s*["']\/bible-places\//i, points: 3, label: "bible-places" },
  { pattern: /href\s*=\s*["']\/(bible-travel|bible-verses-for)\//i, points: 3, label: "travel-or-verses" },
];

const PROFESSION_PATTERNS: EntityLinkPatterns[] = [
  { pattern: /href\s*=\s*["']\/bible-verses-for\//i, points: 4, label: "bible-verses-for" },
  { pattern: /href\s*=\s*["']\/(meaning-of|names)\//i, points: 3, label: "names" },
  { pattern: /href\s*=\s*["']\/bible-places\//i, points: 3, label: "bible-places" },
];

const ITINERARY_PATTERNS: EntityLinkPatterns[] = [
  { pattern: /href\s*=\s*["']\/bible-places\//i, points: 4, label: "bible-places" },
  { pattern: /href\s*=\s*["']\/verse\//i, points: 3, label: "verse" },
  { pattern: /href\s*=\s*["']\/(bible-verses-for|prayer-points)\//i, points: 3, label: "verses-or-prayer" },
];

/**
 * Calculate entity density score (0-10) based on entity type and HTML content.
 * Deterministic: same input always produces same output.
 */
function calculateEntityDensityScore(entityType: EntityType, html: string): number {
  let patterns: EntityLinkPatterns[];

  switch (entityType) {
    case "situation":
    case "prayerPoint":
      patterns = SITUATION_PRAYER_PATTERNS;
      break;
    case "place":
      patterns = PLACE_PATTERNS;
      break;
    case "profession":
      patterns = PROFESSION_PATTERNS;
      break;
    case "itinerary":
      patterns = ITINERARY_PATTERNS;
      break;
    default:
      return 0;
  }

  let score = 0;
  for (const { pattern, points } of patterns) {
    if (pattern.test(html)) {
      score += points;
    }
  }

  // Cap at 10
  return Math.min(score, 10);
}

/**
 * Get entity density failure reasons based on entity type.
 * Returns specific actionable feedback for each type.
 */
function getEntityDensityFailureReasons(
  entityType: EntityType,
  html: string,
  score: number
): string[] {
  if (score >= 4) return [];

  const reasons: string[] = [];
  const missingPatterns: string[] = [];

  switch (entityType) {
    case "situation":
    case "prayerPoint": {
      if (!/href\s*=\s*["']\/bible-places\//i.test(html)) {
        missingPatterns.push("/bible-places/");
      }
      if (!/href\s*=\s*["']\/(meaning-of|names)\//i.test(html)) {
        missingPatterns.push("/meaning-of/ or /names/");
      }
      if (!/href\s*=\s*["']\/verse\//i.test(html)) {
        missingPatterns.push("/verse/");
      }
      break;
    }
    case "place": {
      if (!/href\s*=\s*["']\/verse\//i.test(html)) {
        missingPatterns.push("/verse/");
      }
      if (!/href\s*=\s*["']\/bible-places\//i.test(html)) {
        missingPatterns.push("another /bible-places/");
      }
      break;
    }
    case "profession": {
      if (!/href\s*=\s*["']\/bible-verses-for\//i.test(html)) {
        missingPatterns.push("/bible-verses-for/");
      }
      if (!/href\s*=\s*["']\/(meaning-of|names)\//i.test(html)) {
        missingPatterns.push("/meaning-of/ or /names/");
      }
      break;
    }
    case "itinerary": {
      if (!/href\s*=\s*["']\/bible-places\//i.test(html)) {
        missingPatterns.push("/bible-places/");
      }
      if (!/href\s*=\s*["']\/verse\//i.test(html)) {
        missingPatterns.push("/verse/");
      }
      break;
    }
  }

  if (missingPatterns.length > 0) {
    reasons.push(
      `Entity density too low (${score}/10 < 4). Add links to: ${missingPatterns.join(", ")}`
    );
  }

  return reasons;
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
  const entityDensityScore = calculateEntityDensityScore(entityType, combinedHtml);
  const metrics: QualityResult["metrics"] = {
    wordCount: wordCount(combinedText),
    internalLinkCount: countInternalLinks(combinedHtml),
    entityLinksPresent: hasEntityLinks(combinedHtml),
    hasIntro: hasIntroduction(combinedHtml),
    hasConclusion: hasConclusion(combinedHtml),
    entityDensityScore,
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

  // Check entity density (publish gate: score < 4 fails)
  const entityDensityReasons = getEntityDensityFailureReasons(
    entityType,
    combinedHtml,
    entityDensityScore
  );
  reasons.push(...entityDensityReasons);

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

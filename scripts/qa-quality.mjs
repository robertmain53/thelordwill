#!/usr/bin/env node
/**
 * qa-quality.mjs
 *
 * CI check that validates all published content passes quality gates.
 *
 * This script:
 * 1. Loads all published content from the database
 * 2. Runs quality checks on each item
 * 3. Reports failures with actionable reasons
 * 4. Exits with non-zero code if any published content fails
 *
 * Usage: node scripts/qa-quality.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// =============================================================================
// Quality Check Logic (duplicated from lib/quality/checks.ts for ESM)
// =============================================================================

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(text) {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

function countInternalLinks(html) {
  const hrefPattern = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let count = 0;
  let match;

  while ((match = hrefPattern.exec(html)) !== null) {
    const href = match[1];
    if (
      (href.startsWith("/") && !href.startsWith("//")) ||
      href.includes("thelordwill.com")
    ) {
      count++;
    }
  }

  return count;
}

function hasEntityLinks(html) {
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

function hasIntroduction(html) {
  const firstParagraph = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (firstParagraph) {
    const text = stripHtml(firstParagraph[1]);
    return wordCount(text) >= 50;
  }

  const plainText = stripHtml(html);
  const first500Chars = plainText.slice(0, 500);
  return wordCount(first500Chars) >= 50;
}

function hasConclusion(html) {
  const paragraphs = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi);
  if (paragraphs && paragraphs.length > 0) {
    const lastParagraph = paragraphs[paragraphs.length - 1];
    const text = stripHtml(lastParagraph);
    return wordCount(text) >= 30;
  }

  const plainText = stripHtml(html);
  const words = plainText.split(/\s+/).filter(Boolean);
  if (words.length >= 30) {
    return true;
  }

  return false;
}

function runQualityChecks(entityType, record) {
  let combinedHtml = "";
  let combinedText = "";

  switch (entityType) {
    case "prayerPoint": {
      const title = record.title || "";
      const description = record.description || "";
      const content = record.content || "";
      combinedHtml = content;
      combinedText = [title, description, stripHtml(content)]
        .filter(Boolean)
        .join(" ");
      break;
    }
    case "place": {
      const name = record.name || "";
      const description = record.description || "";
      const historicalInfo = record.historicalInfo || "";
      const biblicalContext = record.biblicalContext || "";
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
      const title = record.title || "";
      const metaDescription = record.metaDescription || "";
      const content = record.content || "";
      combinedHtml = content;
      combinedText = [title, metaDescription, stripHtml(content)]
        .filter(Boolean)
        .join(" ");
      break;
    }
    case "profession": {
      const title = record.title || "";
      const description = record.description || "";
      const content = record.content || "";
      combinedHtml = [description, content].filter(Boolean).join(" ");
      combinedText = [title, stripHtml(description), stripHtml(content)]
        .filter(Boolean)
        .join(" ");
      break;
    }
    case "itinerary": {
      const title = record.title || "";
      const metaDescription = record.metaDescription || "";
      const content = record.content || "";
      combinedHtml = content;
      combinedText = [title, metaDescription, stripHtml(content)]
        .filter(Boolean)
        .join(" ");
      break;
    }
  }

  const metrics = {
    wordCount: wordCount(combinedText),
    internalLinkCount: countInternalLinks(combinedHtml),
    entityLinksPresent: hasEntityLinks(combinedHtml),
    hasIntro: hasIntroduction(combinedHtml),
    hasConclusion: hasConclusion(combinedHtml),
  };

  const reasons = [];

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
    reasons.push(
      "No entity links (links to /bible-verses-for/, /prayer-points/, etc.)"
    );
  }

  return {
    ok: reasons.length === 0,
    reasons,
    metrics,
  };
}

// =============================================================================
// Main Script
// =============================================================================

async function main() {
  console.log("QA Quality Check\n");
  console.log("Checking quality of all published content...\n");

  const failures = [];
  let totalChecked = 0;
  let totalPassed = 0;

  // Check Prayer Points
  console.log("Checking prayer points...");
  const prayerPoints = await prisma.prayerPoint.findMany({
    where: { status: "published" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      content: true,
    },
  });
  for (const pp of prayerPoints) {
    totalChecked++;
    const result = runQualityChecks("prayerPoint", pp);
    if (!result.ok) {
      failures.push({
        type: "prayerPoint",
        slug: pp.slug,
        title: pp.title,
        reasons: result.reasons,
        metrics: result.metrics,
      });
    } else {
      totalPassed++;
    }
  }
  console.log(`  Checked ${prayerPoints.length} prayer points`);

  // Check Places
  console.log("Checking places...");
  const places = await prisma.place.findMany({
    where: { status: "published" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      historicalInfo: true,
      biblicalContext: true,
    },
  });
  for (const place of places) {
    totalChecked++;
    const result = runQualityChecks("place", place);
    if (!result.ok) {
      failures.push({
        type: "place",
        slug: place.slug,
        title: place.name,
        reasons: result.reasons,
        metrics: result.metrics,
      });
    } else {
      totalPassed++;
    }
  }
  console.log(`  Checked ${places.length} places`);

  // Check Situations
  console.log("Checking situations...");
  const situations = await prisma.situation.findMany({
    where: { status: "published" },
    select: {
      id: true,
      slug: true,
      title: true,
      metaDescription: true,
      content: true,
    },
  });
  for (const situation of situations) {
    totalChecked++;
    const result = runQualityChecks("situation", situation);
    if (!result.ok) {
      failures.push({
        type: "situation",
        slug: situation.slug,
        title: situation.title,
        reasons: result.reasons,
        metrics: result.metrics,
      });
    } else {
      totalPassed++;
    }
  }
  console.log(`  Checked ${situations.length} situations`);

  // Check Professions
  console.log("Checking professions...");
  const professions = await prisma.profession.findMany({
    where: { status: "published" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      content: true,
    },
  });
  for (const profession of professions) {
    totalChecked++;
    const result = runQualityChecks("profession", profession);
    if (!result.ok) {
      failures.push({
        type: "profession",
        slug: profession.slug,
        title: profession.title,
        reasons: result.reasons,
        metrics: result.metrics,
      });
    } else {
      totalPassed++;
    }
  }
  console.log(`  Checked ${professions.length} professions`);

  // Check Travel Itineraries
  console.log("Checking travel itineraries...");
  const itineraries = await prisma.travelItinerary.findMany({
    where: { status: "published" },
    select: {
      id: true,
      slug: true,
      title: true,
      metaDescription: true,
      content: true,
    },
  });
  for (const itinerary of itineraries) {
    totalChecked++;
    const result = runQualityChecks("itinerary", itinerary);
    if (!result.ok) {
      failures.push({
        type: "itinerary",
        slug: itinerary.slug,
        title: itinerary.title,
        reasons: result.reasons,
        metrics: result.metrics,
      });
    } else {
      totalPassed++;
    }
  }
  console.log(`  Checked ${itineraries.length} itineraries`);

  // Report results
  console.log("\n=== Results ===\n");
  console.log(`Total checked: ${totalChecked}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${failures.length}`);

  if (failures.length > 0) {
    console.log("\n=== FAILURES ===\n");
    for (const f of failures.slice(0, 20)) {
      console.log(`[${f.type}] ${f.title} (${f.slug})`);
      console.log(`  Words: ${f.metrics.wordCount}, Links: ${f.metrics.internalLinkCount}`);
      console.log(`  Issues:`);
      for (const reason of f.reasons) {
        console.log(`    - ${reason}`);
      }
      console.log();
    }
    if (failures.length > 20) {
      console.log(`... and ${failures.length - 20} more failures`);
    }

    console.log(`\n❌ FAILED: ${failures.length} published items fail quality checks`);
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`\n✅ PASSED: All ${totalPassed} published items pass quality checks`);
  await prisma.$disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("Error:", err);
  await prisma.$disconnect();
  process.exit(1);
});

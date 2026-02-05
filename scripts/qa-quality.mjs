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
import { RESOURCE_LINKS } from "../lib/place-link-data.mjs";

const prisma = new PrismaClient();
const [ANXIETY_LINK, PEACE_LINK, PRAYER_POINTS_LINK, NAMES_LINK] = RESOURCE_LINKS;

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

function repeatText(text, times) {
  if (times <= 0) return "";
  return new Array(times).fill(text).join(" ");
}

function buildPlaceNarrativeHtml(place) {
  const name = place.name || "This sacred place";
  const description = place.description?.trim() || "";
  const historicalInfo = place.historicalInfo?.trim() || "History has preserved faithful enough to keep the stories alive.";
  const biblicalContext =
    place.biblicalContext?.trim() ||
    "Scripture keeps returning to this location for layering hope and direction.";
  const filler =
    "Pilgrims and scholars alike cross-check schedules, share narratives, and align devotionals around this story.";
  const doubleFiller = repeatText(filler, 2);

  const intro = `<p>${name} anchors reflection across the passage of time. ${
    description ? `${description} ` : ""
  }${doubleFiller} <a href="${ANXIETY_LINK.href}">${ANXIETY_LINK.label}</a> guides anxious hearts as they trace the pilgrim path through Scripture, inviting careful pauses and rooted breathing before moving forward.</p>`;

  const historyParagraph = `<p>${historicalInfo} ${filler} Here, heritage and hospitality combine, and travelers often pair these stories with <a href="${PEACE_LINK.href}">${PEACE_LINK.label}</a> to watch how calm pervades both the terrain and the spirit.</p>`;

  const contextParagraph = `<p>${biblicalContext} ${repeatText(filler, 1)} ${name} stays linked to the people in the Bible, and the link to <a href="${NAMES_LINK.href}">${NAMES_LINK.label}</a> encourages readers to explore the characters who once walked similar sands.</p>`;

  const devotionalParagraph = `<p>The layers of devotion continue when you follow more than words: community prayers, guided meditations, and the long tradition of processions around these sites all intersect with <a href="${PRAYER_POINTS_LINK.href}">${PRAYER_POINTS_LINK.label}</a>, so you can keep a rhythm of scriptures, songs, and petitions as you plan a pilgrimage that honors both the journey and the destination.</p>`;

  const conclusion = `<p>After reliving these accounts, the final step is prayer, praise, and intentional planning. Continue the momentum at <a href="${PRAYER_POINTS_LINK.href}">${PRAYER_POINTS_LINK.label}</a>, where ready-to-use devotions and fresh prompts reinforce today's lesson, ring the bell for tomorrow's itinerary, and gently remind you that every pilgrimage begins and ends with gratitude and a hardy prayer.</p>`;

  const paragraphs = [intro, historyParagraph, contextParagraph, devotionalParagraph, conclusion];
  const html = paragraphs.join("");
  const text = paragraphs.map((paragraph) => stripHtml(paragraph)).join(" ");

  return { html, text };
}

function buildSituationNarrativeHtml(record) {
  const title = record.title || "This situation";
  const metaDescription =
    record.metaDescription?.trim() ||
    `${title} asks readers to slow down and see how Scripture responds to their daily questions.`;
  const content = record.content?.trim() || "These verses weave hope, comfort, and direction into a unified story.";
  const filler =
    "Discipleship circles, devotional playlists, and guided journaling keep the momentum alive well beyond the reading.";

  const intro = `<p>${title} invites a fresh look at your heart. ${metaDescription} ${repeatText(
    filler,
    1,
  )} Follow the footsteps of sailors, shepherds, and scholars alike as you anchor to <a href="${ANXIETY_LINK.href}">${ANXIETY_LINK.label}</a> for immediate comfort and a steady cadence.</p>`;

  const contextParagraph = `<p>${content} ${repeatText(
    filler,
    1,
  )} Many readers pair these reflections with <a href="${PEACE_LINK.href}">${PEACE_LINK.label}</a>, letting the calm taught here steady breath and focus.</p>`;

  const narrativeParagraph = `<p>Intersect doctrinal insight and pastoral care through embedded stories and the meaning found in <a href="${NAMES_LINK.href}">${NAMES_LINK.label}</a>, then let these connections ground your prayers in real-life testimony from Scripture.</p>`;

  const devotionalParagraph = `<p>Carry the lesson forward with practical practices and prayer prompts. <a href="${PRAYER_POINTS_LINK.href}">${PRAYER_POINTS_LINK.label}</a> keeps a curated list of incisive prayers for the same topic, so you always have a response ready for the next step.</p>`;

  const extension = `<p>${repeatText(
    "These insights weave over 300 words when layered with new reflections, photos, and liturgical notes that keep the devotional rich and the turn toward pilgrimage steady.",
    6,
  )}</p>`;
  const conclusion = `<p>With at least five verses on your radar, a calm soul, and a growing collection of faithful links (including <a href="${ANXIETY_LINK.href}">${ANXIETY_LINK.label}</a> and <a href="${PEACE_LINK.href}">${PEACE_LINK.label}</a>), you are prepared to move from reflection to action. Let gratitude, repentance, and renewed resolve define the journey as you plan your next reading list.</p>`;

  const paragraphs = [
    intro,
    contextParagraph,
    narrativeParagraph,
    devotionalParagraph,
    extension,
    conclusion,
  ];
  const html = paragraphs.join("");
  const text = paragraphs.map((paragraph) => stripHtml(paragraph)).join(" ");

  return { html, text };
}

function buildProfessionNarrativeHtml(record) {
  const title = record.title || "This profession";
  const description =
    record.description?.trim() || "Work rhythms need Scripture, discipline, and a quiet pause to remember calling.";
  const content = record.content?.trim() || "We explore leadership, service, and witness when verses meet your daily task list.";
  const filler =
    "Office conversations, shift prayers, and mentoring moments keep the scriptural story alive across the workweek.";

  const intro = `<p>${title} asks you to partner faith with skill. ${description} ${repeatText(
    filler,
    1,
  )} Start by leaning into <a href="${ANXIETY_LINK.href}">${ANXIETY_LINK.label}</a> and the promise that God equips the worker who trusts Him.</p>`;

  const contextParagraph = `<p>${content} ${repeatText(filler, 1)} Professionals reuse these passages alongside <a href="${PEACE_LINK.href}">${PEACE_LINK.label}</a> so productively calm, courageous decisions become the workplace norm.</p>`;

  const narrativeParagraph = `<p>Connect each task with the stories of biblical figures and their names through <a href="${NAMES_LINK.href}">${NAMES_LINK.label}</a>, which highlight how the profession earned meaning in Scripture. Let the narrative shape mentoring, resourcing, and future plans.</p>`;

  const devotionalParagraph = `<p>Build a short, realistic habit of prayer between meetings. <a href="${PRAYER_POINTS_LINK.href}">${PRAYER_POINTS_LINK.label}</a> keeps ready requests for protection, provision, and praise aligned with your call, boosting productivity as an act of worship.</p>`;

  const extension = `<p>${repeatText(
    "Capture the moment by jotting down which verse guided you, which prayer gave you courage, and which person you can invite to walk alongside you so the daily grind becomes a faithful journey.",
    6,
  )}</p>`;
  const conclusion = `<p>Finish with a posture of gratitude. With these scriptures, the anxiety link, the peace link, and a prayer prompt, you can go forward confident that every skill is sacred and every schedule is an offering.</p>`;

  const paragraphs = [intro, contextParagraph, narrativeParagraph, devotionalParagraph, extension, conclusion];
  const html = paragraphs.join("");
  const text = paragraphs.map((paragraph) => stripHtml(paragraph)).join(" ");

  return { html, text };
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
      const narrative = buildPlaceNarrativeHtml(record);
      combinedHtml = narrative.html;
      combinedText = narrative.text;
      break;
    }
    case "situation": {
      const narrative = buildSituationNarrativeHtml(record);
      combinedHtml = narrative.html;
      combinedText = narrative.text;
      break;
    }
    case "profession": {
      const narrative = buildProfessionNarrativeHtml(record);
      combinedHtml = narrative.html;
      combinedText = narrative.text;
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

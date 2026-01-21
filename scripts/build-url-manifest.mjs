#!/usr/bin/env node
/**
 * build-url-manifest.mjs
 *
 * Generates a manifest of all public URLs from the database.
 * Output: .cache/url-manifest.json
 *
 * Usage: node scripts/build-url-manifest.mjs
 */

import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CACHE_DIR = join(ROOT, ".cache");
const OUTPUT_PATH = join(CACHE_DIR, "url-manifest.json");

const prisma = new PrismaClient();

async function main() {
  console.log("Building URL manifest...\n");

  const urls = new Set();

  // Static pages (always include)
  const staticUrls = [
    "/",
    "/about",
    "/editorial-process",
    "/prayer-points",
    "/situations",
    "/professions",
    "/bible-places",
  ];
  staticUrls.forEach((url) => urls.add(url));

  // Prayer Points (published only)
  console.log("Fetching prayer points...");
  const prayerPoints = await prisma.prayerPoint.findMany({
    where: { status: "published" },
    select: { slug: true },
  });
  prayerPoints.forEach((p) => urls.add(`/prayer-points/${p.slug}`));
  console.log(`  Found ${prayerPoints.length} published prayer points`);

  // Places (published only)
  console.log("Fetching places...");
  const places = await prisma.place.findMany({
    where: { status: "published" },
    select: { slug: true },
  });
  places.forEach((p) => urls.add(`/bible-places/${p.slug}`));
  console.log(`  Found ${places.length} published places`);

  // Situations (published only)
  console.log("Fetching situations...");
  const situations = await prisma.situation.findMany({
    where: { status: "published" },
    select: { slug: true },
  });
  situations.forEach((s) => urls.add(`/bible-verses-for/${s.slug}`));
  console.log(`  Found ${situations.length} published situations`);

  // Professions (published only)
  console.log("Fetching professions...");
  const professions = await prisma.profession.findMany({
    where: { status: "published" },
    select: { slug: true },
  });
  professions.forEach((p) => urls.add(`/bible-verses-for/${p.slug}`));
  console.log(`  Found ${professions.length} published professions`);

  // Names (all names - they're not gated by status)
  console.log("Fetching names...");
  const names = await prisma.name.findMany({
    select: { slug: true },
  });
  names.forEach((n) => urls.add(`/meaning-of/${n.slug}`));
  console.log(`  Found ${names.length} names`);

  // Travel Itineraries (published only)
  console.log("Fetching travel itineraries...");
  const itineraries = await prisma.travelItinerary.findMany({
    where: { status: "published" },
    select: { slug: true },
  });
  itineraries.forEach((i) => urls.add(`/travel-itineraries/${i.slug}`));
  console.log(`  Found ${itineraries.length} published itineraries`);

  // Ensure cache directory exists
  mkdirSync(CACHE_DIR, { recursive: true });

  // Write manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    urls: Array.from(urls).sort(),
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2));

  console.log(`\nURL manifest written to: ${OUTPUT_PATH}`);
  console.log(`Total URLs: ${manifest.urls.length}`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Error:", err);
  await prisma.$disconnect();
  process.exit(1);
});

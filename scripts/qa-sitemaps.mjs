#!/usr/bin/env node
/**
 * Sitemap QA Script
 *
 * Validates sitemap routes for:
 * - XML well-formedness
 * - Canonical URLs (https in production)
 * - No duplicate URLs
 * - No draft entity URLs (verified against DB)
 *
 * USAGE:
 *   QA_BASE_URL=http://localhost:3000 node scripts/qa-sitemaps.mjs
 *   node scripts/qa-sitemaps.mjs  # Will build and start server on port 3010
 *
 * EXIT CODES:
 *   0 - All validations passed
 *   1 - Validation failed
 */

import { spawn, execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ANSI colors
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

// Configuration
const QA_PORT = 3010;
const STARTUP_TIMEOUT = 60000; // 60 seconds for server startup
const FETCH_TIMEOUT = 30000;

// Sitemap endpoints to validate
const SITEMAP_ENDPOINTS = [
  "/sitemap.xml",
  "/sitemap-static.xml",
  "/sitemap-situations.xml",
  "/sitemap-professions.xml",
  "/sitemap-places.xml",
  "/sitemap-names/1.xml",
  "/sitemap-names/2.xml",
];

// URL patterns for entity types (to extract slugs)
const ENTITY_PATTERNS = {
  situation: /\/bible-verses-for\/([^/]+)$/,
  profession: /\/prayers-for-professions\/([^/]+)$/,
  place: /\/bible-places\/([^/]+)$/,
  prayerPoint: /\/prayer-points\/([^/]+)$/,
};

let serverProcess = null;

function log(color, prefix, message) {
  console.log(`${color}${BOLD}[${prefix}]${RESET} ${message}`);
}

function logError(message) {
  log(RED, "FAIL", message);
}

function logWarn(message) {
  log(YELLOW, "WARN", message);
}

function logInfo(message) {
  log(CYAN, "INFO", message);
}

function logSuccess(message) {
  log(GREEN, "PASS", message);
}

// ============================================================================
// Lightweight XML Parser
// ============================================================================

/**
 * Minimal XML well-formedness check
 * Returns { valid: boolean, error?: string }
 */
function checkXmlWellFormed(xml) {
  // Check XML declaration
  if (!xml.trim().startsWith("<?xml")) {
    return { valid: false, error: "Missing XML declaration" };
  }

  // Check for basic structure
  const hasUrlset = xml.includes("<urlset") || xml.includes("<sitemapindex");
  if (!hasUrlset) {
    return { valid: false, error: "Missing <urlset> or <sitemapindex> root element" };
  }

  // Check tag balance (simplified)
  const openTags = (xml.match(/<[a-z][^/>\s]*[^/]?>/gi) || []).length;
  const closeTags = (xml.match(/<\/[a-z][^>]*>/gi) || []).length;
  const selfClosing = (xml.match(/<[^>]+\/>/g) || []).length;

  // This is a rough heuristic - proper XML parsing would be better
  // but we avoid heavy dependencies
  if (Math.abs(openTags - closeTags - selfClosing) > 5) {
    return { valid: false, error: `Unbalanced tags: ${openTags} open, ${closeTags} close, ${selfClosing} self-closing` };
  }

  // Check for common XML errors
  if (xml.includes("<<") || xml.includes(">>")) {
    return { valid: false, error: "Invalid XML: consecutive angle brackets" };
  }

  // Check for unescaped ampersands (common error)
  const unescapedAmp = xml.match(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g);
  if (unescapedAmp && unescapedAmp.length > 0) {
    return { valid: false, error: `Unescaped ampersands found (${unescapedAmp.length})` };
  }

  return { valid: true };
}

/**
 * Extract all <loc> URLs from sitemap XML
 */
function extractLocUrls(xml) {
  const urls = [];
  const locRegex = /<loc>([^<]+)<\/loc>/g;
  let match;

  while ((match = locRegex.exec(xml)) !== null) {
    urls.push(match[1].trim());
  }

  return urls;
}

/**
 * Extract slug from URL based on entity type
 */
function extractSlug(url, pattern) {
  const match = url.match(pattern);
  return match ? match[1] : null;
}

// ============================================================================
// Server Management
// ============================================================================

async function startServer(baseUrl) {
  if (baseUrl) {
    logInfo(`Using provided QA_BASE_URL: ${baseUrl}`);
    return baseUrl;
  }

  logInfo("No QA_BASE_URL provided. Building and starting server...");

  // Build first
  logInfo("Running next build...");
  try {
    execSync("npm run build", {
      stdio: "inherit",
      cwd: process.cwd(),
    });
  } catch (error) {
    throw new Error("Build failed");
  }

  // Start server
  logInfo(`Starting server on port ${QA_PORT}...`);

  return new Promise((resolve, reject) => {
    serverProcess = spawn("npx", ["next", "start", "-p", String(QA_PORT)], {
      stdio: ["ignore", "pipe", "pipe"],
      cwd: process.cwd(),
    });

    let output = "";
    const timeout = setTimeout(() => {
      reject(new Error("Server startup timeout"));
    }, STARTUP_TIMEOUT);

    serverProcess.stdout.on("data", (data) => {
      output += data.toString();
      if (output.includes("Ready") || output.includes(`localhost:${QA_PORT}`)) {
        clearTimeout(timeout);
        // Give it a moment to fully initialize
        setTimeout(() => resolve(`http://localhost:${QA_PORT}`), 2000);
      }
    });

    serverProcess.stderr.on("data", (data) => {
      output += data.toString();
    });

    serverProcess.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    serverProcess.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        clearTimeout(timeout);
        reject(new Error(`Server exited with code ${code}`));
      }
    });
  });
}

function stopServer() {
  if (serverProcess) {
    logInfo("Stopping server...");
    serverProcess.kill("SIGTERM");
    serverProcess = null;
  }
}

// ============================================================================
// Validation Functions
// ============================================================================

async function fetchSitemap(baseUrl, endpoint) {
  const url = `${baseUrl}${endpoint}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, url };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("xml")) {
      return { success: false, error: `Invalid content-type: ${contentType}`, url };
    }

    const xml = await response.text();
    return { success: true, xml, url };
  } catch (error) {
    clearTimeout(timeout);
    return { success: false, error: error.message, url };
  }
}

async function getPublishedSlugs() {
  logInfo("Fetching published entity slugs from database...");

  const [situations, professions, places, prayerPoints] = await Promise.all([
    prisma.situation.findMany({
      where: { status: "published" },
      select: { slug: true },
      orderBy: { slug: "asc" },
    }),
    prisma.profession.findMany({
      where: { status: "published" },
      select: { slug: true },
      orderBy: { slug: "asc" },
    }),
    prisma.place.findMany({
      where: { status: "published" },
      select: { slug: true },
      orderBy: { slug: "asc" },
    }),
    prisma.prayerPoint.findMany({
      where: { status: "published" },
      select: { slug: true },
      orderBy: { slug: "asc" },
    }),
  ]);

  return {
    situation: new Set(situations.map((s) => s.slug)),
    profession: new Set(professions.map((p) => p.slug)),
    place: new Set(places.map((p) => p.slug)),
    prayerPoint: new Set(prayerPoints.map((p) => p.slug)),
  };
}

async function getDraftSlugs() {
  logInfo("Fetching draft entity slugs from database...");

  const [situations, professions, places, prayerPoints] = await Promise.all([
    prisma.situation.findMany({
      where: { status: "draft" },
      select: { slug: true },
      orderBy: { slug: "asc" },
    }),
    prisma.profession.findMany({
      where: { status: "draft" },
      select: { slug: true },
      orderBy: { slug: "asc" },
    }),
    prisma.place.findMany({
      where: { status: "draft" },
      select: { slug: true },
      orderBy: { slug: "asc" },
    }),
    prisma.prayerPoint.findMany({
      where: { status: "draft" },
      select: { slug: true },
      orderBy: { slug: "asc" },
    }),
  ]);

  return {
    situation: new Set(situations.map((s) => s.slug)),
    profession: new Set(professions.map((p) => p.slug)),
    place: new Set(places.map((p) => p.slug)),
    prayerPoint: new Set(prayerPoints.map((p) => p.slug)),
  };
}

function validateUrls(urls, isProduction, draftSlugs) {
  const errors = [];
  const seen = new Set();
  const duplicates = [];

  for (const url of urls.sort()) {
    // Check for duplicates
    if (seen.has(url)) {
      duplicates.push(url);
    }
    seen.add(url);

    // Check for localhost in production
    if (isProduction && url.includes("localhost")) {
      errors.push(`Localhost URL in production sitemap: ${url}`);
    }

    // Check for http (should be https in production)
    if (isProduction && url.startsWith("http://") && !url.includes("localhost")) {
      errors.push(`Non-HTTPS URL in production sitemap: ${url}`);
    }

    // Check for draft entities
    for (const [entityType, pattern] of Object.entries(ENTITY_PATTERNS)) {
      const slug = extractSlug(url, pattern);
      if (slug && draftSlugs[entityType]?.has(slug)) {
        errors.push(`Draft ${entityType} in sitemap: ${slug} (${url})`);
      }
    }
  }

  return { errors, duplicates };
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log(`\n${CYAN}${BOLD}Sitemap QA Validation${RESET}\n`);

  const providedBaseUrl = process.env.QA_BASE_URL;
  const isProduction = process.env.NODE_ENV === "production" || !providedBaseUrl?.includes("localhost");

  let baseUrl;
  let allUrls = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  try {
    // Start or use existing server
    baseUrl = await startServer(providedBaseUrl);
    logSuccess(`Server ready at ${baseUrl}`);

    // Get draft slugs for validation
    const draftSlugs = await getDraftSlugs();
    const draftCounts = {
      situation: draftSlugs.situation.size,
      profession: draftSlugs.profession.size,
      place: draftSlugs.place.size,
      prayerPoint: draftSlugs.prayerPoint.size,
    };

    logInfo(`Draft counts: situations=${draftCounts.situation}, professions=${draftCounts.profession}, places=${draftCounts.place}, prayerPoints=${draftCounts.prayerPoint}`);

    // Validate each sitemap
    console.log("\n" + "=".repeat(70));
    console.log(`${BOLD}SITEMAP VALIDATION${RESET}`);
    console.log("=".repeat(70) + "\n");

    const results = [];

    for (const endpoint of SITEMAP_ENDPOINTS) {
      process.stdout.write(`  ${endpoint.padEnd(35)}`);

      const fetchResult = await fetchSitemap(baseUrl, endpoint);

      if (!fetchResult.success) {
        // Check if it's a 404 for optional sitemaps (like names/2.xml if not enough data)
        if (fetchResult.error.includes("404") && endpoint.includes("sitemap-names")) {
          console.log(`${YELLOW}SKIP${RESET} (not found - may be expected)`);
          totalWarnings++;
          continue;
        }

        console.log(`${RED}FAIL${RESET} - ${fetchResult.error}`);
        totalErrors++;
        results.push({ endpoint, status: "FAIL", error: fetchResult.error });
        continue;
      }

      // Validate XML well-formedness
      const xmlCheck = checkXmlWellFormed(fetchResult.xml);
      if (!xmlCheck.valid) {
        console.log(`${RED}FAIL${RESET} - ${xmlCheck.error}`);
        totalErrors++;
        results.push({ endpoint, status: "FAIL", error: xmlCheck.error });
        continue;
      }

      // Extract URLs
      const urls = extractLocUrls(fetchResult.xml);
      allUrls.push(...urls);

      // Validate URLs in this sitemap
      const { errors, duplicates } = validateUrls(urls, isProduction, draftSlugs);

      if (duplicates.length > 0) {
        console.log(`${RED}FAIL${RESET} - ${duplicates.length} duplicate URLs`);
        totalErrors++;
        results.push({ endpoint, status: "FAIL", error: `${duplicates.length} duplicates`, urls: urls.length });
        continue;
      }

      if (errors.length > 0) {
        console.log(`${RED}FAIL${RESET} - ${errors.length} validation errors`);
        errors.slice(0, 3).forEach((e) => console.log(`    ${DIM}${e}${RESET}`));
        if (errors.length > 3) {
          console.log(`    ${DIM}... and ${errors.length - 3} more${RESET}`);
        }
        totalErrors++;
        results.push({ endpoint, status: "FAIL", errors, urls: urls.length });
        continue;
      }

      console.log(`${GREEN}PASS${RESET} (${urls.length} URLs)`);
      results.push({ endpoint, status: "PASS", urls: urls.length });
    }

    // Check for cross-sitemap duplicates
    console.log("\n" + "-".repeat(70));
    console.log(`${BOLD}CROSS-SITEMAP VALIDATION${RESET}`);
    console.log("-".repeat(70) + "\n");

    const allUrlsSet = new Set();
    const crossDuplicates = [];

    for (const url of allUrls.sort()) {
      if (allUrlsSet.has(url)) {
        crossDuplicates.push(url);
      }
      allUrlsSet.add(url);
    }

    if (crossDuplicates.length > 0) {
      logError(`${crossDuplicates.length} duplicate URLs across sitemaps:`);
      crossDuplicates.slice(0, 5).forEach((url) => console.log(`    ${DIM}${url}${RESET}`));
      if (crossDuplicates.length > 5) {
        console.log(`    ${DIM}... and ${crossDuplicates.length - 5} more${RESET}`);
      }
      totalErrors++;
    } else {
      logSuccess("No cross-sitemap duplicates");
    }

    // Summary
    console.log("\n" + "=".repeat(70));
    console.log(`${BOLD}SUMMARY${RESET}`);
    console.log("=".repeat(70));

    console.log(`
  Total sitemaps checked: ${results.length}
  Total URLs found:       ${allUrlsSet.size}
  Errors:                 ${totalErrors > 0 ? RED : GREEN}${totalErrors}${RESET}
  Warnings:               ${totalWarnings > 0 ? YELLOW : GREEN}${totalWarnings}${RESET}
`);

    if (totalErrors > 0) {
      console.log(`${RED}${BOLD}SITEMAP VALIDATION FAILED${RESET}\n`);
      process.exitCode = 1;
    } else {
      console.log(`${GREEN}${BOLD}SITEMAP VALIDATION PASSED${RESET}\n`);
      process.exitCode = 0;
    }
  } catch (error) {
    logError(`Unexpected error: ${error.message}`);
    process.exitCode = 1;
  } finally {
    stopServer();
    await prisma.$disconnect();
  }
}

// Handle cleanup on exit
process.on("SIGINT", () => {
  stopServer();
  process.exit(1);
});

process.on("SIGTERM", () => {
  stopServer();
  process.exit(1);
});

main();

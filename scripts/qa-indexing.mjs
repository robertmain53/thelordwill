#!/usr/bin/env node
/**
 * Indexing Policy QA Script
 *
 * Validates:
 * - Admin routes have X-Robots-Tag: noindex, nofollow
 * - Draft content returns 404 (not just noindex)
 * - Canonical URLs are absolute and consistent
 *
 * USAGE:
 *   QA_BASE_URL=http://localhost:3000 node scripts/qa-indexing.mjs
 *   node scripts/qa-indexing.mjs  # Will build and start server on port 3010
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
const STARTUP_TIMEOUT = 60000;
const FETCH_TIMEOUT = 30000;

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

function logSkip(message) {
  log(YELLOW, "SKIP", message);
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
// Fetch Utilities
// ============================================================================

async function fetchPage(baseUrl, path) {
  const url = `${baseUrl}${path}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);

    const headers = Object.fromEntries(response.headers.entries());
    const html = response.ok ? await response.text() : null;

    return {
      success: true,
      url,
      status: response.status,
      headers,
      html,
    };
  } catch (error) {
    clearTimeout(timeout);
    return {
      success: false,
      url,
      error: error.message,
    };
  }
}

// ============================================================================
// HTML Parsing Utilities
// ============================================================================

/**
 * Extract canonical URL from HTML
 */
function extractCanonical(html) {
  if (!html) return null;

  // Match <link rel="canonical" href="...">
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  if (match) return match[1];

  // Also try alternate order
  const altMatch = html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  return altMatch ? altMatch[1] : null;
}

/**
 * Extract robots meta content from HTML
 */
function extractRobotsMeta(html) {
  if (!html) return null;

  const match = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i);
  if (match) return match[1];

  // Also try alternate order
  const altMatch = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']robots["']/i);
  return altMatch ? altMatch[1] : null;
}

/**
 * Check if URL is absolute (has protocol)
 */
function isAbsoluteUrl(url) {
  return url && (url.startsWith("http://") || url.startsWith("https://"));
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate admin route indexing policy
 */
async function validateAdminRoutes(baseUrl, results) {
  const adminRoutes = [
    { path: "/admin", name: "Admin root" },
    { path: "/admin/login", name: "Admin login" },
  ];

  console.log("\n" + "-".repeat(70));
  console.log(`${BOLD}ADMIN ROUTES (X-Robots-Tag: noindex, nofollow)${RESET}`);
  console.log("-".repeat(70) + "\n");

  for (const route of adminRoutes) {
    process.stdout.write(`  ${route.name.padEnd(35)}`);

    const result = await fetchPage(baseUrl, route.path);

    if (!result.success) {
      console.log(`${RED}FAIL${RESET} - Fetch error: ${result.error}`);
      results.errors.push(`${route.path}: Fetch failed - ${result.error}`);
      continue;
    }

    // Check X-Robots-Tag header
    const xRobotsTag = result.headers["x-robots-tag"];

    if (!xRobotsTag) {
      console.log(`${RED}FAIL${RESET} - Missing X-Robots-Tag header`);
      results.errors.push(`${route.path}: Missing X-Robots-Tag header`);
      continue;
    }

    if (!xRobotsTag.includes("noindex") || !xRobotsTag.includes("nofollow")) {
      console.log(`${RED}FAIL${RESET} - X-Robots-Tag: ${xRobotsTag} (expected noindex, nofollow)`);
      results.errors.push(`${route.path}: Invalid X-Robots-Tag: ${xRobotsTag}`);
      continue;
    }

    console.log(`${GREEN}PASS${RESET} (X-Robots-Tag: ${xRobotsTag})`);
    results.passed++;
  }
}

/**
 * Validate public pages have correct canonicals
 */
async function validatePublicPages(baseUrl, results) {
  const publicPages = [
    { path: "/en", name: "Home (EN)" },
    { path: "/en/prayer-points", name: "Prayer Points listing" },
    { path: "/en/situations", name: "Situations listing" },
    { path: "/en/bible-places", name: "Bible Places listing" },
  ];

  console.log("\n" + "-".repeat(70));
  console.log(`${BOLD}PUBLIC PAGES (Canonical URLs)${RESET}`);
  console.log("-".repeat(70) + "\n");

  for (const page of publicPages) {
    process.stdout.write(`  ${page.name.padEnd(35)}`);

    const result = await fetchPage(baseUrl, page.path);

    if (!result.success) {
      console.log(`${RED}FAIL${RESET} - Fetch error: ${result.error}`);
      results.errors.push(`${page.path}: Fetch failed - ${result.error}`);
      continue;
    }

    if (result.status !== 200) {
      console.log(`${RED}FAIL${RESET} - HTTP ${result.status}`);
      results.errors.push(`${page.path}: HTTP ${result.status}`);
      continue;
    }

    const canonical = extractCanonical(result.html);

    if (!canonical) {
      console.log(`${YELLOW}WARN${RESET} - No canonical URL found`);
      results.warnings.push(`${page.path}: No canonical URL found`);
      continue;
    }

    if (!isAbsoluteUrl(canonical)) {
      console.log(`${RED}FAIL${RESET} - Canonical is not absolute: ${canonical}`);
      results.errors.push(`${page.path}: Non-absolute canonical: ${canonical}`);
      continue;
    }

    console.log(`${GREEN}PASS${RESET} (${DIM}${canonical}${RESET})`);
    results.passed++;
  }
}

/**
 * Validate draft content returns 404
 */
async function validateDraftContent(baseUrl, results) {
  console.log("\n" + "-".repeat(70));
  console.log(`${BOLD}DRAFT CONTENT (Must return 404)${RESET}`);
  console.log("-".repeat(70) + "\n");

  // Find draft records
  const [draftPrayerPoint, draftPlace, draftSituation] = await Promise.all([
    prisma.prayerPoint.findFirst({
      where: { status: "draft" },
      select: { slug: true, title: true },
    }),
    prisma.place.findFirst({
      where: { status: "draft" },
      select: { slug: true, name: true },
    }),
    prisma.situation.findFirst({
      where: { status: "draft" },
      select: { slug: true, title: true },
    }),
  ]);

  const draftTests = [
    {
      record: draftPrayerPoint,
      path: draftPrayerPoint ? `/prayer-points/${draftPrayerPoint.slug}` : null,
      name: "Draft Prayer Point",
      title: draftPrayerPoint?.title,
    },
    {
      record: draftPlace,
      path: draftPlace ? `/bible-places/${draftPlace.slug}` : null,
      name: "Draft Place",
      title: draftPlace?.name,
    },
    {
      record: draftSituation,
      path: draftSituation ? `/bible-verses-for/${draftSituation.slug}` : null,
      name: "Draft Situation",
      title: draftSituation?.title,
    },
  ];

  for (const test of draftTests) {
    process.stdout.write(`  ${test.name.padEnd(35)}`);

    if (!test.record || !test.path) {
      console.log(`${YELLOW}SKIP${RESET} - No draft record available`);
      results.skipped.push(`${test.name}: No draft record in database`);
      continue;
    }

    const result = await fetchPage(baseUrl, test.path);

    if (!result.success) {
      console.log(`${RED}FAIL${RESET} - Fetch error: ${result.error}`);
      results.errors.push(`${test.path}: Fetch failed - ${result.error}`);
      continue;
    }

    if (result.status === 404) {
      console.log(`${GREEN}PASS${RESET} (404 for "${test.title}")`);
      results.passed++;
    } else {
      console.log(`${RED}FAIL${RESET} - HTTP ${result.status} (expected 404)`);
      results.errors.push(`${test.path}: Draft returned ${result.status}, expected 404`);
    }
  }
}

/**
 * Validate published content is accessible
 */
async function validatePublishedContent(baseUrl, results) {
  console.log("\n" + "-".repeat(70));
  console.log(`${BOLD}PUBLISHED CONTENT (Must return 200 with canonical)${RESET}`);
  console.log("-".repeat(70) + "\n");

  // Find published records
  const [publishedPrayerPoint, publishedPlace, publishedSituation] = await Promise.all([
    prisma.prayerPoint.findFirst({
      where: { status: "published" },
      select: { slug: true, title: true },
    }),
    prisma.place.findFirst({
      where: { status: "published" },
      select: { slug: true, name: true },
    }),
    prisma.situation.findFirst({
      where: { status: "published" },
      select: { slug: true, title: true },
    }),
  ]);

  const publishedTests = [
    {
      record: publishedPrayerPoint,
      path: publishedPrayerPoint ? `/prayer-points/${publishedPrayerPoint.slug}` : null,
      name: "Published Prayer Point",
      title: publishedPrayerPoint?.title,
    },
    {
      record: publishedPlace,
      path: publishedPlace ? `/bible-places/${publishedPlace.slug}` : null,
      name: "Published Place",
      title: publishedPlace?.name,
    },
    {
      record: publishedSituation,
      path: publishedSituation ? `/bible-verses-for/${publishedSituation.slug}` : null,
      name: "Published Situation",
      title: publishedSituation?.title,
    },
  ];

  for (const test of publishedTests) {
    process.stdout.write(`  ${test.name.padEnd(35)}`);

    if (!test.record || !test.path) {
      console.log(`${YELLOW}SKIP${RESET} - No published record available`);
      results.skipped.push(`${test.name}: No published record in database`);
      continue;
    }

    const result = await fetchPage(baseUrl, test.path);

    if (!result.success) {
      console.log(`${RED}FAIL${RESET} - Fetch error: ${result.error}`);
      results.errors.push(`${test.path}: Fetch failed - ${result.error}`);
      continue;
    }

    if (result.status !== 200) {
      console.log(`${RED}FAIL${RESET} - HTTP ${result.status} (expected 200)`);
      results.errors.push(`${test.path}: Published returned ${result.status}, expected 200`);
      continue;
    }

    // Check canonical
    const canonical = extractCanonical(result.html);
    if (!canonical) {
      console.log(`${YELLOW}WARN${RESET} - HTTP 200 but no canonical ("${test.title}")`);
      results.warnings.push(`${test.path}: No canonical URL found`);
      continue;
    }

    if (!isAbsoluteUrl(canonical)) {
      console.log(`${RED}FAIL${RESET} - Non-absolute canonical: ${canonical}`);
      results.errors.push(`${test.path}: Non-absolute canonical: ${canonical}`);
      continue;
    }

    console.log(`${GREEN}PASS${RESET} ("${test.title}")`);
    results.passed++;
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log(`\n${CYAN}${BOLD}Indexing Policy QA Validation${RESET}\n`);

  const providedBaseUrl = process.env.QA_BASE_URL;

  const results = {
    passed: 0,
    errors: [],
    warnings: [],
    skipped: [],
  };

  let baseUrl;

  try {
    // Start or use existing server
    baseUrl = await startServer(providedBaseUrl);
    logSuccess(`Server ready at ${baseUrl}`);

    // Run validations
    await validateAdminRoutes(baseUrl, results);
    await validatePublicPages(baseUrl, results);
    await validateDraftContent(baseUrl, results);
    await validatePublishedContent(baseUrl, results);

    // Summary
    console.log("\n" + "=".repeat(70));
    console.log(`${BOLD}SUMMARY${RESET}`);
    console.log("=".repeat(70));

    console.log(`
  Passed:   ${results.passed > 0 ? GREEN : ""}${results.passed}${RESET}
  Errors:   ${results.errors.length > 0 ? RED : GREEN}${results.errors.length}${RESET}
  Warnings: ${results.warnings.length > 0 ? YELLOW : GREEN}${results.warnings.length}${RESET}
  Skipped:  ${results.skipped.length > 0 ? YELLOW : ""}${results.skipped.length}${RESET}
`);

    if (results.errors.length > 0) {
      console.log(`${RED}Errors:${RESET}`);
      results.errors.forEach((e) => console.log(`  - ${e}`));
      console.log();
    }

    if (results.warnings.length > 0) {
      console.log(`${YELLOW}Warnings:${RESET}`);
      results.warnings.forEach((w) => console.log(`  - ${w}`));
      console.log();
    }

    if (results.skipped.length > 0) {
      console.log(`${DIM}Skipped:${RESET}`);
      results.skipped.forEach((s) => console.log(`  ${DIM}- ${s}${RESET}`));
      console.log();
    }

    if (results.errors.length > 0) {
      console.log(`${RED}${BOLD}INDEXING POLICY QA FAILED${RESET}\n`);
      process.exitCode = 1;
    } else {
      console.log(`${GREEN}${BOLD}INDEXING POLICY QA PASSED${RESET}\n`);
      process.exitCode = 0;
    }
  } catch (error) {
    logError(`Unexpected error: ${error.message}`);
    console.error(error);
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

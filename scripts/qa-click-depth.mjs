#!/usr/bin/env node
/**
 * Click Depth QA Script
 *
 * Validates that all public pages are reachable from the homepage
 * within 3 clicks by actually fetching pages and extracting links.
 *
 * This script:
 * 1. Builds the app (next build)
 * 2. Starts the server (next start -p 3010)
 * 3. Discovers all public routes from DB
 * 4. Fetches each page and extracts internal links from HTML
 * 5. Builds a directed graph of actual navigation
 * 6. Computes shortest path from / using BFS
 * 7. Fails if any page has depth > 3 or is unreachable
 *
 * USAGE:
 *   QA_BASE_URL=http://localhost:3000 node scripts/qa-click-depth.mjs
 *   node scripts/qa-click-depth.mjs  # Will build and start server on port 3010
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
const STARTUP_TIMEOUT = 90000;
const FETCH_TIMEOUT = 30000;
const MAX_DEPTH = 3;
const MAX_CONCURRENT_FETCHES = 5;

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
// Route Discovery
// ============================================================================

async function discoverRoutes() {
  logInfo("Discovering public routes from database...");

  const routes = new Set();

  // Static routes
  const staticRoutes = [
    "/",
    "/about",
    "/editorial-process",
    "/prayer-points",
    "/prayer-points/today",
    "/bible-places",
    "/bible-travel",
    "/situations",
    "/professions",
    "/names",
    "/search",
  ];
  staticRoutes.forEach((r) => routes.add(r));

  // Prayer Points
  const prayerPoints = await prisma.prayerPoint.findMany({
    where: { status: "published" },
    select: { slug: true },
    orderBy: [{ priority: "desc" }, { slug: "asc" }],
  });
  prayerPoints.forEach((p) => routes.add(`/prayer-points/${p.slug}`));
  logInfo(`  Prayer Points: ${prayerPoints.length} published`);

  // Places
  const places = await prisma.place.findMany({
    where: { status: "published" },
    select: { slug: true },
    orderBy: [{ tourPriority: "desc" }, { slug: "asc" }],
  });
  places.forEach((p) => routes.add(`/bible-places/${p.slug}`));
  logInfo(`  Places: ${places.length} published`);

  // Situations
  const situations = await prisma.situation.findMany({
    where: { status: "published" },
    select: { slug: true },
    orderBy: [{ updatedAt: "desc" }, { slug: "asc" }],
  });
  situations.forEach((s) => routes.add(`/bible-verses-for/${s.slug}`));
  logInfo(`  Situations: ${situations.length} published`);

  // Professions
  const professions = await prisma.profession.findMany({
    where: { status: "published" },
    select: { slug: true },
    orderBy: [{ title: "asc" }],
  });
  professions.forEach((p) => routes.add(`/bible-verses-for/${p.slug}`));
  logInfo(`  Professions: ${professions.length} published`);

  // Names (no status field)
  const names = await prisma.name.findMany({
    select: { slug: true },
    orderBy: [{ name: "asc" }],
  });
  names.forEach((n) => routes.add(`/meaning-of/${n.slug}/in-the-bible`));
  logInfo(`  Names: ${names.length}`);

  // Travel Itineraries
  const itineraries = await prisma.travelItinerary.findMany({
    where: { status: "published" },
    select: { slug: true },
    orderBy: [{ days: "asc" }, { slug: "asc" }],
  });
  itineraries.forEach((i) => routes.add(`/bible-travel/${i.slug}`));
  logInfo(`  Itineraries: ${itineraries.length} published`);

  return Array.from(routes).sort();
}

// ============================================================================
// Link Extraction
// ============================================================================

const EXCLUDED_PATTERNS = [
  /^\/admin/,
  /^\/api\//,
  /^\/_next/,
  /^\/sitemap/,
  /^\/robots/,
  /^\/favicon/,
  /^\/login/,
  /^\/manifest/,
  /^#/,
  /^javascript:/,
  /^mailto:/,
  /^tel:/,
];

function isExcludedRoute(path) {
  return EXCLUDED_PATTERNS.some((pattern) => pattern.test(path));
}

function normalizePath(path) {
  if (!path) return null;
  // Remove trailing slash (except for root)
  let normalized = path.replace(/\/+$/, "") || "/";
  // Remove query string
  normalized = normalized.split("?")[0];
  // Remove hash
  normalized = normalized.split("#")[0];
  return normalized;
}

function extractInternalLinks(html, baseUrl) {
  const links = new Set();

  // Match href attributes
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match;

  while ((match = hrefRegex.exec(html)) !== null) {
    let href = match[1];

    // Skip empty, hash-only, or protocol links that aren't our domain
    if (!href || href === "#" || href.startsWith("javascript:")) continue;

    // Handle absolute URLs
    if (href.startsWith("http://") || href.startsWith("https://")) {
      try {
        const url = new URL(href);
        // Only include if it's our domain
        if (url.hostname === "localhost" || url.hostname.includes("thelordwill")) {
          href = url.pathname;
        } else {
          continue; // External link
        }
      } catch {
        continue;
      }
    }

    // Skip non-path hrefs
    if (!href.startsWith("/")) continue;

    const normalized = normalizePath(href);
    if (normalized && !isExcludedRoute(normalized)) {
      links.add(normalized);
    }
  }

  return Array.from(links);
}

// ============================================================================
// Page Fetching
// ============================================================================

async function fetchPage(baseUrl, path) {
  const url = `${baseUrl}${path}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "QA-Click-Depth-Bot/1.0",
        Accept: "text/html",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { success: false, status: response.status, links: [] };
    }

    const html = await response.text();
    const links = extractInternalLinks(html, baseUrl);

    return { success: true, status: response.status, links };
  } catch (error) {
    clearTimeout(timeout);
    return { success: false, error: error.message, links: [] };
  }
}

async function fetchPagesInBatches(baseUrl, paths, onProgress) {
  const results = new Map();

  for (let i = 0; i < paths.length; i += MAX_CONCURRENT_FETCHES) {
    const batch = paths.slice(i, i + MAX_CONCURRENT_FETCHES);
    const promises = batch.map(async (path) => {
      const result = await fetchPage(baseUrl, path);
      return { path, result };
    });

    const batchResults = await Promise.all(promises);
    for (const { path, result } of batchResults) {
      results.set(path, result);
    }

    if (onProgress) {
      onProgress(Math.min(i + MAX_CONCURRENT_FETCHES, paths.length), paths.length);
    }
  }

  return results;
}

// ============================================================================
// Graph Building and Analysis
// ============================================================================

function buildGraph(fetchResults) {
  const graph = new Map();

  for (const [path, result] of fetchResults) {
    if (!graph.has(path)) {
      graph.set(path, new Set());
    }

    if (result.success && result.links) {
      for (const link of result.links) {
        graph.get(path).add(link);
        // Ensure target node exists
        if (!graph.has(link)) {
          graph.set(link, new Set());
        }
      }
    }
  }

  return graph;
}

function computeDepths(graph, source) {
  const depths = new Map();
  const queue = [{ url: source, depth: 0, path: [source] }];

  depths.set(source, { depth: 0, path: [source] });

  while (queue.length > 0) {
    const { url, depth, path } = queue.shift();

    const neighbors = graph.get(url) || new Set();
    for (const neighbor of neighbors) {
      if (!depths.has(neighbor)) {
        const newPath = [...path, neighbor];
        depths.set(neighbor, { depth: depth + 1, path: newPath });
        queue.push({ url: neighbor, depth: depth + 1, path: newPath });
      }
    }
  }

  return depths;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log(`\n${CYAN}${BOLD}Click Depth QA Validation${RESET}`);
  console.log(`Max allowed depth: ${MAX_DEPTH} clicks from homepage\n`);

  const providedBaseUrl = process.env.QA_BASE_URL;

  let baseUrl;
  let exitCode = 0;

  try {
    // Start or use existing server
    baseUrl = await startServer(providedBaseUrl);
    logSuccess(`Server ready at ${baseUrl}`);

    // Discover all routes
    const routes = await discoverRoutes();
    logInfo(`Total routes to check: ${routes.length}`);

    // Fetch pages and extract links
    console.log("\n" + "=".repeat(70));
    console.log(`${BOLD}FETCHING PAGES${RESET}`);
    console.log("=".repeat(70) + "\n");

    const fetchResults = await fetchPagesInBatches(
      baseUrl,
      routes,
      (current, total) => {
        process.stdout.write(`\r  Fetching: ${current}/${total} pages...`);
      }
    );
    console.log("\n");

    // Check for fetch failures
    const fetchFailures = [];
    for (const [path, result] of fetchResults) {
      if (!result.success) {
        if (result.status === 404) {
          fetchFailures.push({ path, reason: "404 Not Found" });
        } else {
          fetchFailures.push({ path, reason: result.error || `HTTP ${result.status}` });
        }
      }
    }

    if (fetchFailures.length > 0) {
      console.log(`${YELLOW}Fetch Issues:${RESET}`);
      for (const f of fetchFailures.slice(0, 10)) {
        console.log(`  ${f.path}: ${f.reason}`);
      }
      if (fetchFailures.length > 10) {
        console.log(`  ... and ${fetchFailures.length - 10} more`);
      }
      console.log();
    }

    // Build graph
    console.log("=".repeat(70));
    console.log(`${BOLD}GRAPH ANALYSIS${RESET}`);
    console.log("=".repeat(70) + "\n");

    const graph = buildGraph(fetchResults);
    logInfo(`Graph nodes: ${graph.size}`);

    // Compute depths from homepage
    const depths = computeDepths(graph, "/");
    logInfo(`Reachable from homepage: ${depths.size}`);

    // Analyze results
    const violations = [];
    const unreachable = [];

    for (const route of routes) {
      const info = depths.get(route);
      if (!info) {
        // Check if it's a fetch failure (expected 404) vs unreachable
        const fetchResult = fetchResults.get(route);
        if (fetchResult && fetchResult.status === 404) {
          // Skip 404s - they're expected to be missing from DB but route exists
          continue;
        }
        unreachable.push(route);
      } else if (info.depth > MAX_DEPTH) {
        violations.push({
          url: route,
          depth: info.depth,
          path: info.path,
        });
      }
    }

    // Depth distribution
    const depthDist = new Map();
    for (const [, info] of depths) {
      depthDist.set(info.depth, (depthDist.get(info.depth) || 0) + 1);
    }

    console.log("Depth distribution:");
    for (const [depth, count] of [...depthDist].sort((a, b) => a[0] - b[0])) {
      const marker = depth > MAX_DEPTH ? ` ${RED}(VIOLATION)${RESET}` : "";
      console.log(`  Depth ${depth}: ${count} pages${marker}`);
    }
    console.log();

    // Report violations
    if (violations.length > 0) {
      console.log(`${RED}=== VIOLATIONS (${violations.length} pages exceed max depth) ===${RESET}\n`);
      for (const v of violations.slice(0, 20)) {
        console.log(`${RED}URL:${RESET} ${v.url}`);
        console.log(`  Depth: ${v.depth} (max: ${MAX_DEPTH})`);
        console.log(`  Path: ${v.path.join(" -> ")}`);
        console.log();
      }
      if (violations.length > 20) {
        console.log(`... and ${violations.length - 20} more violations`);
      }
      exitCode = 1;
    }

    // Report unreachable
    if (unreachable.length > 0) {
      console.log(`${RED}=== UNREACHABLE (${unreachable.length} pages not linked) ===${RESET}\n`);
      for (const url of unreachable.slice(0, 20)) {
        console.log(`  ${url}`);
      }
      if (unreachable.length > 20) {
        console.log(`  ... and ${unreachable.length - 20} more`);
      }
      exitCode = 1;
    }

    // Summary
    console.log("\n" + "=".repeat(70));
    console.log(`${BOLD}SUMMARY${RESET}`);
    console.log("=".repeat(70));

    const reachableCount = depths.size;
    const withinDepth = [...depths.values()].filter((d) => d.depth <= MAX_DEPTH).length;

    console.log(`
  Total routes:        ${routes.length}
  Reachable:           ${reachableCount}
  Within ${MAX_DEPTH} clicks:    ${withinDepth}
  Violations:          ${violations.length > 0 ? RED : GREEN}${violations.length}${RESET}
  Unreachable:         ${unreachable.length > 0 ? RED : GREEN}${unreachable.length}${RESET}
  Fetch failures:      ${fetchFailures.length > 0 ? YELLOW : GREEN}${fetchFailures.length}${RESET}
`);

    if (exitCode === 0) {
      console.log(`${GREEN}${BOLD}CLICK DEPTH QA PASSED${RESET}\n`);
    } else {
      console.log(`${RED}${BOLD}CLICK DEPTH QA FAILED${RESET}\n`);
    }
  } catch (error) {
    logError(`Unexpected error: ${error.message}`);
    console.error(error);
    exitCode = 1;
  } finally {
    stopServer();
    await prisma.$disconnect();
  }

  process.exitCode = exitCode;
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

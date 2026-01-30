#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";

const MAX_CLICKS = 3;
const HUB_ROUTES = [
  "/bible-places",
  "/situations",
  "/professions",
  "/prayer-points",
  "/names",
];

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

function addEdge(map, from, to) {
  if (!map.has(from)) {
    map.set(from, new Set());
  }
  map.get(from).add(to);
}

async function buildAdjacency(prisma) {
  const adjacency = new Map();
  HUB_ROUTES.forEach((hub) => addEdge(adjacency, "/", hub));

  const verseRoutes = new Set();
  const detailRoutes = [];

  const places = await prisma.place.findMany({
    where: { status: "published" },
    select: { id: true, slug: true },
    orderBy: { tourPriority: "desc" },
    take: 12,
  });

  for (const place of places) {
    const detailPath = `/bible-places/${place.slug}`;
    addEdge(adjacency, "/bible-places", detailPath);
    detailRoutes.push(detailPath);

    const verseMappings = await prisma.placeVerseMapping.findMany({
      where: { placeId: place.id },
      include: { verse: { select: { bookId: true, chapter: true, verseNumber: true } } },
      orderBy: { relevanceScore: "desc" },
      take: 5,
    });

    for (const mapping of verseMappings) {
      const route = `/verse/${mapping.verse.bookId}/${mapping.verse.chapter}/${mapping.verse.verseNumber}`;
      addEdge(adjacency, detailPath, route);
      verseRoutes.add(route);
    }
  }

  const prayerPoints = await prisma.prayerPoint.findMany({
    where: { status: "published" },
    select: { id: true, slug: true },
    orderBy: { updatedAt: "desc" },
    take: 12,
  });

  for (const point of prayerPoints) {
    const detailPath = `/prayer-points/${point.slug}`;
    addEdge(adjacency, "/prayer-points", detailPath);
    detailRoutes.push(detailPath);

    const mappings = await prisma.prayerPointVerseMapping.findMany({
      where: { prayerPointId: point.id },
      include: { verse: { select: { bookId: true, chapter: true, verseNumber: true } } },
      orderBy: { relevanceScore: "desc" },
      take: 5,
    });

    for (const mapping of mappings) {
      const route = `/verse/${mapping.verse.bookId}/${mapping.verse.chapter}/${mapping.verse.verseNumber}`;
      addEdge(adjacency, detailPath, route);
      verseRoutes.add(route);
    }
  }

  const situations = await prisma.situation.findMany({
    where: { status: "published" },
    select: { id: true, slug: true },
    orderBy: { updatedAt: "desc" },
    take: 12,
  });

  for (const situation of situations) {
    const detailPath = `/bible-verses-for/${situation.slug}`;
    addEdge(adjacency, "/situations", detailPath);
    detailRoutes.push(detailPath);

    const mappings = await prisma.situationVerseMapping.findMany({
      where: { situationId: situation.id },
      include: { verse: { select: { bookId: true, chapter: true, verseNumber: true } } },
      orderBy: { relevanceScore: "desc" },
      take: 5,
    });

    for (const mapping of mappings) {
      const route = `/verse/${mapping.verse.bookId}/${mapping.verse.chapter}/${mapping.verse.verseNumber}`;
      addEdge(adjacency, detailPath, route);
      verseRoutes.add(route);
    }
  }

  const names = await prisma.name.findMany({
    select: { id: true, slug: true },
    take: 12,
    orderBy: { name: "asc" },
  });

  for (const name of names) {
    const detailPath = `/meaning-of/${name.slug}/in-the-bible`;
    addEdge(adjacency, "/names", detailPath);
    detailRoutes.push(detailPath);

    const mentions = await prisma.nameMention.findMany({
      where: { nameId: name.id },
      include: { verse: { select: { bookId: true, chapter: true, verseNumber: true } } },
      orderBy: { verseId: "asc" },
      take: 3,
    });

    for (const mention of mentions) {
      const route = `/verse/${mention.verse.bookId}/${mention.verse.chapter}/${mention.verse.verseNumber}`;
      addEdge(adjacency, detailPath, route);
      verseRoutes.add(route);
    }
  }

  return { adjacency, detailRoutes, verseRoutes };
}

function computeDistances(adjacency) {
  const distances = new Map();
  const queue = ["/"];
  distances.set("/", 0);

  while (queue.length > 0) {
    const current = queue.shift();
    const neighbors = adjacency.get(current) ?? new Set();
    for (const neighbor of neighbors) {
      if (!distances.has(neighbor)) {
        distances.set(neighbor, distances.get(current) + 1);
        queue.push(neighbor);
      }
    }
  }

  return distances;
}

function logStatus(heading, message, success = true) {
  const color = success ? GREEN : RED;
  console.log(`${color}${heading}${RESET} ${message}`);
}

async function main() {
  const prisma = new PrismaClient();
  const result = {
    passed: true,
    failures: [],
  };

  try {
    const { adjacency, detailRoutes, verseRoutes } = await buildAdjacency(prisma);
    const distances = computeDistances(adjacency);

    const targetRoutes = [...detailRoutes, ...Array.from(verseRoutes)];
    const unreachable = [];

    for (const route of targetRoutes) {
      const clicks = distances.get(route);
      if (clicks === undefined || clicks > MAX_CLICKS) {
        unreachable.push({ route, clicks });
      }
    }

    if (unreachable.length === 0) {
      logStatus("PASS", `All ${targetRoutes.length} routes are within ${MAX_CLICKS} clicks.`);
    } else {
      result.passed = false;
      logStatus("FAIL", `${unreachable.length} routes exceed ${MAX_CLICKS} clicks.`);
      unreachable.forEach((item) => {
        console.log(`  - ${item.route} (depth: ${item.clicks ?? "∞"})`);
      });
    }
  } catch (error) {
    result.passed = false;
    logStatus("FAIL", `Unexpected error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }

  process.exitCode = result.passed ? 0 : 1;
}

main().catch((error) => {
  console.error(`${RED}Fatal error:${RESET}`, error);
  process.exitCode = 1;
});

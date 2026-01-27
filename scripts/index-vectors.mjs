#!/usr/bin/env node
/**
 * Offline Vector Indexing Script
 *
 * Generates embeddings for all searchable content and upserts to vector store.
 *
 * Usage:
 *   EMBEDDINGS_PROVIDER=openai VECTOR_PROVIDER=pinecone node scripts/index-vectors.mjs
 *
 * Environment:
 *   EMBEDDINGS_PROVIDER=openai|none (required)
 *   VECTOR_PROVIDER=pinecone|milvus (required)
 *   OPENAI_API_KEY (required if EMBEDDINGS_PROVIDER=openai)
 *   PINECONE_API_KEY / MILVUS_ADDRESS (required based on vector provider)
 *   DATABASE_URL (required)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Configuration
const EMBEDDINGS_PROVIDER = process.env.EMBEDDINGS_PROVIDER || "none";
const VECTOR_PROVIDER = process.env.VECTOR_PROVIDER || "none";
const BATCH_SIZE = 100;
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate embeddings using OpenAI
 */
async function generateEmbeddings(texts) {
  if (EMBEDDINGS_PROVIDER === "none") {
    throw new Error("EMBEDDINGS_PROVIDER=none, cannot generate embeddings");
  }

  if (EMBEDDINGS_PROVIDER !== "openai") {
    throw new Error(`Unknown EMBEDDINGS_PROVIDER: ${EMBEDDINGS_PROVIDER}`);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.data.map((item) => item.embedding);
}

/**
 * Get Pinecone client
 */
async function getPineconeIndex() {
  const { Pinecone } = await import("@pinecone-database/pinecone");
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX || "thelordwill";

  if (!apiKey) {
    throw new Error("PINECONE_API_KEY not set");
  }

  const client = new Pinecone({ apiKey });
  return client.index(indexName);
}

/**
 * Get Milvus client
 */
async function getMilvusClient() {
  const { MilvusClient } = await import("@zilliz/milvus2-sdk-node");
  const address = process.env.MILVUS_ADDRESS || "localhost:19530";
  const collectionName = process.env.MILVUS_COLLECTION || "thelordwill";

  const client = new MilvusClient({ address });
  return { client, collectionName };
}

/**
 * Upsert vectors to the configured provider
 */
async function upsertVectors(items) {
  if (VECTOR_PROVIDER === "pinecone") {
    const index = await getPineconeIndex();
    const vectors = items.map((item) => ({
      id: item.id,
      values: item.embedding,
      metadata: item.metadata,
    }));

    // Pinecone batch size limit
    for (let i = 0; i < vectors.length; i += 100) {
      await index.upsert(vectors.slice(i, i + 100));
    }
  } else if (VECTOR_PROVIDER === "milvus") {
    const { client, collectionName } = await getMilvusClient();
    const data = items.map((item) => ({
      id: item.id,
      embedding: item.embedding,
      metadata: JSON.stringify(item.metadata),
    }));

    for (let i = 0; i < data.length; i += 1000) {
      await client.insert({
        collection_name: collectionName,
        data: data.slice(i, i + 1000),
      });
    }
  } else {
    throw new Error(`Unknown VECTOR_PROVIDER: ${VECTOR_PROVIDER}`);
  }
}

/**
 * Build searchable text for an entity
 */
function buildSearchText(entity, type) {
  switch (type) {
    case "situation":
      return [entity.title, entity.metaDescription, entity.content || ""]
        .filter(Boolean)
        .join(" ");
    case "prayerPoint":
      return [
        entity.title,
        entity.description,
        entity.content || "",
        entity.openingPrayer || "",
      ]
        .filter(Boolean)
        .join(" ");
    case "place":
      return [
        entity.name,
        entity.description,
        entity.biblicalContext || "",
        entity.historicalInfo || "",
        entity.country || "",
        entity.region || "",
      ]
        .filter(Boolean)
        .join(" ");
    case "profession":
      return [entity.title, entity.description, entity.content || ""]
        .filter(Boolean)
        .join(" ");
    case "name":
      return [entity.name, entity.meaning, entity.characterDescription]
        .filter(Boolean)
        .join(" ");
    default:
      return "";
  }
}

/**
 * Build URL for an entity
 */
function buildUrl(entity, type) {
  switch (type) {
    case "situation":
      return `/bible-verses-for/${entity.slug}`;
    case "prayerPoint":
      return `/prayer-points/${entity.slug}`;
    case "place":
      return `/bible-places/${entity.slug}`;
    case "profession":
      return `/prayers-for-professions/${entity.slug}`;
    case "name":
      return `/meaning-of/${entity.slug}`;
    default:
      return "/";
  }
}

/**
 * Index a batch of entities
 */
async function indexBatch(entities, type) {
  if (entities.length === 0) return 0;

  // Build texts for embedding
  const texts = entities.map((e) => buildSearchText(e, type));

  // Generate embeddings
  const embeddings = await generateEmbeddings(texts);

  // Build vector items
  const items = entities.map((entity, idx) => ({
    id: `${type}:${entity.id || entity.slug}`,
    embedding: embeddings[idx],
    metadata: {
      type,
      id: entity.id || entity.slug,
      title: entity.title || entity.name,
      description: (
        entity.metaDescription ||
        entity.description ||
        entity.meaning ||
        ""
      ).substring(0, 500),
      slug: entity.slug,
      url: buildUrl(entity, type),
    },
  }));

  // Upsert to vector store
  await upsertVectors(items);

  return items.length;
}

/**
 * Index all situations
 */
async function indexSituations() {
  console.log("Indexing situations...");
  let indexed = 0;
  let skip = 0;

  while (true) {
    const batch = await prisma.situation.findMany({
      where: { status: "published" },
      select: {
        id: true,
        slug: true,
        title: true,
        metaDescription: true,
        content: true,
      },
      skip,
      take: BATCH_SIZE,
      orderBy: { slug: "asc" },
    });

    if (batch.length === 0) break;

    indexed += await indexBatch(batch, "situation");
    skip += BATCH_SIZE;
    console.log(`  Indexed ${indexed} situations...`);
  }

  return indexed;
}

/**
 * Index all prayer points
 */
async function indexPrayerPoints() {
  console.log("Indexing prayer points...");
  let indexed = 0;
  let skip = 0;

  while (true) {
    const batch = await prisma.prayerPoint.findMany({
      where: { status: "published" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        content: true,
        openingPrayer: true,
      },
      skip,
      take: BATCH_SIZE,
      orderBy: { slug: "asc" },
    });

    if (batch.length === 0) break;

    indexed += await indexBatch(batch, "prayerPoint");
    skip += BATCH_SIZE;
    console.log(`  Indexed ${indexed} prayer points...`);
  }

  return indexed;
}

/**
 * Index all places
 */
async function indexPlaces() {
  console.log("Indexing places...");
  let indexed = 0;
  let skip = 0;

  while (true) {
    const batch = await prisma.place.findMany({
      where: { status: "published" },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        biblicalContext: true,
        historicalInfo: true,
        country: true,
        region: true,
      },
      skip,
      take: BATCH_SIZE,
      orderBy: { slug: "asc" },
    });

    if (batch.length === 0) break;

    indexed += await indexBatch(batch, "place");
    skip += BATCH_SIZE;
    console.log(`  Indexed ${indexed} places...`);
  }

  return indexed;
}

/**
 * Index all professions
 */
async function indexProfessions() {
  console.log("Indexing professions...");
  let indexed = 0;
  let skip = 0;

  while (true) {
    const batch = await prisma.profession.findMany({
      where: { status: "published" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        content: true,
      },
      skip,
      take: BATCH_SIZE,
      orderBy: { slug: "asc" },
    });

    if (batch.length === 0) break;

    indexed += await indexBatch(batch, "profession");
    skip += BATCH_SIZE;
    console.log(`  Indexed ${indexed} professions...`);
  }

  return indexed;
}

/**
 * Index all names
 */
async function indexNames() {
  console.log("Indexing names...");
  let indexed = 0;
  let skip = 0;

  while (true) {
    const batch = await prisma.name.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        meaning: true,
        characterDescription: true,
      },
      skip,
      take: BATCH_SIZE,
      orderBy: { slug: "asc" },
    });

    if (batch.length === 0) break;

    indexed += await indexBatch(batch, "name");
    skip += BATCH_SIZE;
    console.log(`  Indexed ${indexed} names...`);
  }

  return indexed;
}

/**
 * Main entry point
 */
async function main() {
  console.log("=== Vector Indexing Script ===");
  console.log(`EMBEDDINGS_PROVIDER: ${EMBEDDINGS_PROVIDER}`);
  console.log(`VECTOR_PROVIDER: ${VECTOR_PROVIDER}`);
  console.log("");

  if (EMBEDDINGS_PROVIDER === "none") {
    console.error("Error: EMBEDDINGS_PROVIDER=none, cannot generate embeddings");
    console.error("Set EMBEDDINGS_PROVIDER=openai to enable embedding generation");
    process.exit(1);
  }

  if (VECTOR_PROVIDER === "none") {
    console.error("Error: VECTOR_PROVIDER=none, cannot store vectors");
    console.error("Set VECTOR_PROVIDER=pinecone or VECTOR_PROVIDER=milvus");
    process.exit(1);
  }

  try {
    const results = {
      situations: await indexSituations(),
      prayerPoints: await indexPrayerPoints(),
      places: await indexPlaces(),
      professions: await indexProfessions(),
      names: await indexNames(),
    };

    console.log("");
    console.log("=== Indexing Complete ===");
    console.log(`Situations:    ${results.situations}`);
    console.log(`Prayer Points: ${results.prayerPoints}`);
    console.log(`Places:        ${results.places}`);
    console.log(`Professions:   ${results.professions}`);
    console.log(`Names:         ${results.names}`);
    console.log(
      `Total:         ${Object.values(results).reduce((a, b) => a + b, 0)}`
    );
  } catch (error) {
    console.error("Indexing failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

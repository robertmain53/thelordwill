/**
 * Vector Provider Abstraction
 *
 * Supports Pinecone, Milvus, or none (falls back to SQL keyword search).
 * VECTOR_PROVIDER env var controls which provider is used.
 *
 * Note: Pinecone/Milvus packages are optional. Install them only when needed:
 *   npm install @pinecone-database/pinecone  # for Pinecone
 *   npm install @zilliz/milvus2-sdk-node    # for Milvus
 */

export type VectorProvider = "pinecone" | "milvus" | "none";

export interface VectorItem {
  id: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}

export interface VectorMatch {
  id: string;
  score: number;
  metadata: Record<string, unknown>;
}

export class VectorProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: VectorProvider
  ) {
    super(message);
    this.name = "VectorProviderError";
  }
}

/**
 * Get the current vector provider from environment
 */
export function getVectorProvider(): VectorProvider {
  const provider = process.env.VECTOR_PROVIDER || "none";
  if (provider === "pinecone" || provider === "milvus" || provider === "none") {
    return provider;
  }
  console.warn(`Unknown VECTOR_PROVIDER "${provider}", defaulting to "none"`);
  return "none";
}

/**
 * Upsert vectors into the configured vector store
 * Used by the offline indexing script
 */
export async function upsertVectors(items: VectorItem[]): Promise<void> {
  const provider = getVectorProvider();

  switch (provider) {
    case "pinecone":
      return upsertPinecone(items);
    case "milvus":
      return upsertMilvus(items);
    case "none":
      throw new VectorProviderError(
        "No vector provider configured. Set VECTOR_PROVIDER=pinecone or milvus.",
        provider
      );
  }
}

/**
 * Query vectors for similarity search
 * Returns matches sorted by similarity score (highest first)
 */
export async function queryVectors(
  queryEmbedding: number[],
  topK: number = 10
): Promise<VectorMatch[]> {
  const provider = getVectorProvider();

  switch (provider) {
    case "pinecone":
      return queryPinecone(queryEmbedding, topK);
    case "milvus":
      return queryMilvus(queryEmbedding, topK);
    case "none":
      throw new VectorProviderError(
        "No vector provider configured. Falling back to keyword search.",
        provider
      );
  }
}

// ============================================================================
// Pinecone Implementation
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PineconeClass: any = null;

async function loadPinecone() {
  if (PineconeClass) return PineconeClass;

  try {
    // Dynamic require to avoid build-time resolution
    const mod = await eval('import("@pinecone-database/pinecone")');
    PineconeClass = mod.Pinecone;
    return PineconeClass;
  } catch {
    throw new VectorProviderError(
      "Pinecone SDK not installed. Run: npm install @pinecone-database/pinecone",
      "pinecone"
    );
  }
}

async function getPineconeClient() {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX || "thelordwill";

  if (!apiKey) {
    throw new VectorProviderError(
      "PINECONE_API_KEY not configured",
      "pinecone"
    );
  }

  const Pinecone = await loadPinecone();
  const client = new Pinecone({ apiKey });
  return client.index(indexName);
}

async function upsertPinecone(items: VectorItem[]): Promise<void> {
  const index = await getPineconeClient();

  // Pinecone recommends batches of 100
  const batchSize = 100;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const vectors = batch.map((item) => ({
      id: item.id,
      values: item.embedding,
      metadata: item.metadata,
    }));
    await index.upsert(vectors);
  }
}

async function queryPinecone(
  queryEmbedding: number[],
  topK: number
): Promise<VectorMatch[]> {
  const index = await getPineconeClient();

  const result = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });

  return (result.matches || []).map((match: { id: string; score?: number; metadata?: Record<string, unknown> }) => ({
    id: match.id,
    score: match.score || 0,
    metadata: (match.metadata as Record<string, unknown>) || {},
  }));
}

// ============================================================================
// Milvus Implementation
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MilvusClientClass: any = null;

async function loadMilvus() {
  if (MilvusClientClass) return MilvusClientClass;

  try {
    // Dynamic require to avoid build-time resolution
    const mod = await eval('import("@zilliz/milvus2-sdk-node")');
    MilvusClientClass = mod.MilvusClient;
    return MilvusClientClass;
  } catch {
    throw new VectorProviderError(
      "Milvus SDK not installed. Run: npm install @zilliz/milvus2-sdk-node",
      "milvus"
    );
  }
}

async function getMilvusClient() {
  const address = process.env.MILVUS_ADDRESS || "localhost:19530";
  const collectionName = process.env.MILVUS_COLLECTION || "thelordwill";

  const MilvusClient = await loadMilvus();
  const client = new MilvusClient({ address });

  return { client, collectionName };
}

async function upsertMilvus(items: VectorItem[]): Promise<void> {
  const { client, collectionName } = await getMilvusClient();

  // Prepare data for Milvus insert
  const data = items.map((item) => ({
    id: item.id,
    embedding: item.embedding,
    metadata: JSON.stringify(item.metadata),
  }));

  // Milvus recommends batches of 1000
  const batchSize = 1000;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    await client.insert({
      collection_name: collectionName,
      data: batch,
    });
  }
}

async function queryMilvus(
  queryEmbedding: number[],
  topK: number
): Promise<VectorMatch[]> {
  const { client, collectionName } = await getMilvusClient();

  const result = await client.search({
    collection_name: collectionName,
    data: [queryEmbedding],
    limit: topK,
    output_fields: ["id", "metadata"],
  });

  if (!result.results || result.results.length === 0) {
    return [];
  }

  return result.results.map((match: { id: string | number; score?: number; metadata?: string }) => ({
    id: String(match.id),
    score: match.score || 0,
    metadata: match.metadata
      ? JSON.parse(String(match.metadata))
      : {},
  }));
}

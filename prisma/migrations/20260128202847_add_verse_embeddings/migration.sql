-- CreateTable
CREATE TABLE "VerseEmbedding" (
    "id" TEXT NOT NULL,
    "verseId" INTEGER NOT NULL,
    "model" TEXT NOT NULL,
    "dims" INTEGER NOT NULL,
    "vector" JSONB NOT NULL,
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerseEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerseEmbedding_verseId_key" ON "VerseEmbedding"("verseId");

-- CreateIndex
CREATE INDEX "VerseEmbedding_verseId_idx" ON "VerseEmbedding"("verseId");

-- CreateIndex
CREATE INDEX "VerseEmbedding_model_idx" ON "VerseEmbedding"("model");

-- CreateIndex
CREATE INDEX "VerseEmbedding_contentHash_idx" ON "VerseEmbedding"("contentHash");

-- AddForeignKey
ALTER TABLE "VerseEmbedding" ADD CONSTRAINT "VerseEmbedding_verseId_fkey" FOREIGN KEY ("verseId") REFERENCES "Verse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

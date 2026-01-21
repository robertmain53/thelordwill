-- Place
ALTER TABLE "Place" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE "Place" ADD COLUMN "publishedAt" TIMESTAMP(3);

-- Backfill existing rows so site doesn't go empty
UPDATE "Place"
SET "status" = 'published',
    "publishedAt" = COALESCE("publishedAt", NOW())
WHERE "status" = 'draft';

CREATE INDEX "Place_status_idx" ON "Place"("status");

-- Situation
ALTER TABLE "Situation" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE "Situation" ADD COLUMN "publishedAt" TIMESTAMP(3);

UPDATE "Situation"
SET "status" = 'published',
    "publishedAt" = COALESCE("publishedAt", NOW())
WHERE "status" = 'draft';

CREATE INDEX "Situation_status_idx" ON "Situation"("status");

-- Profession
ALTER TABLE "Profession" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE "Profession" ADD COLUMN "publishedAt" TIMESTAMP(3);

UPDATE "Profession"
SET "status" = 'published',
    "publishedAt" = COALESCE("publishedAt", NOW())
WHERE "status" = 'draft';

CREATE INDEX "Profession_status_idx" ON "Profession"("status");


/*
  Warnings:

  - Added the required column `updatedAt` to the `PrayerPointRelation` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PrayerPoint_title_idx";

-- DropIndex
DROP INDEX "PrayerPoint_title_key";

-- AlterTable
ALTER TABLE "PrayerPoint" ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft';

-- AlterTable
ALTER TABLE "PrayerPointRelation" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "TaxonomyLabel" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxonomyLabel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaxonomyLabel_scope_idx" ON "TaxonomyLabel"("scope");

-- CreateIndex
CREATE INDEX "TaxonomyLabel_isActive_idx" ON "TaxonomyLabel"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomyLabel_scope_key_key" ON "TaxonomyLabel"("scope", "key");

-- CreateIndex
CREATE INDEX "PrayerPoint_status_idx" ON "PrayerPoint"("status");

-- CreateIndex
CREATE INDEX "PrayerPointRelation_relatedPrayerPointId_idx" ON "PrayerPointRelation"("relatedPrayerPointId");

-- AddForeignKey
ALTER TABLE "PrayerPointRelation" ADD CONSTRAINT "PrayerPointRelation_relatedPrayerPointId_fkey" FOREIGN KEY ("relatedPrayerPointId") REFERENCES "PrayerPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

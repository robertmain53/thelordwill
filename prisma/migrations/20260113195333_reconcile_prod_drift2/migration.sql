-- AlterTable
ALTER TABLE "TourLead" ADD COLUMN     "contextName" TEXT,
ADD COLUMN     "contextSlug" TEXT,
ADD COLUMN     "contextType" TEXT,
ADD COLUMN     "fbclid" TEXT,
ADD COLUMN     "gclid" TEXT,
ADD COLUMN     "groupSizeRaw" TEXT,
ADD COLUMN     "sourceReferrer" TEXT,
ADD COLUMN     "utmContent" TEXT,
ADD COLUMN     "utmTerm" TEXT;

-- CreateTable
CREATE TABLE "PrayerPoint" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT,
    "category" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "dailyRotation" BOOLEAN NOT NULL DEFAULT false,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrayerPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrayerPointVerseMapping" (
    "id" TEXT NOT NULL,
    "prayerPointId" TEXT NOT NULL,
    "verseId" INTEGER NOT NULL,
    "relevanceScore" INTEGER NOT NULL DEFAULT 50,
    "prayerFocus" TEXT,
    "contextNote" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrayerPointVerseMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrayerPointRelation" (
    "id" TEXT NOT NULL,
    "prayerPointId" TEXT NOT NULL,
    "relatedPrayerPointId" TEXT NOT NULL,

    CONSTRAINT "PrayerPointRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPrayerPoint" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prayerPointId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyPrayerPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrayerPoint_slug_key" ON "PrayerPoint"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PrayerPoint_title_key" ON "PrayerPoint"("title");

-- CreateIndex
CREATE INDEX "PrayerPoint_slug_idx" ON "PrayerPoint"("slug");

-- CreateIndex
CREATE INDEX "PrayerPoint_title_idx" ON "PrayerPoint"("title");

-- CreateIndex
CREATE INDEX "PrayerPoint_category_idx" ON "PrayerPoint"("category");

-- CreateIndex
CREATE INDEX "PrayerPoint_priority_idx" ON "PrayerPoint"("priority");

-- CreateIndex
CREATE INDEX "PrayerPoint_dailyRotation_idx" ON "PrayerPoint"("dailyRotation");

-- CreateIndex
CREATE INDEX "PrayerPointVerseMapping_prayerPointId_relevanceScore_idx" ON "PrayerPointVerseMapping"("prayerPointId", "relevanceScore");

-- CreateIndex
CREATE INDEX "PrayerPointVerseMapping_verseId_idx" ON "PrayerPointVerseMapping"("verseId");

-- CreateIndex
CREATE INDEX "PrayerPointVerseMapping_relevanceScore_idx" ON "PrayerPointVerseMapping"("relevanceScore");

-- CreateIndex
CREATE INDEX "PrayerPointVerseMapping_prayerFocus_idx" ON "PrayerPointVerseMapping"("prayerFocus");

-- CreateIndex
CREATE UNIQUE INDEX "PrayerPointVerseMapping_prayerPointId_verseId_key" ON "PrayerPointVerseMapping"("prayerPointId", "verseId");

-- CreateIndex
CREATE INDEX "PrayerPointRelation_prayerPointId_idx" ON "PrayerPointRelation"("prayerPointId");

-- CreateIndex
CREATE UNIQUE INDEX "PrayerPointRelation_prayerPointId_relatedPrayerPointId_key" ON "PrayerPointRelation"("prayerPointId", "relatedPrayerPointId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPrayerPoint_date_key" ON "DailyPrayerPoint"("date");

-- CreateIndex
CREATE INDEX "DailyPrayerPoint_date_idx" ON "DailyPrayerPoint"("date");

-- CreateIndex
CREATE INDEX "DailyPrayerPoint_prayerPointId_idx" ON "DailyPrayerPoint"("prayerPointId");

-- CreateIndex
CREATE INDEX "TourLead_utmSource_idx" ON "TourLead"("utmSource");

-- CreateIndex
CREATE INDEX "TourLead_utmCampaign_idx" ON "TourLead"("utmCampaign");

-- CreateIndex
CREATE INDEX "TourLead_gclid_idx" ON "TourLead"("gclid");

-- CreateIndex
CREATE INDEX "TourLead_contextType_idx" ON "TourLead"("contextType");

-- CreateIndex
CREATE INDEX "TourLead_contextSlug_idx" ON "TourLead"("contextSlug");

-- AddForeignKey
ALTER TABLE "PrayerPointVerseMapping" ADD CONSTRAINT "PrayerPointVerseMapping_prayerPointId_fkey" FOREIGN KEY ("prayerPointId") REFERENCES "PrayerPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrayerPointVerseMapping" ADD CONSTRAINT "PrayerPointVerseMapping_verseId_fkey" FOREIGN KEY ("verseId") REFERENCES "Verse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrayerPointRelation" ADD CONSTRAINT "PrayerPointRelation_prayerPointId_fkey" FOREIGN KEY ("prayerPointId") REFERENCES "PrayerPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;


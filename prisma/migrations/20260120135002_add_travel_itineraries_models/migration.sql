-- CreateTable
CREATE TABLE "TravelItinerary" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "days" INTEGER NOT NULL,
    "region" TEXT NOT NULL,
    "bestSeason" TEXT,
    "whoItsFor" TEXT,
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TravelItinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelItineraryDay" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "places" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "readings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,

    CONSTRAINT "TravelItineraryDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelItineraryFaq" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TravelItineraryFaq_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TravelItinerary_slug_key" ON "TravelItinerary"("slug");

-- CreateIndex
CREATE INDEX "TravelItinerary_status_idx" ON "TravelItinerary"("status");

-- CreateIndex
CREATE INDEX "TravelItinerary_slug_idx" ON "TravelItinerary"("slug");

-- CreateIndex
CREATE INDEX "TravelItineraryDay_itineraryId_idx" ON "TravelItineraryDay"("itineraryId");

-- CreateIndex
CREATE UNIQUE INDEX "TravelItineraryDay_itineraryId_day_key" ON "TravelItineraryDay"("itineraryId", "day");

-- CreateIndex
CREATE INDEX "TravelItineraryFaq_itineraryId_idx" ON "TravelItineraryFaq"("itineraryId");

-- AddForeignKey
ALTER TABLE "TravelItineraryDay" ADD CONSTRAINT "TravelItineraryDay_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "TravelItinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelItineraryFaq" ADD CONSTRAINT "TravelItineraryFaq_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "TravelItinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Book" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "testament" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "chapters" INTEGER NOT NULL,
    "verses" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verse" (
    "id" INTEGER NOT NULL,
    "bookId" INTEGER NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verseNumber" INTEGER NOT NULL,
    "textKjv" TEXT,
    "textWeb" TEXT,
    "textAsv" TEXT,
    "textBbe" TEXT,
    "textYlt" TEXT,
    "textRV" TEXT,
    "textBL" TEXT,
    "wordsCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrongsLexicon" (
    "strongsId" TEXT NOT NULL,
    "originalWord" TEXT NOT NULL,
    "transliteration" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "occurrences" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrongsLexicon_pkey" PRIMARY KEY ("strongsId")
);

-- CreateTable
CREATE TABLE "VerseStrong" (
    "id" TEXT NOT NULL,
    "verseId" INTEGER NOT NULL,
    "strongsId" TEXT NOT NULL,
    "position" INTEGER,

    CONSTRAINT "VerseStrong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Name" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "originLanguage" TEXT NOT NULL,
    "characterDescription" TEXT NOT NULL,
    "firstMentionVerseId" INTEGER,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Name_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NameMention" (
    "id" TEXT NOT NULL,
    "nameId" TEXT NOT NULL,
    "verseId" INTEGER NOT NULL,
    "context" TEXT,

    CONSTRAINT "NameMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NameRelation" (
    "id" TEXT NOT NULL,
    "nameId" TEXT NOT NULL,
    "relatedNameId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,

    CONSTRAINT "NameRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Situation" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metaDescription" TEXT NOT NULL,
    "content" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Situation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SituationVerseMapping" (
    "id" TEXT NOT NULL,
    "situationId" TEXT NOT NULL,
    "verseId" INTEGER NOT NULL,
    "relevanceScore" INTEGER NOT NULL DEFAULT 50,
    "manualNote" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SituationVerseMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SituationRelation" (
    "id" TEXT NOT NULL,
    "situationId" TEXT NOT NULL,
    "relatedSituationId" TEXT NOT NULL,

    CONSTRAINT "SituationRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profession" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionRelation" (
    "id" TEXT NOT NULL,
    "professionId" TEXT NOT NULL,
    "relatedProfessionId" TEXT NOT NULL,

    CONSTRAINT "ProfessionRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "historicalInfo" TEXT,
    "biblicalContext" TEXT,
    "modernName" TEXT,
    "country" TEXT,
    "region" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "tourHighlight" BOOLEAN NOT NULL DEFAULT false,
    "tourPriority" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceVerseMapping" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "verseId" INTEGER NOT NULL,
    "mentionType" TEXT,
    "relevanceScore" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaceVerseMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceRelation" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "relatedPlaceId" TEXT NOT NULL,
    "relationship" TEXT,

    CONSTRAINT "PlaceRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourLead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT,
    "interestedIn" TEXT[],
    "travelDates" TEXT,
    "groupSize" INTEGER,
    "budget" TEXT,
    "sourcePlace" TEXT,
    "sourcePage" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "affiliateId" TEXT,
    "commission" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "contactedAt" TIMESTAMP(3),
    "bookedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersePopularity" (
    "verseId" INTEGER NOT NULL,
    "searchCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VersePopularity_pkey" PRIMARY KEY ("verseId")
);

-- CreateTable
CREATE TABLE "IngestionLog" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "IngestionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Book_name_key" ON "Book"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Book_slug_key" ON "Book"("slug");

-- CreateIndex
CREATE INDEX "Book_testament_idx" ON "Book"("testament");

-- CreateIndex
CREATE INDEX "Book_genre_idx" ON "Book"("genre");

-- CreateIndex
CREATE INDEX "Book_slug_idx" ON "Book"("slug");

-- CreateIndex
CREATE INDEX "Verse_bookId_chapter_idx" ON "Verse"("bookId", "chapter");

-- CreateIndex
CREATE INDEX "Verse_bookId_idx" ON "Verse"("bookId");

-- CreateIndex
CREATE INDEX "Verse_chapter_idx" ON "Verse"("chapter");

-- CreateIndex
CREATE UNIQUE INDEX "Verse_bookId_chapter_verseNumber_key" ON "Verse"("bookId", "chapter", "verseNumber");

-- CreateIndex
CREATE INDEX "StrongsLexicon_language_idx" ON "StrongsLexicon"("language");

-- CreateIndex
CREATE INDEX "StrongsLexicon_occurrences_idx" ON "StrongsLexicon"("occurrences");

-- CreateIndex
CREATE INDEX "VerseStrong_verseId_idx" ON "VerseStrong"("verseId");

-- CreateIndex
CREATE INDEX "VerseStrong_strongsId_idx" ON "VerseStrong"("strongsId");

-- CreateIndex
CREATE UNIQUE INDEX "VerseStrong_verseId_strongsId_position_key" ON "VerseStrong"("verseId", "strongsId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Name_name_key" ON "Name"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Name_slug_key" ON "Name"("slug");

-- CreateIndex
CREATE INDEX "Name_slug_idx" ON "Name"("slug");

-- CreateIndex
CREATE INDEX "Name_name_idx" ON "Name"("name");

-- CreateIndex
CREATE INDEX "Name_originLanguage_idx" ON "Name"("originLanguage");

-- CreateIndex
CREATE INDEX "NameMention_nameId_idx" ON "NameMention"("nameId");

-- CreateIndex
CREATE INDEX "NameMention_verseId_idx" ON "NameMention"("verseId");

-- CreateIndex
CREATE UNIQUE INDEX "NameMention_nameId_verseId_key" ON "NameMention"("nameId", "verseId");

-- CreateIndex
CREATE INDEX "NameRelation_nameId_idx" ON "NameRelation"("nameId");

-- CreateIndex
CREATE UNIQUE INDEX "NameRelation_nameId_relatedNameId_key" ON "NameRelation"("nameId", "relatedNameId");

-- CreateIndex
CREATE UNIQUE INDEX "Situation_slug_key" ON "Situation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Situation_title_key" ON "Situation"("title");

-- CreateIndex
CREATE INDEX "Situation_slug_idx" ON "Situation"("slug");

-- CreateIndex
CREATE INDEX "Situation_title_idx" ON "Situation"("title");

-- CreateIndex
CREATE INDEX "Situation_category_idx" ON "Situation"("category");

-- CreateIndex
CREATE INDEX "SituationVerseMapping_situationId_relevanceScore_idx" ON "SituationVerseMapping"("situationId", "relevanceScore");

-- CreateIndex
CREATE INDEX "SituationVerseMapping_verseId_idx" ON "SituationVerseMapping"("verseId");

-- CreateIndex
CREATE INDEX "SituationVerseMapping_relevanceScore_idx" ON "SituationVerseMapping"("relevanceScore");

-- CreateIndex
CREATE UNIQUE INDEX "SituationVerseMapping_situationId_verseId_key" ON "SituationVerseMapping"("situationId", "verseId");

-- CreateIndex
CREATE INDEX "SituationRelation_situationId_idx" ON "SituationRelation"("situationId");

-- CreateIndex
CREATE UNIQUE INDEX "SituationRelation_situationId_relatedSituationId_key" ON "SituationRelation"("situationId", "relatedSituationId");

-- CreateIndex
CREATE UNIQUE INDEX "Profession_slug_key" ON "Profession"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Profession_title_key" ON "Profession"("title");

-- CreateIndex
CREATE INDEX "Profession_slug_idx" ON "Profession"("slug");

-- CreateIndex
CREATE INDEX "Profession_title_idx" ON "Profession"("title");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionRelation_professionId_relatedProfessionId_key" ON "ProfessionRelation"("professionId", "relatedProfessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Place_slug_key" ON "Place"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Place_name_key" ON "Place"("name");

-- CreateIndex
CREATE INDEX "Place_slug_idx" ON "Place"("slug");

-- CreateIndex
CREATE INDEX "Place_name_idx" ON "Place"("name");

-- CreateIndex
CREATE INDEX "Place_country_idx" ON "Place"("country");

-- CreateIndex
CREATE INDEX "Place_tourHighlight_idx" ON "Place"("tourHighlight");

-- CreateIndex
CREATE INDEX "Place_tourPriority_idx" ON "Place"("tourPriority");

-- CreateIndex
CREATE INDEX "PlaceVerseMapping_placeId_relevanceScore_idx" ON "PlaceVerseMapping"("placeId", "relevanceScore");

-- CreateIndex
CREATE INDEX "PlaceVerseMapping_verseId_idx" ON "PlaceVerseMapping"("verseId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaceVerseMapping_placeId_verseId_key" ON "PlaceVerseMapping"("placeId", "verseId");

-- CreateIndex
CREATE INDEX "PlaceRelation_placeId_idx" ON "PlaceRelation"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaceRelation_placeId_relatedPlaceId_key" ON "PlaceRelation"("placeId", "relatedPlaceId");

-- CreateIndex
CREATE INDEX "TourLead_email_idx" ON "TourLead"("email");

-- CreateIndex
CREATE INDEX "TourLead_status_idx" ON "TourLead"("status");

-- CreateIndex
CREATE INDEX "TourLead_sourcePlace_idx" ON "TourLead"("sourcePlace");

-- CreateIndex
CREATE INDEX "TourLead_createdAt_idx" ON "TourLead"("createdAt");

-- CreateIndex
CREATE INDEX "PageView_slug_idx" ON "PageView"("slug");

-- CreateIndex
CREATE INDEX "PageView_pageType_idx" ON "PageView"("pageType");

-- CreateIndex
CREATE INDEX "PageView_date_idx" ON "PageView"("date");

-- CreateIndex
CREATE UNIQUE INDEX "PageView_slug_pageType_date_key" ON "PageView"("slug", "pageType", "date");

-- CreateIndex
CREATE INDEX "VersePopularity_searchCount_idx" ON "VersePopularity"("searchCount");

-- CreateIndex
CREATE INDEX "VersePopularity_viewCount_idx" ON "VersePopularity"("viewCount");

-- CreateIndex
CREATE INDEX "IngestionLog_source_status_idx" ON "IngestionLog"("source", "status");

-- CreateIndex
CREATE INDEX "IngestionLog_startedAt_idx" ON "IngestionLog"("startedAt");

-- AddForeignKey
ALTER TABLE "Verse" ADD CONSTRAINT "Verse_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerseStrong" ADD CONSTRAINT "VerseStrong_verseId_fkey" FOREIGN KEY ("verseId") REFERENCES "Verse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerseStrong" ADD CONSTRAINT "VerseStrong_strongsId_fkey" FOREIGN KEY ("strongsId") REFERENCES "StrongsLexicon"("strongsId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Name" ADD CONSTRAINT "Name_firstMentionVerseId_fkey" FOREIGN KEY ("firstMentionVerseId") REFERENCES "Verse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NameMention" ADD CONSTRAINT "NameMention_nameId_fkey" FOREIGN KEY ("nameId") REFERENCES "Name"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NameMention" ADD CONSTRAINT "NameMention_verseId_fkey" FOREIGN KEY ("verseId") REFERENCES "Verse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NameRelation" ADD CONSTRAINT "NameRelation_nameId_fkey" FOREIGN KEY ("nameId") REFERENCES "Name"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SituationVerseMapping" ADD CONSTRAINT "SituationVerseMapping_situationId_fkey" FOREIGN KEY ("situationId") REFERENCES "Situation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SituationVerseMapping" ADD CONSTRAINT "SituationVerseMapping_verseId_fkey" FOREIGN KEY ("verseId") REFERENCES "Verse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SituationRelation" ADD CONSTRAINT "SituationRelation_situationId_fkey" FOREIGN KEY ("situationId") REFERENCES "Situation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionRelation" ADD CONSTRAINT "ProfessionRelation_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "Profession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceVerseMapping" ADD CONSTRAINT "PlaceVerseMapping_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceVerseMapping" ADD CONSTRAINT "PlaceVerseMapping_verseId_fkey" FOREIGN KEY ("verseId") REFERENCES "Verse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceRelation" ADD CONSTRAINT "PlaceRelation_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceRelation" ADD CONSTRAINT "PlaceRelation_relatedPlaceId_fkey" FOREIGN KEY ("relatedPlaceId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourLead" ADD CONSTRAINT "TourLead_sourcePlace_fkey" FOREIGN KEY ("sourcePlace") REFERENCES "Place"("slug") ON DELETE SET NULL ON UPDATE CASCADE;


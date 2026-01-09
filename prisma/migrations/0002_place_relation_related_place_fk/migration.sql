-- AddForeignKey
ALTER TABLE "PlaceRelation" ADD CONSTRAINT "PlaceRelation_relatedPlaceId_fkey" FOREIGN KEY ("relatedPlaceId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

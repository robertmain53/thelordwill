-- Make this migration replay-safe.
-- 0001_init already adds PlaceRelation_relatedPlaceId_fkey, so 0002 must be a no-op if it exists.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PlaceRelation_relatedPlaceId_fkey'
  ) THEN
    ALTER TABLE "PlaceRelation"
      ADD CONSTRAINT "PlaceRelation_relatedPlaceId_fkey"
      FOREIGN KEY ("relatedPlaceId") REFERENCES "Place"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

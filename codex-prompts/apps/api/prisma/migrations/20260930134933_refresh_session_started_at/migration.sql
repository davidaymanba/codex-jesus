-- The session start moves onto every token (copied on rotation). Before this, it was derived
-- from the oldest token of the family, which login housekeeping could delete, pushing the
-- 30-day absolute cap forward.
ALTER TABLE "refresh_tokens" ADD COLUMN "sessionStartedAt" TIMESTAMPTZ(3);

UPDATE "refresh_tokens" AS token
SET "sessionStartedAt" = family.started_at
FROM (
  SELECT "familyId", MIN("createdAt") AS started_at
  FROM "refresh_tokens"
  GROUP BY "familyId"
) AS family
WHERE token."familyId" = family."familyId";

ALTER TABLE "refresh_tokens" ALTER COLUMN "sessionStartedAt" SET NOT NULL;

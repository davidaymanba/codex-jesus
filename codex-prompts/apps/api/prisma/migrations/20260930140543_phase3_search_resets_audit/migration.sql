-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- AlterEnum (several values in one migration: fine on PostgreSQL 12+)

ALTER TYPE "AuditAction" ADD VALUE 'EXPORT';
ALTER TYPE "AuditAction" ADD VALUE 'REORDER';
ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_RESET_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_RESET';

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "searchText" TEXT NOT NULL DEFAULT '';

-- Search normalization, one definition for stored text and search terms: lowercase, unify
-- alef/hamza/ta marbuta/alef maqsura forms, drop harakat and tatweel. Arabic users type
-- "الالكترونية" for "الإلكترونيَّة"; Postgres has no Arabic stemmer, trigrams do the rest.
CREATE FUNCTION codex_normalize_search(value text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
AS $$
  SELECT translate(lower(value), 'أإآٱىةؤئ' || chr(1600) || chr(1611) || chr(1612) || chr(1613) || chr(1614) || chr(1615) || chr(1616) || chr(1617) || chr(1618) || chr(1619) || chr(1620) || chr(1621) || chr(1622) || chr(1623) || chr(1624) || chr(1625) || chr(1626) || chr(1627) || chr(1628) || chr(1629) || chr(1630) || chr(1631) || chr(1648), 'اااايهوي')
$$;

CREATE FUNCTION posts_set_search_text() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."searchText" := codex_normalize_search(concat_ws(' ',
    NEW.title->>'ar', NEW.title->>'en', NEW.excerpt->>'ar', NEW.excerpt->>'en'));
  RETURN NEW;
END
$$;

CREATE TRIGGER posts_search_text
BEFORE INSERT OR UPDATE OF title, excerpt, "searchText" ON "posts"
FOR EACH ROW EXECUTE FUNCTION posts_set_search_text();

-- Backfill (fires the trigger).
UPDATE "posts" SET "searchText" = '';

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "usedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "posts_searchText_idx" ON "posts" USING GIN ("searchText" gin_trgm_ops);

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add url to page_views and visit_events (minimal incremental)
ALTER TABLE "public"."page_views" ADD COLUMN IF NOT EXISTS "url" TEXT;
UPDATE "public"."page_views" SET "url" = COALESCE("url", ('https://commoditychina.com' || "path")) WHERE "url" IS NULL;
ALTER TABLE "public"."page_views" ALTER COLUMN "url" SET NOT NULL;

ALTER TABLE "public"."page_views" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "public"."page_views" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "public"."page_views" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
ALTER TABLE "public"."page_views" ADD COLUMN IF NOT EXISTS "referrer" TEXT;
ALTER TABLE "public"."page_views" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "public"."page_views" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "public"."page_views" ALTER COLUMN "views" SET DEFAULT 1;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'page_views_path_date_key') THEN
    ALTER TABLE "public"."page_views" DROP CONSTRAINT "page_views_path_date_key";
  END IF;
END $$;

DROP INDEX IF EXISTS "page_views_url_date_key";
CREATE UNIQUE INDEX "page_views_url_date_key" ON "public"."page_views"("url", "date");

CREATE INDEX IF NOT EXISTS "page_views_path_date_idx" ON "public"."page_views"("path", "date");
CREATE INDEX IF NOT EXISTS "page_views_date_idx" ON "public"."page_views"("date");

ALTER TABLE "public"."visit_events" ADD COLUMN IF NOT EXISTS "url" TEXT;
CREATE INDEX IF NOT EXISTS "visit_events_url_idx" ON "public"."visit_events"("url");

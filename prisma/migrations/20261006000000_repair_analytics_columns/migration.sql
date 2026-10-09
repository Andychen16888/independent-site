-- 修复分析埋点表结构缺失。
--
-- 背景：20261002115757_add_url_to_pageview_and_visitevent 在生产库的
-- _prisma_migrations 里已被标记为「已应用」，但它的 SQL 实际从未执行，
-- 于是 visit_events.url / page_views.url 等字段一直不存在，Prisma 每次写入
-- 都报 P2022（column does not exist），访客数据从 2026-10-02 起全部丢失。
-- 由于原迁移不是 pending，prisma migrate deploy 永远不会重跑它，
-- 必须用一条新的迁移把结构补齐。
--
-- 全部语句都写成幂等形式，重复执行安全。

ALTER TABLE "public"."visit_events" ADD COLUMN IF NOT EXISTS "url" TEXT;
CREATE INDEX IF NOT EXISTS "visit_events_url_idx" ON "public"."visit_events"("url");

ALTER TABLE "public"."page_views" ADD COLUMN IF NOT EXISTS "url" TEXT;
ALTER TABLE "public"."page_views" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "public"."page_views" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "public"."page_views" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
ALTER TABLE "public"."page_views" ADD COLUMN IF NOT EXISTS "referrer" TEXT;
ALTER TABLE "public"."page_views" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "public"."page_views" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "public"."page_views" ALTER COLUMN "views" SET DEFAULT 1;

-- 回填 url：由 path 推导，与旧的 (path, date) 唯一约束一一对应
UPDATE "public"."page_views" SET "url" = COALESCE("url", 'https://commoditychina.com' || "path") WHERE "url" IS NULL;
ALTER TABLE "public"."page_views" ALTER COLUMN "url" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "page_views_path_date_idx" ON "public"."page_views"("path", "date");
CREATE INDEX IF NOT EXISTS "page_views_date_idx" ON "public"."page_views"("date");

-- 旧的 (path, date) 唯一约束与新的 (url, date) 唯一约束二选一
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'page_views_path_date_key') THEN
    ALTER TABLE "public"."page_views" DROP CONSTRAINT "page_views_path_date_key";
  END IF;
END $$;

-- 建唯一约束前先合并可能的重复行（把 views 求和后只保留一行），避免建约束失败
UPDATE "public"."page_views" AS p
SET "views" = agg.total
FROM (
  SELECT MIN("id") AS keep_id, SUM("views") AS total
  FROM "public"."page_views"
  GROUP BY "url", "date"
  HAVING COUNT(*) > 1
) AS agg
WHERE p."id" = agg.keep_id;

DELETE FROM "public"."page_views" AS p
USING "public"."page_views" AS other
WHERE p."id" > other."id" AND p."url" = other."url" AND p."date" = other."date";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'page_views_url_date_key'
      AND conrelid = 'public.page_views'::regclass
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'page_views_url_date_key'
        AND c.relkind = 'i'
        AND n.nspname = 'public'
    ) THEN
      ALTER TABLE "public"."page_views" ADD CONSTRAINT "page_views_url_date_key" UNIQUE USING INDEX "page_views_url_date_key";
    ELSE
      ALTER TABLE "public"."page_views" ADD CONSTRAINT "page_views_url_date_key" UNIQUE ("url", "date");
    END IF;
  END IF;
END $$;

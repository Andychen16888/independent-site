-- 新增 deviceType 列，记录访客使用的是桌面 / 手机 / 平板访问。
-- 写入端（/api/track）优先保存客户端上报的 deviceType（可区分 iPadOS 等 UA 无法识别的平板），
-- 客户端没有支持时由服务器端按 UA 识别兜底。列缺失时写入端与后台读取端都会自动降级，
-- 与已有 url / isBot 列的降级机制保持一致。

ALTER TABLE "public"."visit_events" ADD COLUMN IF NOT EXISTS "deviceType" TEXT;
ALTER TABLE "public"."visitor_sessions" ADD COLUMN IF NOT EXISTS "deviceType" TEXT;

CREATE INDEX IF NOT EXISTS "visit_events_deviceType_idx" ON "public"."visit_events"("deviceType");
CREATE INDEX IF NOT EXISTS "visitor_sessions_deviceType_idx" ON "public"."visitor_sessions"("deviceType");

-- 历史数据回填：按与 src/lib/tracking/device.ts 相同的规则，用已存的 userAgent 推断设备类型。
-- 规则顺序很重要：先把平板识别出来（iPad / 明确声明 tablet / Android 平板 UA 不含 Mobile），
-- 再识别手机（Mobi / iPhone / Android 手机 / Windows Phone / Opera Mini），
-- 其余有 UA 的记录一律视为桌面端；无 UA 保持 NULL。
UPDATE "public"."visit_events"
SET "deviceType" = CASE
  WHEN "userAgent" IS NULL OR "userAgent" = '' THEN NULL
  WHEN "userAgent" ILIKE '%ipad%'
    OR "userAgent" ILIKE '%tablet%'
    OR ("userAgent" ILIKE '%android%' AND "userAgent" NOT ILIKE '%mobile%') THEN 'tablet'
  WHEN "userAgent" ILIKE '%mobi%'
    OR "userAgent" ILIKE '%iphone%'
    OR ("userAgent" ILIKE '%android%' AND "userAgent" ILIKE '%mobile%')
    OR "userAgent" ILIKE '%wp-%'
    OR "userAgent" ILIKE '%opera mini%' THEN 'mobile'
  ELSE 'desktop'
END
WHERE "deviceType" IS NULL;

UPDATE "public"."visitor_sessions"
SET "deviceType" = CASE
  WHEN "userAgent" IS NULL OR "userAgent" = '' THEN NULL
  WHEN "userAgent" ILIKE '%ipad%'
    OR "userAgent" ILIKE '%tablet%'
    OR ("userAgent" ILIKE '%android%' AND "userAgent" NOT ILIKE '%mobile%') THEN 'tablet'
  WHEN "userAgent" ILIKE '%mobi%'
    OR "userAgent" ILIKE '%iphone%'
    OR ("userAgent" ILIKE '%android%' AND "userAgent" ILIKE '%mobile%')
    OR "userAgent" ILIKE '%wp-%'
    OR "userAgent" ILIKE '%opera mini%' THEN 'mobile'
  ELSE 'desktop'
END
WHERE "deviceType" IS NULL;
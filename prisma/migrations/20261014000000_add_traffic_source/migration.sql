-- 访客来源（Traffic source）追踪。
-- 后台「数据分析」新增「访客来源」模块，需要按来源统计访客，并在访客轨迹里显示来源。
-- 写入端（/api/track）在埋点时就按 utm 参数 / Referer 归类好来源并存库，读取端直接聚合。
-- 列缺失时写入端与后台读取端都会自动降级，与 url / isBot / deviceType 的降级机制一致。

ALTER TABLE "public"."visit_events" ADD COLUMN IF NOT EXISTS "source" TEXT;
ALTER TABLE "public"."visit_events" ADD COLUMN IF NOT EXISTS "utmSource" TEXT;
ALTER TABLE "public"."visit_events" ADD COLUMN IF NOT EXISTS "utmMedium" TEXT;
ALTER TABLE "public"."visit_events" ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT;

ALTER TABLE "public"."visitor_sessions" ADD COLUMN IF NOT EXISTS "source" TEXT;
ALTER TABLE "public"."visitor_sessions" ADD COLUMN IF NOT EXISTS "utmSource" TEXT;
ALTER TABLE "public"."visitor_sessions" ADD COLUMN IF NOT EXISTS "utmMedium" TEXT;
ALTER TABLE "public"."visitor_sessions" ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT;

CREATE INDEX IF NOT EXISTS "visit_events_source_createdAt_idx" ON "public"."visit_events"("source", "createdAt");
CREATE INDEX IF NOT EXISTS "visitor_sessions_source_idx" ON "public"."visitor_sessions"("source");

-- 历史数据回填：按与 src/lib/tracking/source.ts 相同的规则，用已存的 referrer 推断来源。
-- 规则顺序很重要：站内 Referer 与空 Referer 记 direct，再按搜索引擎 → 社媒 → 网页邮箱 → 普通外链，
-- 都没有命中的归为 referral。改动 source.ts 的域名列表时应同步更新这里。
UPDATE "public"."visit_events"
SET "source" = CASE
  WHEN "referrer" IS NULL OR "referrer" = '' THEN 'direct'
  WHEN "referrer" ILIKE '%commoditychina.com%' THEN 'direct'
  WHEN "referrer" ILIKE '%google.%' THEN 'google'
  WHEN "referrer" ILIKE '%bing.%' OR "referrer" ILIKE '%msn.%' THEN 'bing'
  WHEN "referrer" ILIKE '%baidu.%' THEN 'baidu'
  WHEN "referrer" ILIKE '%yahoo.%' OR "referrer" ILIKE '%duckduckgo.%' OR "referrer" ILIKE '%yandex.%'
    OR "referrer" ILIKE '%sogou.%' OR "referrer" ILIKE '%naver.%' OR "referrer" ILIKE '%ecosia.%'
    OR "referrer" ILIKE '%qwant.%' OR "referrer" ILIKE '%ask.%' OR "referrer" ILIKE '%brave.%'
    OR "referrer" ILIKE '%startpage.%' OR "referrer" ILIKE '%seznam.%' THEN 'search'
  WHEN "referrer" ILIKE '%facebook.%' OR "referrer" ILIKE '%fb.com%' OR "referrer" ILIKE '%instagram.%'
    OR "referrer" ILIKE '%twitter.%' OR "referrer" ILIKE '%x.com%' OR "referrer" ILIKE '%t.co%'
    OR "referrer" ILIKE '%linkedin.%' OR "referrer" ILIKE '%lnkd.in%' OR "referrer" ILIKE '%pinterest.%'
    OR "referrer" ILIKE '%youtube.%' OR "referrer" ILIKE '%youtu.be%' OR "referrer" ILIKE '%tiktok.%'
    OR "referrer" ILIKE '%reddit.%' OR "referrer" ILIKE '%whatsapp.%' OR "referrer" ILIKE '%wa.me%'
    OR "referrer" ILIKE '%telegram.%' OR "referrer" ILIKE '%t.me%' OR "referrer" ILIKE '%weixin.%'
    OR "referrer" ILIKE '%wechat.%' OR "referrer" ILIKE '%vk.com%' OR "referrer" ILIKE '%snapchat.%'
    OR "referrer" ILIKE '%quora.%' OR "referrer" ILIKE '%tumblr.%' OR "referrer" ILIKE '%medium.%'
    OR "referrer" ILIKE '%line.me%' OR "referrer" ILIKE '%discord.%' OR "referrer" ILIKE '%douyin.%'
    OR "referrer" ILIKE '%xiaohongshu.%' THEN 'social'
  WHEN "referrer" ILIKE '%mail.google.%' OR "referrer" ILIKE '%mail.yahoo.%' OR "referrer" ILIKE '%mail.163.%'
    OR "referrer" ILIKE '%mail.qq.%' OR "referrer" ILIKE '%mail.ru%' OR "referrer" ILIKE '%outlook.%'
    OR "referrer" ILIKE '%hotmail.%' OR "referrer" ILIKE '%live.com%' OR "referrer" ILIKE '%webmail%'
    OR "referrer" ILIKE '%proton%' OR "referrer" ILIKE '%foxmail.%' OR "referrer" ILIKE '%exmail.%'
    OR "referrer" ILIKE '%zoho.%' OR "referrer" ILIKE '%gmx.%' OR "referrer" ILIKE '%aol.%' THEN 'email'
  ELSE 'referral'
END
WHERE "source" IS NULL;

-- 历史回填 visitor_sessions.source：取该访客最早一次已知来源的事件（first-touch），与新写入口径一致。
UPDATE "public"."visitor_sessions" s
SET "source" = e."source"
FROM (
  SELECT DISTINCT ON ("visitorId") "visitorId", "source"
  FROM "public"."visit_events"
  WHERE "source" IS NOT NULL
  ORDER BY "visitorId", "createdAt" ASC
) e
WHERE s."visitorId" = e."visitorId" AND s."source" IS NULL;

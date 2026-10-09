-- 给访客事件加 isBot 标记，后台「数据分析」默认只统计真人访客。
--
-- 背景：Cloudflare 上大部分请求是爬虫（SemrushBot/bingbot/OAI-SearchBot/AhrefsBot…），
-- 它们不执行 JS，本来就进不了 visit_events；但无头爬虫、监控探针和 AI 抓取器会执行
-- JS，被记成「访客」后把真人数据淹没。写入端 /api/track 用 UA 判定并写入 isBot，
-- 这里同时回填历史数据。全部语句幂等，重跑安全。

ALTER TABLE "public"."visit_events" ADD COLUMN IF NOT EXISTS "isBot" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "visit_events_isBot_createdAt_idx" ON "public"."visit_events"("isBot", "createdAt");

-- 历史回填：关键词与 src/lib/tracking/bot.ts 保持同步（写成 SQL 正则）。
-- 空 UA 也视为机器人（真实浏览器必带 UA）。
UPDATE "public"."visit_events"
SET "isBot" = true
WHERE "isBot" = false
  AND (
    "userAgent" IS NULL
    OR "userAgent" = ''
    OR "userAgent" ~* '(bot|crawl|spider|slurp|scrapy|mediapartners|facebookexternalhit|twitterbot|linkedinbot|slackbot|telegrambot|discordbot|whatsapp|skypeuripreview|embedly|quora link preview|pinterest|vkshare|redditbot|google-inspectiontool|storebot-google|googleother|apis-google|adsbot-google|feedfetcher-google|google favicon|google-read-aloud|bingbot|msnbot|duckduckbot|applebot|baiduspider|yandex|sogou|exabot|qwantify|seznambot|petalbot|bytespider|yisouspider|semrush|ahrefs|mj12|dotbot|dataforseo|screaming frog|blexbot|rogerbot|majestic|meltwater|gptbot|chatgpt|oai-searchbot|claude|anthropic|perplexity|ccbot|amazonbot|amzn-searchbot|meta-externalagent|meta-webindexer|imagesift|diffbot|youbot|google-extended|uptimerobot|pingdom|statuscake|datadog|newrelicpinger|betteruptime|site24x7|thousandeyes|gtmetrix|lighthouse|pagespeed|monitor|uptime|kube-probe|elb-healthchecker|googlehc|route53-health|check_http|prometheus|blackbox_exporter|zabbix|headlesschrome|phantomjs|puppeteer|playwright|python|aiohttp|httpx|curl/|wget|go-http-client|java/|okhttp|libwww-perl|apache-httpclient|node-fetch|axios|postmanruntime|insomnia|zgrab|masscan|nmap|censys|expanse|firecrawl|scanner|validator|archive\.org|ia_archiver)'
  );

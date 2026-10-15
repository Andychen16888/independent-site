-- 访客轨迹会话切分：为 visit_events 增加 sessionId（可空，向前兼容；历史行为 NULL）。
--
-- 写入端 /api/track 对普通访客按 30 分钟空闲规则分配 sessionId，后台「访客轨迹」按
-- 会话分组展示，避免一个 365 天有效期的 visitorId 把所有历史访问累积成一条超长轨迹。
--
-- 安全性：只新增可空列，不改写、不删除任何既有数据；DEFAULT 无。回滚只需
--   ALTER TABLE "public"."visit_events" DROP COLUMN IF EXISTS "sessionId";
-- 且不影响任何其他列或既有统计。

ALTER TABLE "public"."visit_events" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;

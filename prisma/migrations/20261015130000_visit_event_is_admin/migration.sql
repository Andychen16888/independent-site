-- 给 visit_events 加 isAdmin 标记：管理员自己的浏览也写一条事件，作为「埋点写入是否还活着」
-- 的心跳信号，但不算进真人访客统计。
--
-- 背景：后台「数据分析」的「访客埋点可能已停止写入」告警看的是「最近一次任意写入」的时间。
-- 此前管理员被完全排除（不写任何行），于是当某个时段只有管理员在用站点、而普通访客又恰好
-- 一段没来时，一次写入都没有，告警就把「本时段没有普通访客」误报成「埋点停止写入」。
-- 现在管理员访问也写入并打 isAdmin=true 标记，读侧统一过滤，真人统计口径完全不变。
--
-- 安全性：只新增 NOT NULL DEFAULT false 的布尔列，既有历史行全部为 false（等价于之前的口径），
-- 不改写、不删除任何数据。回滚只需
--   ALTER TABLE "public"."visit_events" DROP COLUMN IF EXISTS "isAdmin";
-- 且不影响其他列或既有统计。

ALTER TABLE "public"."visit_events" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false;

import { isAdminTrackingEmail } from "./identity"

/**
 * 一次埋点请求的主体分类。
 * - admin   管理员（服务端已验证登录邮箱等于固定管理员邮箱）：只写一条 isAdmin=true 的
 *           「写入心跳」事件，不进任何真人访客聚合。
 * - bot     机器人（UA 命中 bot.ts 规则）：只写一条带 isBot 标记的 visitEvent 供排查，
 *           不计入 visitor_sessions / page_views 聚合，也不出现在后台真人统计里。
 * - visitor 普通访客（含普通登录用户）：正常记录全部统计。
 */
export type TrackingSubject = "admin" | "bot" | "visitor"

/**
 * 归类规则。email 必须是「服务端验证过的会话邮箱」，绝不能是请求体里客户端自报的值。
 * 管理员与机器人是两个独立概念：管理员绝不会被标记成 isBot。
 */
export function classifyTrackingSubject(input: {
  email: string | null | undefined
  isBot: boolean
}): TrackingSubject {
  if (isAdminTrackingEmail(input.email)) return "admin"
  return input.isBot ? "bot" : "visitor"
}

/**
 * visit_events 原始事件：三种主体都写。管理员写的是 isAdmin=true 的「写入心跳」，
 * 读侧（数据分析页）统一过滤掉，不进真人统计——但它保证了「本时段只有管理员在用
 * 站点」时依然有一次落库写入，让「埋点是否停止写入」的判断有真实信号。
 */
export function shouldWriteVisitEvent(subject: TrackingSubject): boolean {
  return subject === "admin" || subject === "bot" || subject === "visitor"
}

/** visitor_sessions / page_views 聚合：只有普通访客写，机器人和管理员都不写。 */
export function shouldWriteVisitorAggregates(subject: TrackingSubject): boolean {
  return subject === "visitor"
}

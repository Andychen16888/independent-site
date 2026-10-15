/**
 * 访问会话（session）分组规则。
 *
 * visitorId 是 365 天的匿名访客标识，用于「访客去重」；sessionId 代表一次连续访问，
 * 用于「访客轨迹」的时间分组。二者必须分开：不能为了切分轨迹而随机化 visitorId，
 * 否则访客去重统计会被破坏。
 *
 * 采用「空闲超时」规则：同一 visitorId 相邻两次事件间隔 >= SESSION_IDLE_MS 视为新会话。
 */
export const SESSION_IDLE_MS = 30 * 60 * 1000

export function shouldStartNewSession(
  lastActivity: Date | number | null | undefined,
  now: Date | number
): boolean {
  if (lastActivity === null || lastActivity === undefined) return true
  const lastMs = lastActivity instanceof Date ? lastActivity.getTime() : lastActivity
  const nowMs = now instanceof Date ? now.getTime() : now
  if (!Number.isFinite(lastMs) || !Number.isFinite(nowMs)) return true
  return nowMs - lastMs >= SESSION_IDLE_MS
}

/**
 * 轨迹分组的稳定键：新数据按 (visitorId, sessionId) 分组；缺 sessionId 的历史数据
 * （迁移前写入）回退成每位访客一条「legacy」组，避免历史行与新的会话混在一起。
 */
export function sessionGroupKey(visitorId: string, sessionId: string | null | undefined): string {
  return sessionId && sessionId.length > 0 ? `s:${visitorId}:${sessionId}` : `legacy:${visitorId}`
}

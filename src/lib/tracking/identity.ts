/**
 * 管理员排除用到的纯身份逻辑。
 *
 * 这里只放「邮箱 -> 是否管理员」的纯函数，方便单测；不引入任何 NextAuth / 请求
 * 依赖。固定管理员邮箱不能出现在前端 bundle、埋点数据、日志或页面 HTML 中，所以
 * 本模块只允许被服务端代码（/api/track、auth 回调）import，绝不能被 "use client"
 * 组件引用。
 */
export const ADMIN_TRACKING_EMAIL = (
  process.env.ADMIN_TRACKING_EMAIL ||
  process.env.SEED_ADMIN_EMAIL ||
  "admin@example.com"
).toLowerCase()

/** 规范化邮箱：去首尾空白 + 统一小写。用于比较，不用于存储/上报。 */
export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase()
}

/**
 * 判断一个（服务端已验证的）邮箱是否就是需要排除的那位管理员。
 * 仅规范化后精确匹配；空值、其他邮箱、其他管理员一律返回 false。
 */
export function isAdminTrackingEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email)
  return normalized.length > 0 && normalized === ADMIN_TRACKING_EMAIL
}

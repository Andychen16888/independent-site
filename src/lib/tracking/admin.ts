import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

/**
 * 服务端「已验证会话邮箱」读取器（仅服务端使用）。
 *
 * 只相信 getToken 校验过签名的 JWT，绝不相信请求体里客户端自报的 email / isAdmin /
 * role。任何异常都返回 null（按普通访客处理），不能因为会话读取失败而阻断埋点 API。
 *
 * 先用会话 Cookie 是否存在做一次廉价短路，避免给绝大多数匿名访客做无谓的 JWT 校验。
 */
const SESSION_COOKIE_NAMES = ["next-auth.session-token", "__Secure-next-auth.session-token"]

export async function getVerifiedSessionEmail(req: NextRequest): Promise<string | null> {
  try {
    if (!SESSION_COOKIE_NAMES.some((name) => req.cookies.has(name))) return null

    // secureCookie 由生产（https + __Secure- 前缀）与本地（http）两种部署决定，和
    // lib/auth/admin-guard.ts 的既有做法保持一致。
    let token = await getToken({ req, secureCookie: false })
    if (!token) token = await getToken({ req, secureCookie: true })

    return typeof token?.email === "string" ? token.email : null
  } catch {
    return null
  }
}

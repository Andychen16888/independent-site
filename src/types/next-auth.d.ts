import "next-auth"
import { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface User {
    role?: UserRole
  }

  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role?: UserRole
      /** 服务端验证为需排除 Analytics 的管理员时为 true（仅布尔标记，不暴露邮箱）。 */
      analyticsExcluded?: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: UserRole
  }
}

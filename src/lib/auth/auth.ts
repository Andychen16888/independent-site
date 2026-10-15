import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db/prisma"
import { getRequestMeta } from "@/lib/auth/request-context"
import { countryFromIp } from "@/lib/tracking/geo"
import { isAdminTrackingEmail } from "@/lib/tracking/identity"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
  },
  pages: {
    signIn: "/auth/signin",
    newUser: "/account",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.passwordHash) return null

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          image: user.avatar,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        // 仅对「服务端验证过的固定管理员邮箱」置灰前端埋点（前端据此跳过上报）。
        // 服务端 /api/track 仍会独立用 getToken 复核，前端只用于减少无用上报；
        // 这里只是布尔标记，不向客户端暴露邮箱本身。
        session.user.analyticsExcluded = isAdminTrackingEmail(
          typeof token.email === "string" ? token.email : null
        )
      }
      return session
    },
  },
  events: {
    async signIn({ user, account }) {
      const meta = getRequestMeta()
      const ip = meta?.ip ?? null
      const country = countryFromIp(ip)
      await prisma.loginRecord
        .create({
          data: {
            userId: user?.id ?? null,
            email: user?.email ?? "",
            provider: account?.provider ?? "unknown",
            success: true,
            ip,
            country,
            userAgent: meta?.userAgent ? meta.userAgent.slice(0, 300) : null,
          },
        })
        .catch(() => {})
    },
  },
}

import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { prisma } from "@/lib/db/prisma"

export async function getServerAuthSession() {
  return getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getServerAuthSession()
  if (!session?.user?.email) return null

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) return null

  const { passwordHash: _, ...safeUser } = user
  return safeUser
}

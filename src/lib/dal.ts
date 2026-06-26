import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from './session'
import { prisma } from './prisma'

export const verifySession = cache(async () => {
  const session = await getSession()
  if (!session?.userId) redirect('/login')
  return session
})

const ADMIN_ROLES = ['ADMIN', 'MODERATOR', 'SUPER_ADMIN']

export const verifyAdmin = cache(async () => {
  const session = await verifySession()
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  })
  if (!user || !ADMIN_ROLES.includes(user.role)) redirect('/home')
  return { ...session, role: user.role }
})

export const verifySuperAdmin = cache(async () => {
  const session = await verifySession()
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  })
  if (!user || user.role !== 'SUPER_ADMIN') redirect('/home')
  return { ...session, role: user.role }
})

export const getCurrentUser = cache(async () => {
  const session = await getSession()
  if (!session?.userId) return null

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      image: true,
      bio: true,
      role: true,
      banned: true,
      banReason: true,
      elo: true,
      level: true,
      xp: true,
      winStreak: true,
      maxWinStreak: true,
      fightsWon: true,
      fightsLost: true,
      totalGained: true,
      totalLost: true,
      bestRank: true,
      worstRank: true,
      createdAt: true,
      _count: {
        select: {
          notifications: { where: { read: false } },
        },
      },
    },
  })
})

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>

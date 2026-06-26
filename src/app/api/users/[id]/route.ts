import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  await verifySession()
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      displayName: true,
      image: true,
      bio: true,
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
      badges: {
        include: { badge: true },
        orderBy: { earnedAt: 'desc' },
      },
      achievements: {
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
      },
      history: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          type: true,
          delta: true,
          eloAfter: true,
          reason: true,
          createdAt: true,
        },
      },
    },
  })

  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  // Compute rank among all non-admin users
  const rank = await prisma.user.count({
    where: { elo: { gt: user.elo }, isSystem: false },
  })

  return NextResponse.json({ ...user, rank: rank + 1 })
}

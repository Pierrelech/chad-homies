import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'

export async function GET() {
  await verifySession()

  const users = await prisma.user.findMany({
    where: { isSystem: false },
    orderBy: { elo: 'desc' },
    select: {
      id: true,
      username: true,
      displayName: true,
      image: true,
      elo: true,
      level: true,
      winStreak: true,
      fightsWon: true,
      fightsLost: true,
      totalGained: true,
      totalLost: true,
      bestRank: true,
    },
  })

  const ranked = users.map((u, i) => ({ ...u, rank: i + 1 }))
  return NextResponse.json(ranked)
}

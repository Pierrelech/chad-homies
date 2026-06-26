import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'

export async function GET() {
  const session = await verifySession()

  const fight = await prisma.fight.findFirst({
    where: { status: { in: ['ACTIVE', 'PENDING'] } },
    orderBy: { date: 'desc' },
    include: {
      teams: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  image: true,
                  elo: true,
                },
              },
            },
          },
        },
      },
      votes: {
        where: { userId: session.userId },
        select: { team: true },
      },
    },
  })

  if (!fight) return NextResponse.json(null)

  const userVote = fight.votes[0]?.team ?? null

  const votesByTeam = await prisma.fightVote.groupBy({
    by: ['team'],
    where: { fightId: fight.id },
    _count: true,
  })

  const totalVotes = votesByTeam.reduce((s, v) => s + v._count, 0)

  const teamsWithVotes = fight.teams.map((t) => ({
    ...t,
    voteCount: votesByTeam.find((v) => v.team === t.team)?._count ?? 0,
  }))

  return NextResponse.json({ ...fight, teams: teamsWithVotes, totalVotes, userVote, votes: undefined })
}

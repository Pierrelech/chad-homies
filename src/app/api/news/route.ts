import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'

export async function GET(req: Request) {
  const session = await verifySession()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? undefined
  const take = Math.min(parseInt(searchParams.get('take') ?? '10'), 50)
  const skip = parseInt(searchParams.get('skip') ?? '0')

  const where = status ? { status: status as never } : {}

  const [news, total] = await prisma.$transaction([
    prisma.news.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: {
        participants: {
          select: { userId: true, deltaPlanned: true, deltaFinal: true },
        },
        votes: {
          where: { userId: session.userId },
          select: { isPositive: true },
        },
        _count: { select: { votes: true } },
      },
    }),
    prisma.news.count({ where }),
  ])

  const items = news.map((n) => ({
    ...n,
    userVote: n.votes[0] ? (n.votes[0].isPositive ? 1 : -1) : null,
    votes: undefined,
  }))

  return NextResponse.json({ items, total })
}

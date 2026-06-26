import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const voteSchema = z.object({ isPositive: z.boolean() })

export async function POST(req: Request, { params }: Params) {
  const session = await verifySession()
  const { id: newsId } = await params

  const body = await req.json().catch(() => null)
  const parsed = voteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const news = await prisma.news.findUnique({ where: { id: newsId } })
  if (!news || news.status !== 'VOTING') {
    return NextResponse.json({ error: 'Vote non disponible' }, { status: 400 })
  }

  await prisma.newsVote.upsert({
    where: { newsId_userId: { newsId, userId: session.userId } },
    create: { newsId, userId: session.userId, isPositive: parsed.data.isPositive },
    update: { isPositive: parsed.data.isPositive },
  })

  const [positives, total] = await prisma.$transaction([
    prisma.newsVote.count({ where: { newsId, isPositive: true } }),
    prisma.newsVote.count({ where: { newsId } }),
  ])

  return NextResponse.json({ ok: true, positives, total, negatives: total - positives })
}

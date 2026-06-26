import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const voteSchema = z.object({ team: z.enum(['A', 'B']) })

export async function POST(req: Request, { params }: Params) {
  const session = await verifySession()
  const { id: fightId } = await params

  const body = await req.json().catch(() => null)
  const parsed = voteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const fight = await prisma.fight.findUnique({ where: { id: fightId } })
  if (!fight || fight.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Combat non disponible au vote' }, { status: 400 })
  }

  await prisma.fightVote.upsert({
    where: { fightId_userId: { fightId, userId: session.userId } },
    create: { fightId, userId: session.userId, team: parsed.data.team },
    update: { team: parsed.data.team },
  })

  return NextResponse.json({ ok: true })
}

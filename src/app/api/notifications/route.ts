import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'

export async function GET() {
  const session = await verifySession()

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  return NextResponse.json(notifications)
}

export async function PATCH() {
  const session = await verifySession()

  await prisma.notification.updateMany({
    where: { userId: session.userId, read: false },
    data: { read: true },
  })

  return NextResponse.json({ ok: true })
}

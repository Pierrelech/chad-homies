import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/dal'
import { scheduleDailyFight } from '@/lib/daily-fight'

export async function POST() {
  await verifyAdmin()
  await scheduleDailyFight()
  return NextResponse.json({ ok: true })
}

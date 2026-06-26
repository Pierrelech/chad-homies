import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'
import Link from 'next/link'
import { Plus, Sword } from 'lucide-react'
import { AdminFightActions } from '@/components/admin/AdminFightActions'
import { TriggerDailyFight } from '@/components/admin/TriggerDailyFight'

export const metadata = { title: 'Admin — Combats' }

export default async function AdminFightsPage() {
  await verifyAdmin()

  const fights = await prisma.fight.findMany({
    orderBy: { date: 'desc' },
    take: 20,
    include: {
      teams: {
        include: {
          members: { include: { user: { select: { displayName: true } } } },
        },
      },
      _count: { select: { votes: true } },
    },
  })

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    PENDING:  { label: 'À venir',       color: 'text-warning bg-warning/10' },
    ACTIVE:   { label: 'Vote en cours', color: 'text-success bg-success/10' },
    CLOSED:   { label: 'Clôturé',       color: 'text-white/40 bg-white/5' },
    RESOLVED: { label: 'Résolu',        color: 'text-primary-400 bg-primary-400/10' },
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-white">Combats</h1>
        <div className="flex gap-2">
          <TriggerDailyFight />
          <Link
            href="/admin/fights/new"
            className="flex items-center gap-2 rounded-xl bg-surface-700 px-4 py-2 text-sm font-medium text-white/60 hover:bg-surface-600"
          >
            <Plus size={15} /> Manuel
          </Link>
        </div>
      </div>

      {fights.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-surface-900 p-12 text-center text-white/30">
          Aucun combat.
        </div>
      ) : (
        <div className="space-y-3">
          {fights.map((fight) => {
            const st = STATUS_LABELS[fight.status] ?? STATUS_LABELS.CLOSED
            const teamA = fight.teams.find((t) => t.team === 'A')
            const teamB = fight.teams.find((t) => t.team === 'B')

            return (
              <div key={fight.id} className="rounded-2xl border border-white/5 bg-surface-900 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${st.color}`}>
                        {st.label}
                      </span>
                      <span className="text-xs text-white/30">
                        {new Date(fight.date).toLocaleDateString('fr-FR', {
                          weekday: 'short', day: 'numeric', month: 'short',
                        })}
                      </span>
                      <span className="text-xs text-white/25">{fight._count.votes} votes</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-white/60">
                        {teamA?.members.map((m) => m.user.displayName).join(', ') ?? '?'}
                      </span>
                      <Sword size={12} className="shrink-0 text-white/20" />
                      <span className="text-white/60">
                        {teamB?.members.map((m) => m.user.displayName).join(', ') ?? '?'}
                      </span>
                    </div>
                    {fight.status === 'RESOLVED' && (
                      <p className="mt-1 text-xs text-white/30">
                        {fight.teamAVotes}v — {fight.teamBVotes}v
                      </p>
                    )}
                  </div>
                  <AdminFightActions fightId={fight.id} status={fight.status} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/dal'
import Link from 'next/link'
import { Sword, Shield, Trophy } from 'lucide-react'

export const metadata = { title: 'Combats' }

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:  { label: 'À venir',       color: 'text-warning bg-warning/10' },
  ACTIVE:   { label: 'Vote en cours', color: 'text-success bg-success/10' },
  CLOSED:   { label: 'Clôturé',       color: 'text-white/40 bg-white/5' },
  RESOLVED: { label: 'Résolu',        color: 'text-primary-400 bg-primary-400/10' },
}

export default async function FightsPage() {
  const [currentUser, fights] = await Promise.all([
    getCurrentUser(),
    prisma.fight.findMany({
      orderBy: { date: 'desc' },
      include: {
        teams: {
          include: {
            members: {
              include: {
                user: { select: { id: true, displayName: true, image: true, elo: true } },
              },
            },
          },
        },
        _count: { select: { votes: true } },
      },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sword className="text-primary-400" size={24} />
        <h1 className="text-2xl font-black text-white">Combats</h1>
      </div>

      {fights.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-surface-900 p-12 text-center text-white/30">
          Aucun combat enregistré.
        </div>
      ) : (
        <div className="space-y-4">
          {fights.map((fight) => {
            const st = STATUS_LABELS[fight.status] ?? STATUS_LABELS.CLOSED
            const [teamA, teamB] = fight.teams
            const isResolved = fight.status === 'RESOLVED'
            const aWon = isResolved && fight.teamAVotes > fight.teamBVotes
            const bWon = isResolved && fight.teamBVotes > fight.teamAVotes

            return (
              <Link
                key={fight.id}
                href={`/fights/${fight.id}`}
                className="block rounded-2xl border border-white/5 bg-surface-900 p-5 transition-colors hover:bg-surface-800"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${st.color}`}>
                      {st.label}
                    </span>
                    <span className="text-xs text-white/30">
                      {new Date(fight.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </span>
                  </div>
                  <span className="text-xs text-white/30">{fight._count.votes} votes</span>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                  {/* Équipe A */}
                  <TeamPreview
                    team={teamA}
                    won={aWon}
                    votes={fight.teamAVotes}
                    isResolved={isResolved}
                    currentUserId={currentUser?.id}
                  />

                  {/* VS */}
                  <div className="flex flex-col items-center">
                    <Sword size={18} className="text-white/20" />
                    {isResolved && (
                      <span className="mt-1 text-xs font-bold text-white/30">
                        {fight.teamAVotes} - {fight.teamBVotes}
                      </span>
                    )}
                  </div>

                  {/* Équipe B */}
                  <TeamPreview
                    team={teamB}
                    won={bWon}
                    votes={fight.teamBVotes}
                    isResolved={isResolved}
                    currentUserId={currentUser?.id}
                    alignRight
                  />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

type TeamMember = {
  user: { id: string; displayName: string; image: string | null; elo: number }
}
type TeamData = { id: string; team: string; members: TeamMember[] } | undefined

function TeamPreview({
  team,
  won,
  votes,
  isResolved,
  currentUserId,
  alignRight,
}: {
  team: TeamData
  won: boolean
  votes: number
  isResolved: boolean
  currentUserId?: string
  alignRight?: boolean
}) {
  if (!team) return <div />
  const hasMe = team.members.some((m) => m.user.id === currentUserId)

  return (
    <div className={`flex flex-col gap-2 ${alignRight ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-center gap-1.5 ${alignRight ? 'flex-row-reverse' : ''}`}>
        {won && <Trophy size={13} className="text-primary-400" />}
        <span className="text-xs font-semibold text-white/50">
          Équipe {team.team}
          {hasMe && <span className="ml-1 text-primary-400">★</span>}
        </span>
        {isResolved && (
          <span className={`text-xs font-bold ${won ? 'text-success' : 'text-danger'}`}>
            {votes}v
          </span>
        )}
      </div>
      <div className={`flex flex-wrap gap-1.5 ${alignRight ? 'justify-end' : ''}`}>
        {team.members.map(({ user }) => (
          <div
            key={user.id}
            className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs ${
              user.id === currentUserId
                ? 'border-primary-500/40 bg-primary-500/10 text-primary-300'
                : 'border-white/5 bg-surface-800 text-white/60'
            }`}
          >
            {user.image ? (
              <img src={user.image} alt="" className="h-4 w-4 rounded-full object-cover" />
            ) : (
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-surface-700 text-[8px] font-bold text-white/50">
                {user.displayName[0]}
              </div>
            )}
            {user.displayName}
          </div>
        ))}
      </div>
    </div>
  )
}

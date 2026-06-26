import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/dal'
import Link from 'next/link'
import { ArrowLeft, Sword, Trophy, Users } from 'lucide-react'
import { FightVotePanel } from '@/components/fights/FightVotePanel'

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params) {
  const { id } = await params
  const fight = await prisma.fight.findUnique({
    where: { id },
    select: { date: true },
  })
  if (!fight) return { title: 'Combat introuvable' }
  return {
    title: `Combat du ${new Date(fight.date).toLocaleDateString('fr-FR')}`,
  }
}

export default async function FightDetailPage({ params }: Params) {
  const { id } = await params
  const [currentUser, fight] = await Promise.all([
    getCurrentUser(),
    prisma.fight.findUnique({
      where: { id },
      include: {
        teams: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    displayName: true,
                    username: true,
                    image: true,
                    elo: true,
                    winStreak: true,
                  },
                },
              },
            },
          },
        },
        votes: true,
        history: {
          include: { user: { select: { displayName: true, username: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
  ])

  if (!fight) notFound()

  const totalVotes = fight.votes.length
  const userVote = fight.votes.find((v) => v.userId === currentUser?.id)

  const teamA = fight.teams.find((t) => t.team === 'A')
  const teamB = fight.teams.find((t) => t.team === 'B')

  const isResolved = fight.status === 'RESOLVED'
  const aWon = isResolved && fight.teamAVotes > fight.teamBVotes
  const bWon = isResolved && fight.teamBVotes > fight.teamAVotes
  const tied  = isResolved && fight.teamAVotes === fight.teamBVotes

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    PENDING:  { label: 'À venir',       color: 'text-warning bg-warning/10 border-warning/20' },
    ACTIVE:   { label: 'Vote en cours', color: 'text-success bg-success/10 border-success/20' },
    CLOSED:   { label: 'Clôturé',       color: 'text-white/40 bg-white/5 border-white/10' },
    RESOLVED: { label: 'Résolu',        color: 'text-primary-400 bg-primary-400/10 border-primary-400/20' },
  }
  const st = STATUS_LABELS[fight.status] ?? STATUS_LABELS.CLOSED

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/fights" className="flex items-center gap-2 text-sm text-white/40 hover:text-white">
        <ArrowLeft size={15} /> Tous les combats
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-white/5 bg-surface-900 p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${st.color}`}>
            {st.label}
          </span>
          <span className="text-xs text-white/30">
            {new Date(fight.date).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          {totalVotes > 0 && (
            <span className="ml-auto text-xs text-white/30">{totalVotes} votes</span>
          )}
        </div>

        {/* VS layout */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-6">
          <FightTeamCard
            team={teamA}
            letter="A"
            won={aWon}
            votes={fight.teamAVotes}
            totalVotes={totalVotes}
            isResolved={isResolved}
            currentUserId={currentUser?.id}
          />

          <div className="flex flex-col items-center pt-4">
            <Sword size={28} className="text-white/10" />
            {isResolved && (
              <div className="mt-2 text-center">
                {tied ? (
                  <span className="text-sm font-bold text-white/40">Égalité</span>
                ) : (
                  <span className="text-sm font-bold text-primary-400">
                    {fight.teamAVotes} — {fight.teamBVotes}
                  </span>
                )}
              </div>
            )}
          </div>

          <FightTeamCard
            team={teamB}
            letter="B"
            won={bWon}
            votes={fight.teamBVotes}
            totalVotes={totalVotes}
            isResolved={isResolved}
            currentUserId={currentUser?.id}
          />
        </div>
      </div>

      {/* Vote panel (client) */}
      {fight.status === 'ACTIVE' && currentUser && (
        <FightVotePanel
          fightId={fight.id}
          teamA={teamA ? { id: teamA.id, team: teamA.team } : null}
          teamB={teamB ? { id: teamB.id, team: teamB.team } : null}
          initialVote={userVote?.team ?? null}
        />
      )}

      {/* Point history */}
      {fight.history.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-surface-900 p-5">
          <h2 className="mb-4 font-semibold text-white">Aura redistribuée</h2>
          <div className="space-y-2">
            {fight.history.map((h) => (
              <div key={h.id} className="flex items-center justify-between text-sm">
                <Link
                  href={`/profile/${h.user.username}`}
                  className="text-white/70 hover:text-white"
                >
                  {h.user.displayName}
                </Link>
                <span className={h.delta >= 0 ? 'font-bold text-success' : 'font-bold text-danger'}>
                  {h.delta >= 0 ? '+' : ''}{h.delta} aura → {h.eloAfter} ELO
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

type TeamMember = {
  user: {
    id: string
    displayName: string
    username: string
    image: string | null
    elo: number
    winStreak: number
  }
}
type TeamData = { id: string; team: string; members: TeamMember[] } | undefined

function FightTeamCard({
  team,
  letter,
  won,
  votes,
  totalVotes,
  isResolved,
  currentUserId,
}: {
  team: TeamData
  letter: string
  won: boolean
  votes: number
  totalVotes: number
  isResolved: boolean
  currentUserId?: string
}) {
  const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0

  return (
    <div className={`rounded-xl border p-3 ${won ? 'border-success/30 bg-success/5' : 'border-white/5'}`}>
      <div className="mb-3 flex items-center gap-2">
        {won && <Trophy size={13} className="text-primary-400" />}
        <span className="text-xs font-bold text-white/50">Équipe {letter}</span>
        {isResolved && (
          <span className={`ml-auto text-xs font-bold ${won ? 'text-success' : 'text-danger'}`}>
            {votes}v ({pct}%)
          </span>
        )}
      </div>

      {team ? (
        <div className="space-y-2">
          {team.members.map(({ user }) => {
            const isMe = user.id === currentUserId
            return (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className={`flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-white/5 ${isMe ? 'bg-primary-500/5' : ''}`}
              >
                {user.image ? (
                  <img src={user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-700 text-xs font-bold text-white/60">
                    {user.displayName[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-white">
                    {user.displayName}
                    {isMe && <span className="ml-1 text-primary-400">★</span>}
                  </p>
                  <p className="text-[10px] text-white/30">{user.elo} ELO</p>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-white/20">Équipe non définie</p>
      )}
    </div>
  )
}

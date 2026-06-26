'use client'

import { useState } from 'react'
import { Sword, Users } from 'lucide-react'

type Member = {
  user: { id: string; username: string; displayName: string; image: string | null; elo: number }
}
type Team = { id: string; team: string; members: Member[]; voteCount?: number }
type Fight = {
  id: string
  status: string
  date: string | Date
  teams: Team[]
  userVote?: string | null
  totalVotes?: number
}

export function FightCard({
  fight,
  currentUserId,
}: {
  fight: Fight
  currentUserId?: string
}) {
  const [votedTeam, setVotedTeam] = useState<string | null>(fight.userVote ?? null)
  const [voting, setVoting] = useState(false)

  const canVote = fight.status === 'ACTIVE' && !votedTeam

  async function vote(teamLetter: string) {
    if (voting || votedTeam) return
    setVoting(true)
    try {
      await fetch(`/api/fights/${fight.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: teamLetter }),
      })
      setVotedTeam(teamLetter)
    } finally {
      setVoting(false)
    }
  }

  const teamLabels: Record<string, string> = { A: 'Équipe A', B: 'Équipe B' }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-surface-900">
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <Sword size={14} className="text-primary-400" />
        <span className="text-sm font-semibold text-white">
          {fight.status === 'ACTIVE' ? 'Vote en cours !' : 'Combat à venir'}
        </span>
        {fight.totalVotes != null && fight.totalVotes > 0 && (
          <span className="text-xs text-white/30">{fight.totalVotes} votes</span>
        )}
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
            fight.status === 'ACTIVE'
              ? 'bg-success/10 text-success'
              : 'bg-warning/10 text-warning'
          }`}
        >
          {fight.status === 'ACTIVE' ? 'ACTIF' : 'BIENTÔT'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-white/5">
        {fight.teams.map((t) => {
          const isVoted = votedTeam === t.team
          const label = teamLabels[t.team] ?? `Équipe ${t.team}`
          return (
            <div
              key={t.id}
              className={`bg-surface-900 p-4 ${isVoted ? 'ring-inset ring-1 ring-primary-500' : ''}`}
            >
              <div className="mb-3 flex items-center gap-2">
                <Users size={13} className="text-white/40" />
                <span className="text-xs font-medium text-white/60">{label}</span>
                {t.voteCount != null && t.voteCount > 0 && (
                  <span className="ml-auto text-xs font-bold text-primary-400">
                    {t.voteCount} vote{t.voteCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {t.members.map(({ user }) => (
                  <div key={user.id} className="flex items-center gap-2">
                    {user.image ? (
                      <img src={user.image} alt="" className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-700 text-xs font-bold text-white/50">
                        {user.displayName[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-white">{user.displayName}</p>
                      <p className="text-[10px] text-white/30">{user.elo} ELO</p>
                    </div>
                    {user.id === currentUserId && (
                      <span className="rounded bg-primary-500/20 px-1 text-[10px] font-bold text-primary-400">
                        Toi
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {canVote && (
                <button
                  onClick={() => vote(t.team)}
                  disabled={voting}
                  className="mt-4 w-full rounded-xl bg-primary-500/10 py-2 text-xs font-bold text-primary-400 transition-colors hover:bg-primary-500/20 disabled:opacity-50"
                >
                  Voter pour cette équipe
                </button>
              )}

              {isVoted && (
                <div className="mt-4 w-full rounded-xl bg-success/10 py-2 text-center text-xs font-bold text-success">
                  ✓ Ton vote
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

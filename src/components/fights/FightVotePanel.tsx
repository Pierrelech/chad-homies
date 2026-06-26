'use client'

import { useState } from 'react'
import { Sword } from 'lucide-react'

type TeamRef = { id: string; team: string } | null

export function FightVotePanel({
  fightId,
  teamA,
  teamB,
  initialVote,
}: {
  fightId: string
  teamA: TeamRef
  teamB: TeamRef
  initialVote: string | null
}) {
  const [voted, setVoted] = useState<string | null>(initialVote)
  const [loading, setLoading] = useState(false)

  async function castVote(teamLetter: string) {
    if (loading || voted) return
    setLoading(true)
    try {
      const res = await fetch(`/api/fights/${fightId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team: teamLetter }),
      })
      if (res.ok) setVoted(teamLetter)
    } finally {
      setLoading(false)
    }
  }

  if (voted) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/5 p-5 text-center">
        <p className="font-semibold text-success">
          ✓ Tu as voté pour l&apos;Équipe {voted}
        </p>
        <p className="mt-1 text-xs text-white/40">
          Les résultats seront visibles à la clôture du vote.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-surface-900 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sword size={16} className="text-primary-400" />
        <h2 className="font-semibold text-white">Voter</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[teamA, teamB].map((t) => {
          if (!t) return null
          return (
            <button
              key={t.team}
              onClick={() => castVote(t.team)}
              disabled={loading}
              className="rounded-xl border border-white/10 py-4 text-sm font-bold text-white/60 transition-colors hover:border-primary-500/50 hover:bg-primary-500/10 hover:text-primary-400 disabled:opacity-50"
            >
              Équipe {t.team}
            </button>
          )
        })}
      </div>
    </div>
  )
}

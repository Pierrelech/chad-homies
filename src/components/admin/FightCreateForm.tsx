'use client'

import { useState, useTransition } from 'react'
import { createFightAction } from '@/app/actions/admin'
import { Button } from '@/components/ui/Button'
import { Shuffle } from 'lucide-react'

type User = { id: string; displayName: string; username: string; elo: number }

export function FightCreateForm({ users }: { users: User[] }) {
  const [pending, startTransition] = useTransition()
  const [teamA, setTeamA] = useState<string[]>([])
  const [teamB, setTeamB] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  function toggleUser(userId: string, team: 'A' | 'B') {
    const inA = teamA.includes(userId)
    const inB = teamB.includes(userId)

    if (team === 'A') {
      if (inA) {
        setTeamA((t) => t.filter((id) => id !== userId))
      } else {
        setTeamB((t) => t.filter((id) => id !== userId))
        setTeamA((t) => [...t, userId])
      }
    } else {
      if (inB) {
        setTeamB((t) => t.filter((id) => id !== userId))
      } else {
        setTeamA((t) => t.filter((id) => id !== userId))
        setTeamB((t) => [...t, userId])
      }
    }
  }

  function randomize() {
    const shuffled = [...users].sort(() => Math.random() - 0.5)
    const half = Math.floor(shuffled.length / 2)
    setTeamA(shuffled.slice(0, half).map((u) => u.id))
    setTeamB(shuffled.slice(half, half * 2).map((u) => u.id))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('teamA', JSON.stringify(teamA))
    fd.set('teamB', JSON.stringify(teamB))
    startTransition(async () => {
      const res = await createFightAction(fd)
      if (res?.errors) setErrors(res.errors as Record<string, string[]>)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-white/5 bg-surface-900 p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-white/70">Date du combat</label>
          <input
            type="date"
            name="date"
            defaultValue={new Date().toISOString().split('T')[0]}
            className="rounded-xl border border-white/10 bg-surface-800 px-4 py-2.5 text-sm text-white"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-white/70">Mode de redistribution</label>
          <select
            name="redistributionMode"
            className="rounded-xl border border-white/10 bg-surface-800 px-4 py-2.5 text-sm text-white"
          >
            <option value="EQUAL">Égal (même gain pour tous les gagnants)</option>
            <option value="WEIGHTED">Pondéré (selon ELO)</option>
            <option value="RANDOM">Aléatoire</option>
          </select>
        </div>
      </div>

      {/* Team builder */}
      <div className="rounded-2xl border border-white/5 bg-surface-900 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">Composition des équipes</h2>
          <button
            type="button"
            onClick={randomize}
            className="flex items-center gap-1.5 rounded-lg bg-surface-700 px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-surface-600"
          >
            <Shuffle size={13} /> Aléatoire
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <p className="mb-2 text-xs font-bold text-success">Équipe A ({teamA.length})</p>
            <div className="min-h-12 rounded-xl border border-success/20 bg-success/5 p-2 text-xs text-white/50">
              {teamA.length === 0
                ? 'Aucun joueur'
                : users.filter((u) => teamA.includes(u.id)).map((u) => u.displayName).join(', ')}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-danger">Équipe B ({teamB.length})</p>
            <div className="min-h-12 rounded-xl border border-danger/20 bg-danger/5 p-2 text-xs text-white/50">
              {teamB.length === 0
                ? 'Aucun joueur'
                : users.filter((u) => teamB.includes(u.id)).map((u) => u.displayName).join(', ')}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {users.map((u) => {
            const inA = teamA.includes(u.id)
            const inB = teamB.includes(u.id)
            return (
              <div key={u.id} className="flex items-center gap-3 rounded-xl border border-white/5 p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{u.displayName}</p>
                  <p className="text-xs text-white/30">{u.elo} ELO</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleUser(u.id, 'A')}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                      inA
                        ? 'bg-success/20 text-success'
                        : 'bg-surface-700 text-white/40 hover:text-success'
                    }`}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleUser(u.id, 'B')}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                      inB
                        ? 'bg-danger/20 text-danger'
                        : 'bg-surface-700 text-white/40 hover:text-danger'
                    }`}
                  >
                    B
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        {errors.teamA && <p className="mt-2 text-xs text-danger">{errors.teamA[0]}</p>}
      </div>

      <Button type="submit" loading={pending} size="lg" className="w-full">
        Créer le combat et notifier les joueurs
      </Button>
    </form>
  )
}

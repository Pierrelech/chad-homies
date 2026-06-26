'use client'

import { useState, useTransition } from 'react'
import { adjustEloAction } from '@/app/actions/admin'
import { Check } from 'lucide-react'

export function AdjustEloForm({ userId, currentElo }: { userId: string; currentElo: number }) {
  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState('')
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('userId', userId)
    fd.set('delta', delta)
    fd.set('reason', reason || 'Ajustement manuel admin')
    startTransition(async () => {
      await adjustEloAction(fd)
      setDone(true)
      setOpen(false)
      setDelta('')
      setReason('')
      setTimeout(() => setDone(false), 2000)
    })
  }

  if (done) {
    return (
      <span className="flex items-center justify-end gap-1 text-xs text-success">
        <Check size={12} /> Appliqué
      </span>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-surface-700 px-2.5 py-1 text-xs font-medium text-white/50 hover:bg-surface-600"
      >
        ±ELO
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-1.5 justify-end">
      <input
        type="number"
        value={delta}
        onChange={(e) => setDelta(e.target.value)}
        placeholder="±aura"
        className="w-16 rounded-lg border border-white/10 bg-surface-800 px-2 py-1 text-xs text-white"
        autoFocus
      />
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Raison..."
        className="w-28 rounded-lg border border-white/10 bg-surface-800 px-2 py-1 text-xs text-white"
      />
      <button
        type="submit"
        disabled={!delta || pending}
        className="rounded-lg bg-primary-500/20 px-2 py-1 text-xs font-bold text-primary-400 disabled:opacity-40"
      >
        OK
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-white/30 hover:text-white"
      >
        ✕
      </button>
    </form>
  )
}

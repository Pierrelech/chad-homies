'use client'

import { useState, useTransition } from 'react'
import { banUserAction, unbanUserAction } from '@/app/actions/admin'
import { Ban, RotateCcw } from 'lucide-react'

type Props = {
  userId: string
  banned: boolean
  banReason: string | null
}

export function BanButton({ userId, banned, banReason }: Props) {
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [reason, setReason] = useState('')

  if (banned) {
    return (
      <button
        onClick={() => {
          const fd = new FormData()
          fd.set('userId', userId)
          startTransition(async () => { await unbanUserAction(fd) })
        }}
        disabled={pending}
        title={banReason ?? 'Banni'}
        className="flex items-center gap-1 rounded-lg bg-success/10 px-2.5 py-1 text-xs font-medium text-success hover:bg-success/20 disabled:opacity-50"
      >
        <RotateCcw size={11} />
        Débannir
      </button>
    )
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 justify-end">
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Raison..."
          className="w-28 rounded-lg border border-white/10 bg-surface-800 px-2 py-1 text-xs text-white"
          autoFocus
          onKeyDown={(e) => e.key === 'Escape' && setConfirming(false)}
        />
        <button
          onClick={() => {
            const fd = new FormData()
            fd.set('userId', userId)
            fd.set('reason', reason || 'Aucune raison spécifiée')
            startTransition(async () => { await banUserAction(fd) })
            setConfirming(false)
          }}
          disabled={pending}
          className="rounded-lg bg-danger/10 px-2 py-1 text-xs font-bold text-danger hover:bg-danger/20 disabled:opacity-50"
        >
          Confirmer
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-xs text-white/30 hover:text-white"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-white/30 hover:bg-danger/10 hover:text-danger"
    >
      <Ban size={11} />
      Bannir
    </button>
  )
}

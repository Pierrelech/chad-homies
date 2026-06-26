'use client'

import { useTransition } from 'react'
import { resolveFightAction } from '@/app/actions/admin'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

export function AdminFightActions({ fightId, status }: { fightId: string; status: string }) {
  const [pending, startTransition] = useTransition()

  function resolve() {
    const fd = new FormData()
    fd.set('fightId', fightId)
    startTransition(async () => { await resolveFightAction(fd) })
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/fights/${fightId}`} className="rounded-lg p-1.5 text-white/30 hover:text-white" target="_blank">
        <ExternalLink size={14} />
      </Link>
      {(status === 'ACTIVE' || status === 'CLOSED') && (
        <button
          onClick={resolve}
          disabled={pending}
          className="rounded-lg bg-primary-500/10 px-3 py-1.5 text-xs font-bold text-primary-400 hover:bg-primary-500/20 disabled:opacity-50"
        >
          {pending ? 'Résolution...' : 'Résoudre & aura'}
        </button>
      )}
    </div>
  )
}

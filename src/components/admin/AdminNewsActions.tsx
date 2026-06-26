'use client'

import { useTransition } from 'react'
import { updateNewsStatusAction, applyNewsPointsAction } from '@/app/actions/admin'
import Link from 'next/link'
import { ExternalLink, Pencil } from 'lucide-react'

export function AdminNewsActions({ newsId, status }: { newsId: string; status: string }) {
  const [pending, startTransition] = useTransition()

  function changeStatus(newStatus: string) {
    const fd = new FormData()
    fd.set('newsId', newsId)
    fd.set('status', newStatus)
    startTransition(async () => { await updateNewsStatusAction(fd) })
  }

  function applyPoints() {
    const fd = new FormData()
    fd.set('newsId', newsId)
    startTransition(async () => { await applyNewsPointsAction(fd) })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/news/${newsId}`}
        className="rounded-lg p-1.5 text-white/30 hover:text-white"
        target="_blank"
        title="Voir"
      >
        <ExternalLink size={14} />
      </Link>
      {status !== 'APPLIED' && (
        <Link
          href={`/admin/news/${newsId}/edit`}
          className="rounded-lg p-1.5 text-white/30 hover:text-white"
          title="Modifier"
        >
          <Pencil size={14} />
        </Link>
      )}

      {status === 'DRAFT' && (
        <button
          onClick={() => changeStatus('VOTING')}
          disabled={pending}
          className="rounded-lg bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning hover:bg-warning/20 disabled:opacity-50"
        >
          Ouvrir le vote
        </button>
      )}
      {status === 'VOTING' && (
        <button
          onClick={() => changeStatus('CLOSED')}
          disabled={pending}
          className="rounded-lg bg-surface-700 px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-surface-600 disabled:opacity-50"
        >
          Clôturer
        </button>
      )}
      {status === 'CLOSED' && (
        <button
          onClick={applyPoints}
          disabled={pending}
          className="rounded-lg bg-success/10 px-3 py-1.5 text-xs font-bold text-success hover:bg-success/20 disabled:opacity-50"
        >
          {pending ? 'Application...' : "Appliquer l'aura"}
        </button>
      )}
    </div>
  )
}

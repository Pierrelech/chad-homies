import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { AdminNewsActions } from '@/components/admin/AdminNewsActions'

export const metadata = { title: 'Admin — Actualités' }

export default async function AdminNewsPage() {
  await verifyAdmin()

  const newsList = await prisma.news.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      participants: { include: { user: { select: { displayName: true } } } },
      _count: { select: { votes: true } },
    },
  })

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    DRAFT:   { label: 'Brouillon',     color: 'text-white/30 bg-white/5' },
    VOTING:  { label: 'Vote en cours', color: 'text-warning bg-warning/10' },
    CLOSED:  { label: 'Clôturé',       color: 'text-white/40 bg-white/5' },
    APPLIED: { label: 'Appliqué',      color: 'text-success bg-success/10' },
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Actualités</h1>
        <Link
          href="/admin/news/new"
          className="flex items-center gap-2 rounded-xl bg-primary-500/10 px-4 py-2 text-sm font-medium text-primary-400 hover:bg-primary-500/20"
        >
          <Plus size={15} /> Nouvelle news
        </Link>
      </div>

      {newsList.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-surface-900 p-12 text-center text-white/30">
          Aucune actualité.
        </div>
      ) : (
        <div className="space-y-3">
          {newsList.map((news) => {
            const st = STATUS_LABELS[news.status] ?? STATUS_LABELS.DRAFT
            return (
              <div
                key={news.id}
                className="rounded-2xl border border-white/5 bg-surface-900 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${st.color}`}>
                        {st.label}
                      </span>
                      <span className="text-xs text-white/25">
                        {new Date(news.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="text-xs text-white/25">{news._count.votes} votes</span>
                    </div>
                    <p className="font-semibold text-white">{news.title}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {news.participants.map((p) => (
                        <span
                          key={p.userId}
                          className={`text-[10px] rounded px-1.5 py-0.5 ${
                            p.deltaPlanned > 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                          }`}
                        >
                          {p.user.displayName} {p.deltaPlanned > 0 ? '+' : ''}{p.deltaPlanned}
                        </span>
                      ))}
                    </div>
                  </div>
                  <AdminNewsActions newsId={news.id} status={news.status} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

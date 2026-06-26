import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/dal'
import Link from 'next/link'
import { Newspaper, ThumbsUp, ThumbsDown, Clock } from 'lucide-react'

export const metadata = { title: 'Actualités' }

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  VOTING:  { label: 'Vote en cours', color: 'text-warning bg-warning/10' },
  CLOSED:  { label: 'Clôturé',       color: 'text-white/40 bg-white/5' },
  APPLIED: { label: 'Appliqué',      color: 'text-success bg-success/10' },
  DRAFT:   { label: 'Brouillon',     color: 'text-white/30 bg-white/5' },
}

export default async function NewsPage() {
  const [currentUser, newsList] = await Promise.all([
    getCurrentUser(),
    prisma.news.findMany({
      where: { status: { not: 'DRAFT' } },
      orderBy: { createdAt: 'desc' },
      include: {
        participants: {
          include: { user: { select: { displayName: true, username: true } } },
        },
        _count: { select: { votes: true } },
        votes: true,
      },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Newspaper className="text-primary-400" size={24} />
        <h1 className="text-2xl font-black text-white">Actualités</h1>
      </div>

      {newsList.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-surface-900 p-12 text-center text-white/30">
          Aucune actualité pour l&apos;instant.
        </div>
      ) : (
        <div className="space-y-4">
          {newsList.map((news, index) => {
            const st = STATUS_LABELS[news.status] ?? STATUS_LABELS.DRAFT
            const positives = news.votes.filter((v) => v.isPositive).length
            const total = news.votes.length
            const pct = total > 0 ? Math.round((positives / total) * 100) : null
            const gains = news.participants.filter((p) => p.deltaPlanned > 0)
            const losses = news.participants.filter((p) => p.deltaPlanned < 0)
            const isFeatured = index === 0

            if (isFeatured) {
              return (
                <Link
                  key={news.id}
                  href={`/news/${news.id}`}
                  className="block overflow-hidden rounded-2xl border border-white/10 bg-surface-900 transition-colors hover:bg-surface-800"
                >
                  {news.imageUrl && (
                    <div className="relative w-full">
                      <img src={news.imageUrl} alt="" className="max-h-[420px] w-auto max-w-full mx-auto block" />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-900 via-surface-900/40 to-transparent" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary-500/20 px-2.5 py-0.5 text-xs font-bold text-primary-400">
                        À la une
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${st.color}`}>
                        {st.label}
                      </span>
                      <span className="text-xs text-white/30">
                        {new Date(news.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      {news.votingEndsAt && news.status === 'VOTING' && (
                        <span className="flex items-center gap-1 text-xs text-warning">
                          <Clock size={11} />
                          Fin le {new Date(news.votingEndsAt).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-black text-white">{news.title}</h2>
                    <p className="mt-2 line-clamp-2 text-sm text-white/50">{news.content}</p>
                    {news.participants.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {gains.map((p) => (
                          <span key={p.userId} className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
                            <ThumbsUp size={10} />{p.user.displayName} +{p.deltaPlanned} aura
                          </span>
                        ))}
                        {losses.map((p) => (
                          <span key={p.userId} className="flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger">
                            <ThumbsDown size={10} />{p.user.displayName} {p.deltaPlanned} aura
                          </span>
                        ))}
                      </div>
                    )}
                    {total > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-white/40">
                        <ThumbsUp size={12} className="text-success" />
                        <span className="font-bold text-success">{pct}%</span>
                        <span>· {total} vote{total > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </Link>
              )
            }

            return (
              <Link
                key={news.id}
                href={`/news/${news.id}`}
                className="block rounded-2xl border border-white/5 bg-surface-900 p-5 transition-colors hover:bg-surface-800"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${st.color}`}>
                        {st.label}
                      </span>
                      <span className="text-xs text-white/30">
                        {new Date(news.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      {news.votingEndsAt && news.status === 'VOTING' && (
                        <span className="flex items-center gap-1 text-xs text-warning">
                          <Clock size={11} />
                          Fin le {new Date(news.votingEndsAt).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-white">{news.title}</h2>
                    {news.participants.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {gains.map((p) => (
                          <span key={p.userId} className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
                            <ThumbsUp size={10} />{p.user.displayName} +{p.deltaPlanned} aura
                          </span>
                        ))}
                        {losses.map((p) => (
                          <span key={p.userId} className="flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger">
                            <ThumbsDown size={10} />{p.user.displayName} {p.deltaPlanned} aura
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {total > 0 && (
                    <div className="flex flex-col items-end gap-1 text-xs text-white/40">
                      <span>{total} vote{total > 1 ? 's' : ''}</span>
                      {pct !== null && (
                        <div className="flex items-center gap-1">
                          <ThumbsUp size={11} className="text-success" />
                          <span className="font-bold text-success">{pct}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

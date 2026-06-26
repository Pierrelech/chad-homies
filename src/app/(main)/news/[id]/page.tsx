import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/dal'
import Link from 'next/link'
import { ArrowLeft, Clock, ThumbsUp, ThumbsDown } from 'lucide-react'
import { NewsVoteButtons } from '@/components/news/NewsVoteButtons'

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params) {
  const { id } = await params
  const news = await prisma.news.findUnique({ where: { id }, select: { title: true } })
  return { title: news?.title ?? 'Actualité' }
}

export default async function NewsDetailPage({ params }: Params) {
  const { id } = await params
  const [currentUser, news] = await Promise.all([
    getCurrentUser(),
    prisma.news.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: { select: { id: true, displayName: true, username: true, image: true, elo: true } },
          },
        },
        votes: true,
        history: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { displayName: true, username: true } } },
        },
      },
    }),
  ])

  if (!news || news.status === 'DRAFT') notFound()

  const positives = news.votes.filter((v) => v.isPositive).length
  const negatives = news.votes.length - positives
  const total = news.votes.length
  const pct = total > 0 ? Math.round((positives / total) * 100) : null
  const userVote = news.votes.find((v) => v.userId === currentUser?.id)

  const gains = news.participants.filter((p) => p.deltaPlanned > 0)
  const losses = news.participants.filter((p) => p.deltaPlanned < 0)

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    VOTING:  { label: 'Vote en cours', color: 'text-warning bg-warning/10 border-warning/20' },
    CLOSED:  { label: 'Clôturé',       color: 'text-white/40 bg-white/5 border-white/10' },
    APPLIED: { label: 'Appliqué',      color: 'text-success bg-success/10 border-success/20' },
  }
  const st = STATUS_LABELS[news.status] ?? STATUS_LABELS.CLOSED

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back */}
      <Link href="/news" className="flex items-center gap-2 text-sm text-white/40 hover:text-white">
        <ArrowLeft size={15} /> Toutes les actualités
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-white/5 bg-surface-900 p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${st.color}`}>
            {st.label}
          </span>
          <span className="text-xs text-white/30">
            {new Date(news.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          {news.votingEndsAt && news.status === 'VOTING' && (
            <span className="flex items-center gap-1 text-xs text-warning">
              <Clock size={11} />
              Vote jusqu&apos;au {new Date(news.votingEndsAt).toLocaleDateString('fr-FR')}
            </span>
          )}
        </div>

        <h1 className="text-xl font-black text-white">{news.title}</h1>

        {news.imageUrl && (
          <div className="mt-4 overflow-hidden rounded-xl">
            <img
              src={news.imageUrl}
              alt={news.title}
              className="max-h-[480px] w-auto max-w-full mx-auto block"
            />
          </div>
        )}

        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/70">
          {news.content}
        </p>
      </div>

      {/* Participants */}
      {news.participants.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-surface-900 p-5">
          <h2 className="mb-4 font-semibold text-white">Personnes concernées</h2>
          <div className="space-y-3">
            {news.participants.map((p) => {
              const isGain = p.deltaPlanned > 0
              const delta = news.status === 'APPLIED' && p.deltaFinal != null
                ? p.deltaFinal
                : p.deltaPlanned
              const label = news.status === 'APPLIED' ? 'Final' : 'Prévu'
              return (
                <div
                  key={p.userId}
                  className="flex items-center gap-3 rounded-xl border border-white/5 p-3"
                >
                  {p.user.image ? (
                    <img src={p.user.image} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-700 text-sm font-bold text-white/60">
                      {p.user.displayName[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/profile/${p.user.username}`}
                      className="font-medium text-white hover:text-primary-400"
                    >
                      {p.user.displayName}
                    </Link>
                    <p className="text-xs text-white/40">{p.reason}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-black ${isGain ? 'text-success' : 'text-danger'}`}
                    >
                      {isGain ? '+' : ''}{delta} aura
                    </span>
                    <p className="text-[10px] text-white/30">{label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Vote */}
      {news.status === 'VOTING' && currentUser && (
        <div className="rounded-2xl border border-white/5 bg-surface-900 p-5">
          <h2 className="mb-1 font-semibold text-white">Ton vote</h2>
          <p className="mb-4 text-xs text-white/40">
            Les votes influencent le multiplicateur appliqué à l&apos;aura.
          </p>
          <NewsVoteButtons
            newsId={news.id}
            initialVote={userVote ? (userVote.isPositive ? 'up' : 'down') : null}
            positives={positives}
            negatives={negatives}
          />
        </div>
      )}

      {/* Vote results */}
      {total > 0 && (
        <div className="rounded-2xl border border-white/5 bg-surface-900 p-5">
          <h2 className="mb-4 font-semibold text-white">
            Résultats du vote{' '}
            <span className="text-sm font-normal text-white/40">({total} vote{total > 1 ? 's' : ''})</span>
          </h2>
          <div className="flex items-center gap-3">
            <ThumbsUp size={16} className="text-success" />
            <div className="relative flex-1 overflow-hidden rounded-full bg-white/5" style={{ height: 8 }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-success transition-all"
                style={{ width: `${pct ?? 0}%` }}
              />
            </div>
            <span className="w-10 text-right text-sm font-bold text-success">{positives}</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <ThumbsDown size={16} className="text-danger" />
            <div className="relative flex-1 overflow-hidden rounded-full bg-white/5" style={{ height: 8 }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-danger transition-all"
                style={{ width: `${100 - (pct ?? 0)}%` }}
              />
            </div>
            <span className="w-10 text-right text-sm font-bold text-danger">{negatives}</span>
          </div>
        </div>
      )}

      {/* History */}
      {news.history.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-surface-900 p-5">
          <h2 className="mb-4 font-semibold text-white">Aura appliquée</h2>
          <div className="space-y-2">
            {news.history.map((h) => (
              <div key={h.id} className="flex items-center justify-between text-sm">
                <Link
                  href={`/profile/${h.user.username}`}
                  className="text-white/70 hover:text-white"
                >
                  {h.user.displayName}
                </Link>
                <span className={h.delta >= 0 ? 'font-bold text-success' : 'font-bold text-danger'}>
                  {h.delta >= 0 ? '+' : ''}{h.delta} aura→ {h.eloAfter} ELO
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

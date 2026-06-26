import Link from 'next/link'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

type News = {
  id: string
  title: string
  status: string
  createdAt: Date
  _count: { votes: number }
  participants: { userId: string; deltaPlanned: number; deltaFinal: number | null }[]
}

export function NewsPreview({ news }: { news: News }) {
  const statusLabel: Record<string, { label: string; color: string }> = {
    VOTING: { label: 'Vote', color: 'text-warning bg-warning/10' },
    CLOSED: { label: 'Terminé', color: 'text-white/40 bg-white/5' },
    APPLIED: { label: 'Appliqué', color: 'text-success bg-success/10' },
    DRAFT: { label: 'Brouillon', color: 'text-white/30 bg-white/5' },
  }
  const st = statusLabel[news.status] ?? statusLabel.DRAFT

  const totalGain = news.participants.reduce(
    (s, p) => s + Math.max(p.deltaPlanned, 0),
    0
  )
  const totalLoss = news.participants.reduce(
    (s, p) => s + Math.min(p.deltaPlanned, 0),
    0
  )

  return (
    <Link
      href={`/news/${news.id}`}
      className="flex items-start gap-3 rounded-2xl border border-white/5 bg-surface-900 px-4 py-3 transition-colors hover:bg-surface-800"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${st.color}`}>
            {st.label}
          </span>
          <time className="text-[10px] text-white/30">
            {new Date(news.createdAt).toLocaleDateString('fr-FR')}
          </time>
        </div>
        <p className="mt-1 text-sm font-medium text-white">{news.title}</p>
        <div className="mt-1.5 flex items-center gap-3 text-[10px] text-white/30">
          <span>{news._count.votes} votes</span>
          {totalGain > 0 && (
            <span className="flex items-center gap-0.5 text-success">
              <ThumbsUp size={10} /> +{totalGain} aura
            </span>
          )}
          {totalLoss < 0 && (
            <span className="flex items-center gap-0.5 text-danger">
              <ThumbsDown size={10} /> {totalLoss} aura
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

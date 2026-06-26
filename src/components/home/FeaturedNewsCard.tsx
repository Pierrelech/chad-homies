import Link from 'next/link'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

type News = {
  id: string
  title: string
  content: string
  imageUrl: string | null
  status: string
  createdAt: Date
  _count: { votes: number }
  participants: { userId: string; deltaPlanned: number; deltaFinal: number | null }[]
}

export function FeaturedNewsCard({ news }: { news: News }) {
  const totalGain = news.participants.reduce((s, p) => s + Math.max(p.deltaPlanned, 0), 0)
  const totalLoss = news.participants.reduce((s, p) => s + Math.min(p.deltaPlanned, 0), 0)

  return (
    <Link href={`/news/${news.id}`} className="block overflow-hidden rounded-2xl border border-danger/30 bg-surface-900 transition-colors hover:border-danger/50">
      {/* Header banner */}
      <div className="flex items-center justify-center gap-2 bg-danger/10 py-2.5">
        <span className="text-sm">🚨</span>
        <span className="text-xs font-black tracking-widest text-danger uppercase">Breaking News</span>
        <span className="text-sm">🚨</span>
      </div>

      {/* Image */}
      {news.imageUrl && (
        <div className="relative">
          <img src={news.imageUrl} alt="" className="max-h-[420px] w-auto max-w-full mx-auto block" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-900/80 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        <h2 className="text-center text-lg font-black text-white leading-snug">{news.title}</h2>

        <p className="mt-3 text-center text-sm text-white/60 line-clamp-3 leading-relaxed">
          {news.content}
        </p>

        {/* Aura + votes */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs">
          {totalGain > 0 && (
            <span className="flex items-center gap-1 text-success font-semibold">
              <ThumbsUp size={12} /> +{totalGain} aura
            </span>
          )}
          {totalLoss < 0 && (
            <span className="flex items-center gap-1 text-danger font-semibold">
              <ThumbsDown size={12} /> {totalLoss} aura
            </span>
          )}
          <span className="text-white/30">{news._count.votes} vote{news._count.votes !== 1 ? 's' : ''}</span>
        </div>

        <p className="mt-3 text-center text-[10px] text-white/20">
          {new Date(news.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
    </Link>
  )
}

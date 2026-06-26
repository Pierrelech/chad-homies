'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

type Props = {
  newsId: string
  initialVote: 'up' | 'down' | null
  positives: number
  negatives: number
}

export function NewsVoteButtons({ newsId, initialVote, positives: initPos, negatives: initNeg }: Props) {
  const [vote, setVote] = useState<'up' | 'down' | null>(initialVote)
  const [pos, setPos] = useState(initPos)
  const [neg, setNeg] = useState(initNeg)
  const [loading, setLoading] = useState(false)

  async function handleVote(choice: 'up' | 'down') {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/news/${newsId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPositive: choice === 'up' }),
      })
      if (res.ok) {
        const data = await res.json()
        setVote(choice)
        setPos(data.positives)
        setNeg(data.negatives)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handleVote('up')}
        disabled={loading}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition-colors disabled:opacity-50 ${
          vote === 'up'
            ? 'border-success bg-success/20 text-success'
            : 'border-white/10 text-white/50 hover:border-success/50 hover:text-success'
        }`}
      >
        <ThumbsUp size={16} />
        <span>Pour</span>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs">{pos}</span>
      </button>

      <button
        onClick={() => handleVote('down')}
        disabled={loading}
        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-bold transition-colors disabled:opacity-50 ${
          vote === 'down'
            ? 'border-danger bg-danger/20 text-danger'
            : 'border-white/10 text-white/50 hover:border-danger/50 hover:text-danger'
        }`}
      >
        <ThumbsDown size={16} />
        <span>Contre</span>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs">{neg}</span>
      </button>
    </div>
  )
}

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function EloTrend({ delta }: { delta: number }) {
  if (delta > 0)
    return (
      <span className="flex items-center gap-0.5 text-success text-xs font-bold">
        <TrendingUp size={12} />+{delta}
      </span>
    )
  if (delta < 0)
    return (
      <span className="flex items-center gap-0.5 text-danger text-xs font-bold">
        <TrendingDown size={12} />
        {delta}
      </span>
    )
  return (
    <span className="flex items-center gap-0.5 text-white/30 text-xs">
      <Minus size={12} />0
    </span>
  )
}

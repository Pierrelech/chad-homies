'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'

export function TriggerDailyFight() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  async function trigger() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/daily-fight', { method: 'POST' })
      setDone(res.ok ? '✓ Combat créé !' : '✗ Erreur')
      setTimeout(() => { setDone(null); window.location.reload() }, 1500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={trigger}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl bg-primary-500/10 px-4 py-2 text-sm font-medium text-primary-400 hover:bg-primary-500/20 disabled:opacity-50"
    >
      <Zap size={15} />
      {done ?? (loading ? 'Création...' : 'Lancer le combat du jour')}
    </button>
  )
}

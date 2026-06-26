'use client'

import { useEffect, useState } from 'react'
import { Bell, ExternalLink } from 'lucide-react'
import Link from 'next/link'

type Notification = {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  link: string | null
  createdAt: string
}

const TYPE_ICONS: Record<string, string> = {
  POINTS_GAINED:        '📈',
  POINTS_LOST:          '📉',
  NEWS_MENTION:         '📰',
  FIGHT_SELECTED:       '⚔️',
  FIGHT_RESULT:         '🏆',
  BADGE_EARNED:         '🏅',
  ACHIEVEMENT_UNLOCKED: '⭐',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data)
        setLoading(false)
      })
    // Mark all as read
    fetch('/api/notifications', { method: 'PATCH' })
  }, [])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="text-primary-400" size={24} />
        <h1 className="text-2xl font-black text-white">Notifications</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-800" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-surface-900 p-12 text-center text-white/30">
          Aucune notification.
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${
                n.read
                  ? 'border-white/5 bg-surface-900'
                  : 'border-primary-500/20 bg-primary-500/5'
              }`}
            >
              <span className="mt-0.5 text-xl">{TYPE_ICONS[n.type] ?? '🔔'}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{n.title}</p>
                <p className="text-sm text-white/50">{n.message}</p>
                <p className="mt-1 text-xs text-white/25">
                  {new Date(n.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {n.link && (
                <Link
                  href={n.link}
                  className="mt-1 shrink-0 text-white/30 hover:text-primary-400"
                >
                  <ExternalLink size={15} />
                </Link>
              )}
              {!n.read && (
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-400" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'
import Link from 'next/link'
import { Users, Newspaper, Sword, TrendingUp, Plus } from 'lucide-react'

export const metadata = { title: 'Administration' }

export default async function AdminPage() {
  await verifyAdmin()

  const [userCount, newsCount, fightCount, activeFight, pendingNews, recentLogs] =
    await Promise.all([
      prisma.user.count(),
      prisma.news.count(),
      prisma.fight.count(),
      prisma.fight.findFirst({ where: { status: 'ACTIVE' }, orderBy: { date: 'desc' } }),
      prisma.news.count({ where: { status: 'VOTING' } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { user: { select: { displayName: true } } },
      }),
    ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Vue d&apos;ensemble</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AdminStat icon={<Users size={18} />} label="Joueurs" value={userCount} />
        <AdminStat icon={<Newspaper size={18} />} label="News" value={newsCount} />
        <AdminStat icon={<Sword size={18} />} label="Combats" value={fightCount} />
        <AdminStat icon={<TrendingUp size={18} />} label="Votes en cours" value={pendingNews} color="text-warning" />
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border border-white/5 bg-surface-900 p-5">
        <h2 className="mb-4 font-semibold text-white">Actions rapides</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/news/new"
            className="flex items-center gap-2 rounded-xl bg-primary-500/10 px-4 py-2.5 text-sm font-medium text-primary-400 transition-colors hover:bg-primary-500/20"
          >
            <Plus size={15} /> Créer une news
          </Link>
          <Link
            href="/admin/fights/new"
            className="flex items-center gap-2 rounded-xl bg-surface-700 px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-surface-600"
          >
            <Plus size={15} /> Créer un combat
          </Link>
        </div>
      </div>

      {/* Active fight alert */}
      {activeFight && (
        <div className="flex items-center justify-between rounded-2xl border border-success/20 bg-success/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <Sword size={18} className="text-success" />
            <div>
              <p className="font-semibold text-white">Combat actif</p>
              <p className="text-sm text-white/50">
                {new Date(activeFight.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
          </div>
          <Link
            href={`/admin/fights`}
            className="rounded-xl bg-success/10 px-3 py-1.5 text-sm font-medium text-success hover:bg-success/20"
          >
            Gérer →
          </Link>
        </div>
      )}

      {/* Recent audit logs */}
      {recentLogs.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-surface-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Activité récente</h2>
            <Link href="/admin/logs" className="text-xs text-primary-400 hover:text-primary-300">
              Voir tout →
            </Link>
          </div>
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white/60">{log.user?.displayName ?? 'Système'}</span>
                  <span className="rounded bg-surface-700 px-1.5 py-0.5 text-[10px] font-mono text-white/40">
                    {log.action}
                  </span>
                  {log.target && (
                    <span className="text-xs text-white/30">{log.target} {log.targetId?.slice(0, 8)}</span>
                  )}
                </div>
                <time className="text-xs text-white/25">
                  {new Date(log.createdAt).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AdminStat({
  icon,
  label,
  value,
  color = 'text-white',
}: {
  icon: React.ReactNode
  label: string
  value: number
  color?: string
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-surface-900 p-4">
      <div className="mb-2 text-white/30">{icon}</div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-white/40">{label}</p>
    </div>
  )
}

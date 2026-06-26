import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'
import { ScrollText } from 'lucide-react'

export const metadata = { title: 'Admin — Audit' }

export default async function AdminLogsPage() {
  await verifyAdmin()

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { displayName: true, username: true } } },
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <ScrollText className="text-primary-400" size={22} />
        <h1 className="text-2xl font-black text-white">Journal d&apos;audit</h1>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-surface-900">
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/40">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/40">Utilisateur</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/40">Action</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold text-white/40 sm:table-cell">Cible</th>
            </tr>
          </thead>
          <tbody className="bg-surface-950">
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                <td className="px-4 py-3 text-xs text-white/30 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('fr-FR', {
                    day: '2-digit', month: '2-digit',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-3 text-sm text-white/70">
                  {log.user?.displayName ?? <span className="text-white/30">Système</span>}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-surface-700 px-2 py-0.5 font-mono text-[11px] text-white/60">
                    {log.action}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-xs text-white/30 sm:table-cell">
                  {log.target && (
                    <span>
                      {log.target}{' '}
                      <span className="font-mono">{log.targetId?.slice(0, 10)}</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

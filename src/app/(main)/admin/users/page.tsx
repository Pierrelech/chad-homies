import { prisma } from '@/lib/prisma'
import { verifyAdmin, getCurrentUser } from '@/lib/dal'
import Link from 'next/link'
import { AdjustEloForm } from '@/components/admin/AdjustEloForm'
import { ChangeRoleForm } from '@/components/admin/ChangeRoleForm'
import { BanButton } from '@/components/admin/BanButton'

const ROLE_RANK: Record<string, number> = { USER: 0, MODERATOR: 1, ADMIN: 2, SUPER_ADMIN: 3 }

export const metadata = { title: 'Admin — Joueurs' }

export default async function AdminUsersPage() {
  const [session, currentUser] = await Promise.all([verifyAdmin(), getCurrentUser()])
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'
  const currentRank = ROLE_RANK[currentUser?.role ?? 'USER'] ?? 0

  const users = await prisma.user.findMany({
    orderBy: { elo: 'desc' },
    select: {
      id: true,
      username: true,
      displayName: true,
      image: true,
      role: true,
      isSystem: true,
      banned: true,
      banReason: true,
      elo: true,
      level: true,
      fightsWon: true,
      fightsLost: true,
      totalGained: true,
      totalLost: true,
      createdAt: true,
    },
  })

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-white">Joueurs</h1>

      <div className="overflow-hidden rounded-2xl border border-white/5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-surface-900">
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/40">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/40">Joueur</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-white/40">ELO</th>
              <th className="hidden px-4 py-3 text-right text-xs font-semibold text-white/40 sm:table-cell">V/D</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-white/40">Ajuster ELO</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-white/40">Ban</th>
              {isSuperAdmin && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-white/40">Rôle</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-surface-950">
            {users.map((u, i) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 last:border-0">
                <td className="px-4 py-3 text-sm font-bold text-white/30">#{i + 1}</td>
                <td className="px-4 py-3">
                  <Link href={`/profile/${u.username}`} className="flex items-center gap-2 hover:text-primary-400">
                    {u.image ? (
                      <img src={u.image} alt="" className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-700 text-xs font-bold text-white/50">
                        {u.displayName[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">{u.displayName}</p>
                      <p className="text-[10px] text-white/30">
                        @{u.username}
                        {u.banned && <span className="ml-1 text-danger">[Banni]</span>}
                        {u.role === 'SUPER_ADMIN' && <span className="ml-1 text-primary-400">[Super Admin]</span>}
                        {u.role === 'ADMIN' && <span className="ml-1 text-yellow-400">[Admin]</span>}
                        {u.role === 'MODERATOR' && <span className="ml-1 text-blue-400">[Modo]</span>}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-black text-primary-400">
                    {u.elo.toLocaleString('fr-FR')}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-right sm:table-cell">
                  <span className="text-xs text-white/50">
                    <span className="text-success">{u.fightsWon}V</span>
                    {' / '}
                    <span className="text-danger">{u.fightsLost}D</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <AdjustEloForm userId={u.id} currentElo={u.elo} />
                </td>
                <td className="px-4 py-3 text-right">
                  {!u.isSystem && u.id !== currentUser?.id && (ROLE_RANK[u.role] ?? 0) < currentRank && (
                    <BanButton userId={u.id} banned={u.banned} banReason={u.banReason} />
                  )}
                </td>
                {isSuperAdmin && (
                  <td className="px-4 py-3 text-right">
                    {!u.isSystem && (
                      <ChangeRoleForm
                        userId={u.id}
                        currentRole={u.role}
                        isSelf={u.id === currentUser?.id}
                      />
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

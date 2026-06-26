import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/dal'
import Link from 'next/link'
import { Trophy } from 'lucide-react'

export const metadata = { title: 'Classement' }

export default async function RankingsPage() {
  const [currentUser, users] = await Promise.all([
    getCurrentUser(),
    prisma.user.findMany({
      where: { isSystem: false },
      orderBy: { elo: 'desc' },
      select: {
        id: true,
        username: true,
        displayName: true,
        image: true,
        elo: true,
        level: true,
        winStreak: true,
        maxWinStreak: true,
        fightsWon: true,
        fightsLost: true,
        totalGained: true,
        totalLost: true,
        bestRank: true,
      },
    }),
  ])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="text-primary-400" size={24} />
        <h1 className="text-2xl font-black text-white">Classement officiel</h1>
      </div>

      {/* Podium top 3 */}
      {users.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[users[1], users[0], users[2]].map((u, podiumPos) => {
            const trueRank = users.indexOf(u) + 1
            const heights = ['h-28', 'h-36', 'h-24']
            const isMe = u.id === currentUser?.id
            return (
              <Link
                key={u.id}
                href={`/profile/${u.username}`}
                className={`relative flex flex-col items-center rounded-2xl border p-4 transition-transform hover:scale-105 ${
                  isMe
                    ? 'border-primary-500/50 bg-primary-500/10'
                    : 'border-white/5 bg-surface-900'
                } ${heights[podiumPos]}`}
              >
                {isMe && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-primary-500 px-1.5 py-0.5 text-[8px] font-black text-white">
                    TOI
                  </span>
                )}
                <span className="text-2xl">{medals[trueRank - 1]}</span>
                {u.image ? (
                  <img src={u.image} alt="" className="mt-1 h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-surface-700 font-bold text-white">
                    {u.displayName[0].toUpperCase()}
                  </div>
                )}
                <p className="mt-1 text-center text-xs font-semibold text-white">{u.displayName}</p>
                <p className="text-sm font-black text-primary-400">{u.elo.toLocaleString('fr-FR')}</p>
              </Link>
            )
          })}
        </div>
      )}

      {/* Full table */}
      <div className="overflow-hidden rounded-2xl border border-white/5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-surface-900">
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/40">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/40">Joueur</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-white/40">ELO</th>
              <th className="hidden px-4 py-3 text-right text-xs font-semibold text-white/40 sm:table-cell">
                V / D
              </th>
              <th className="hidden px-4 py-3 text-right text-xs font-semibold text-white/40 md:table-cell">
                Série
              </th>
              <th className="hidden px-4 py-3 text-right text-xs font-semibold text-white/40 lg:table-cell">
                Lvl
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface-950">
            {users.map((u, i) => {
              const rank = i + 1
              const isMe = u.id === currentUser?.id
              const winRate =
                u.fightsWon + u.fightsLost > 0
                  ? Math.round((u.fightsWon / (u.fightsWon + u.fightsLost)) * 100)
                  : 0

              return (
                <tr
                  key={u.id}
                  className={`border-b border-white/5 transition-colors hover:bg-white/5 last:border-0 ${
                    isMe ? 'bg-primary-500/5' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-white/40">
                      {rank <= 3 ? medals[rank - 1] : `#${rank}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/profile/${u.username}`}
                      className="flex items-center gap-3"
                    >
                      {u.image ? (
                        <img
                          src={u.image}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-700 text-xs font-bold text-white/60">
                          {u.displayName[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {u.displayName}
                          {isMe && (
                            <span className="ml-2 text-[10px] font-black text-primary-400">
                              (toi)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-white/30">@{u.username}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-black text-primary-400">
                      {u.elo.toLocaleString('fr-FR')}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-right sm:table-cell">
                    <span className="text-xs text-white/60">
                      <span className="text-success">{u.fightsWon}V</span>
                      {' / '}
                      <span className="text-danger">{u.fightsLost}D</span>
                      {u.fightsWon + u.fightsLost > 0 && (
                        <span className="ml-1 text-white/30">({winRate}%)</span>
                      )}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-right md:table-cell">
                    {u.winStreak > 0 ? (
                      <span className="flex items-center justify-end gap-1 text-xs text-orange-400">
                        {u.winStreak}🔥
                      </span>
                    ) : (
                      <span className="text-xs text-white/20">—</span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-right lg:table-cell">
                    <span className="rounded bg-surface-700 px-2 py-0.5 text-xs font-bold text-white/60">
                      {u.level}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

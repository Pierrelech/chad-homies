import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/dal'
import Link from 'next/link'
import { Trophy, Sword, TrendingUp, TrendingDown, Award, Star } from 'lucide-react'
import { EloTrend } from '@/components/ui/EloTrend'

type Params = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Params) {
  const { username } = await params
  const user = await prisma.user.findUnique({
    where: { username },
    select: { displayName: true },
  })
  return { title: user?.displayName ?? 'Profil' }
}

export default async function ProfilePage({ params }: Params) {
  const { username } = await params
  const [currentUser, user] = await Promise.all([
    getCurrentUser(),
    prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        image: true,
        bio: true,
        role: true,
        elo: true,
        level: true,
        xp: true,
        winStreak: true,
        maxWinStreak: true,
        fightsWon: true,
        fightsLost: true,
        totalGained: true,
        totalLost: true,
        bestRank: true,
        worstRank: true,
        createdAt: true,
        badges: {
          include: { badge: true },
          orderBy: { earnedAt: 'desc' },
        },
        achievements: {
          include: { achievement: true },
          orderBy: { unlockedAt: 'desc' },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 15,
          select: {
            id: true,
            type: true,
            delta: true,
            eloAfter: true,
            reason: true,
            createdAt: true,
          },
        },
      },
    }),
  ])

  if (!user) notFound()

  const rank = await prisma.user.count({
    where: { elo: { gt: user.elo }, isSystem: false },
  })
  const currentRank = rank + 1

  const isMe = currentUser?.id === user.id
  const winRate =
    user.fightsWon + user.fightsLost > 0
      ? Math.round((user.fightsWon / (user.fightsWon + user.fightsLost)) * 100)
      : null

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Profile card */}
      <div className="rounded-2xl border border-white/5 bg-surface-900 p-6">
        <div className="flex flex-wrap items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            {user.image ? (
              <img
                src={user.image}
                alt=""
                className="h-20 w-20 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-500/20 text-3xl font-black text-primary-400">
                {user.displayName[0].toUpperCase()}
              </div>
            )}
            {currentRank <= 3 && (
              <span className="absolute -right-2 -top-2 text-xl">
                {medals[currentRank - 1]}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-white">{user.displayName}</h1>
              {isMe && (
                <span className="rounded-full bg-primary-500/20 px-2.5 py-0.5 text-xs font-bold text-primary-400">
                  Toi
                </span>
              )}
              {user.role === 'ADMIN' && (
                <span className="rounded-full bg-yellow-500/20 px-2.5 py-0.5 text-xs font-bold text-yellow-400">
                  Admin
                </span>
              )}
              {user.role === 'MODERATOR' && (
                <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-400">
                  Modo
                </span>
              )}
            </div>
            <p className="text-sm text-white/40">@{user.username}</p>
            {user.bio && <p className="mt-2 text-sm text-white/60">{user.bio}</p>}
            <p className="mt-1 text-xs text-white/20">
              Membre depuis{' '}
              {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          {/* ELO badge */}
          <div className="flex flex-col items-center rounded-2xl border border-primary-500/20 bg-primary-500/5 px-5 py-3">
            <span className="text-2xl font-black text-primary-400">
              {user.elo.toLocaleString('fr-FR')}
            </span>
            <span className="text-xs text-white/40">ELO</span>
            <span className="mt-1 text-sm font-bold text-white/60">#{currentRank}</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Sword size={16} />}
          label="Victoires"
          value={user.fightsWon}
          color="text-success"
        />
        <StatCard
          icon={<Sword size={16} />}
          label="Défaites"
          value={user.fightsLost}
          color="text-danger"
        />
        <StatCard
          icon={<TrendingUp size={16} />}
          label="Aura gagnée"
          value={`+${user.totalGained}`}
          color="text-success"
        />
        <StatCard
          icon={<TrendingDown size={16} />}
          label="Aura perdue"
          value={`-${user.totalLost}`}
          color="text-danger"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Star size={16} />} label="Niveau" value={user.level} />
        <StatCard
          icon={<Trophy size={16} />}
          label="Série actuelle"
          value={user.winStreak > 0 ? `${user.winStreak}🔥` : '—'}
        />
        <StatCard
          icon={<Trophy size={16} />}
          label="Meilleure série"
          value={user.maxWinStreak > 0 ? `${user.maxWinStreak}🔥` : '—'}
        />
        <StatCard
          icon={<Trophy size={16} />}
          label="Win rate"
          value={winRate !== null ? `${winRate}%` : '—'}
          color={winRate != null && winRate >= 50 ? 'text-success' : 'text-danger'}
        />
      </div>

      {/* Badges */}
      {user.badges.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-surface-900 p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-white">
            <Award size={16} className="text-primary-400" /> Badges
          </h2>
          <div className="flex flex-wrap gap-2">
            {user.badges.map(({ badge, earnedAt }) => (
              <div
                key={badge.id}
                title={badge.description}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-surface-800 px-3 py-1.5"
              >
                {badge.imageUrl ? (
                  <img src={badge.imageUrl} alt="" className="h-6 w-6 rounded object-cover" />
                ) : (
                  <Award size={16} className="text-primary-400" />
                )}
                <div>
                  <p className="text-xs font-semibold text-white">{badge.name}</p>
                  <p className="text-[10px] text-white/30">
                    {new Date(earnedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {user.achievements.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-surface-900 p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-white">
            <Star size={16} className="text-primary-400" /> Succès
          </h2>
          <div className="space-y-2">
            {user.achievements.map(({ achievement, unlockedAt }) => (
              <div
                key={achievement.id}
                className="flex items-center gap-3 rounded-xl border border-white/5 p-3"
              >
                <Star size={20} className="shrink-0 text-primary-400" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{achievement.name}</p>
                  <p className="text-xs text-white/40">{achievement.description}</p>
                </div>
                <span className="text-xs text-white/30">
                  {new Date(unlockedAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {user.history.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-surface-900 p-5">
          <h2 className="mb-4 font-semibold text-white">Historique de l&apos;aura</h2>
          <div className="space-y-2">
            {user.history.map((h) => {
              const typeLabel: Record<string, string> = {
                NEWS: 'Actualité',
                FIGHT: 'Combat',
                MANUAL: 'Manuel',
                SEASON_RESET: 'Reset saison',
              }
              return (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 px-4 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-white/60">{h.reason}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/30">{typeLabel[h.type]}</span>
                      <span className="text-[10px] text-white/20">
                        {new Date(h.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3 flex flex-col items-end gap-0.5">
                    <EloTrend delta={h.delta} />
                    <span className="text-[10px] text-white/30">{h.eloAfter} ELO</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color = 'text-white',
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color?: string
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-surface-900 p-4">
      <div className="mb-2 text-white/30">{icon}</div>
      <p className={`text-lg font-black ${color}`}>{value}</p>
      <p className="text-xs text-white/40">{label}</p>
    </div>
  )
}

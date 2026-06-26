import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/dal'
import Link from 'next/link'
import { Trophy, Sword, Newspaper } from 'lucide-react'
import { FightCard } from '@/components/home/FightCard'
import { NewsPreview } from '@/components/home/NewsPreview'
import { FeaturedNewsCard } from '@/components/home/FeaturedNewsCard'

export default async function HomePage() {
  const [user, topUsers, activeFight, recentNews] = await Promise.all([
    getCurrentUser(),
    prisma.user.findMany({
      where: { isSystem: false },
      orderBy: { elo: 'desc' },
      take: 5,
      select: {
        id: true,
        username: true,
        displayName: true,
        image: true,
        elo: true,
        level: true,
        winStreak: true,
      },
    }),
    prisma.fight.findFirst({
      where: { status: { in: ['ACTIVE', 'PENDING'] } },
      orderBy: { date: 'desc' },
      include: {
        teams: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, username: true, displayName: true, image: true, elo: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.news.findMany({
      where: { status: { in: ['VOTING', 'CLOSED', 'APPLIED'] } },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        _count: { select: { votes: true } },
        participants: { select: { userId: true, deltaPlanned: true, deltaFinal: true } },
      },
    }),
  ])

  const userRank = user
    ? (await prisma.user.count({ where: { elo: { gt: user.elo }, isSystem: false } })) + 1
    : null

  return (
    <div className="space-y-8">
      {/* Hero: user stats */}
      {user && (
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-surface-800 to-surface-900 p-6">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary-400 blur-3xl" />
          </div>
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {user.image ? (
                <img src={user.image} alt="" className="h-16 w-16 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500/20 text-2xl font-black text-primary-400">
                  {user.displayName[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm text-white/40">Bienvenue,</p>
                <h1 className="text-xl font-bold text-white">{user.displayName}</h1>
                <p className="text-sm text-white/40">Niveau {user.level}</p>
              </div>
            </div>
            <div className="flex gap-6">
              <Stat label="ELO" value={user.elo.toLocaleString('fr-FR')} gold />
              <Stat label="Rang" value={`#${userRank}`} />
              <Stat label="Série" value={`${user.winStreak}🔥`} />
            </div>
          </div>
        </div>
      )}

      {/* Breaking News */}
      {recentNews.length > 0 && (
        <div>
          <SectionHeader icon={<Newspaper size={16} />} title="Dernière actualité" href="/news" />
          <div className="mt-3">
            <FeaturedNewsCard news={recentNews[0]} />
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Top 5 */}
        <div className="lg:col-span-1">
          <SectionHeader icon={<Trophy size={16} />} title="Top 5" href="/rankings" />
          <div className="mt-3 overflow-hidden rounded-2xl border border-white/5 bg-surface-900">
            {topUsers.map((u, i) => {
              const medals = ['🥇', '🥈', '🥉']
              return (
                <Link
                  key={u.id}
                  href={`/profile/${u.username}`}
                  className="flex items-center gap-3 border-b border-white/5 px-4 py-3 transition-colors hover:bg-white/5 last:border-0"
                >
                  <span className="w-6 text-center text-sm font-bold text-white/40">
                    {i < 3 ? medals[i] : `#${i + 1}`}
                  </span>
                  {u.image ? (
                    <img src={u.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-700 text-xs font-bold text-white/60">
                      {u.displayName[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{u.displayName}</p>
                    {u.winStreak > 2 && (
                      <p className="text-xs text-orange-400">{u.winStreak} victoires d&apos;affilée 🔥</p>
                    )}
                  </div>
                  <span className="text-sm font-bold text-primary-400">
                    {u.elo.toLocaleString('fr-FR')}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Right: Active fight + autres actus */}
        <div className="lg:col-span-2">
          <SectionHeader icon={<Sword size={16} />} title="Combat du jour" href="/fights" />
          <div className="mt-3">
            {activeFight ? (
              <FightCard fight={activeFight} currentUserId={user?.id} />
            ) : (
              <EmptyCard message="Aucun combat aujourd'hui — reviens demain !" />
            )}
          </div>

          {recentNews.slice(1).length > 0 && (
            <div className="mt-6">
              <SectionHeader icon={<Newspaper size={16} />} title="Autres actus" href="/news" />
              <div className="mt-3 space-y-3">
                {recentNews.slice(1).map((n) => <NewsPreview key={n.id} news={n} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="text-center">
      <p className={`text-lg font-black ${gold ? 'text-primary-400' : 'text-white'}`}>{value}</p>
      <p className="text-xs text-white/40">{label}</p>
    </div>
  )
}

function SectionHeader({
  icon,
  title,
  href,
}: {
  icon: React.ReactNode
  title: string
  href: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-white/60">
        {icon}
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      <Link href={href} className="text-xs text-primary-400 hover:text-primary-300">
        Voir tout →
      </Link>
    </div>
  )
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-surface-900 p-6 text-center text-sm text-white/30">
      {message}
    </div>
  )
}

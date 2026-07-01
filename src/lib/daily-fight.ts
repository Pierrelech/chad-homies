import { prisma } from './prisma'

export async function scheduleDailyFight() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // ─── 1. Clôturer et résoudre le combat d'hier s'il est encore ACTIVE ──────────
  const yesterdayFight = await prisma.fight.findFirst({
    where: {
      date: yesterday,
      status: 'ACTIVE',
    },
    include: {
      teams: { include: { members: true } },
      votes: true,
    },
  })

  if (yesterdayFight) {
    await resolveFight(yesterdayFight)
    console.log(`[CRON] Combat du ${yesterday.toLocaleDateString('fr-FR')} résolu automatiquement`)
  }

  // ─── 2. Créer le combat du jour s'il n'existe pas encore ─────────────────────
  const existing = await prisma.fight.findFirst({ where: { date: today } })
  if (existing) {
    console.log(`[CRON] Combat du jour déjà existant, ignoré`)
    return
  }

  const users = await prisma.user.findMany({
    where: { isSystem: false },
    select: { id: true },
  })

  if (users.length < 8) {
    console.log(`[CRON] Pas assez de joueurs pour créer un combat (${users.length}/8 requis)`)
    return
  }

  // Mélange aléatoire et division en deux équipes égales
  const shuffled = [...users].sort(() => Math.random() - 0.5)
  const half = Math.floor(shuffled.length / 2)
  const teamAIds = shuffled.slice(0, half).map((u) => u.id)
  const teamBIds = shuffled.slice(half, half * 2).map((u) => u.id)

  const fight = await prisma.fight.create({
    data: {
      date: today,
      status: 'ACTIVE',
      redistributionMode: 'EQUAL',
      teams: {
        create: [
          { team: 'A', members: { create: teamAIds.map((userId) => ({ userId })) } },
          { team: 'B', members: { create: teamBIds.map((userId) => ({ userId })) } },
        ],
      },
    },
  })

  // Notifier les participants
  const allIds = [...teamAIds, ...teamBIds]
  await prisma.notification.createMany({
    data: allIds.map((userId) => ({
      userId,
      type: 'FIGHT_SELECTED' as never,
      title: '⚔️ Combat du jour lancé !',
      message: `Tu es dans le combat d'aujourd'hui — va voter !`,
      link: `/fights/${fight.id}`,
    })),
  })

  console.log(`[CRON] Combat du ${today.toLocaleDateString('fr-FR')} créé (${teamAIds.length}v${teamBIds.length})`)
}

type FightWithRelations = Awaited<ReturnType<typeof prisma.fight.findFirst>> & {
  teams: Array<{
    team: string
    members: Array<{ userId: string }>
  }>
  votes: Array<{ team: string }>
}

async function resolveFight(fight: NonNullable<FightWithRelations>) {
  const teamAVotes = fight.votes.filter((v) => v.team === 'A').length
  const teamBVotes = fight.votes.filter((v) => v.team === 'B').length

  const teamA = fight.teams.find((t) => t.team === 'A')
  const teamB = fight.teams.find((t) => t.team === 'B')
  if (!teamA || !teamB) return

  const aWon = teamAVotes >= teamBVotes
  const winners = aWon ? teamA.members : teamB.members
  const losers = aWon ? teamB.members : teamA.members

  const pointsPerLoser = 10
  const totalPool = losers.length * pointsPerLoser
  const gainPerWinner = Math.max(1, Math.floor(totalPool / winners.length))

  await prisma.$transaction(async (tx) => {
    for (const m of losers) {
      const user = await tx.user.findUnique({
        where: { id: m.userId },
        select: { elo: true, fightsLost: true, winStreak: true },
      })
      if (!user) continue
      const newElo = Math.max(0, user.elo - pointsPerLoser)
      await tx.user.update({
        where: { id: m.userId },
        data: { elo: newElo, fightsLost: user.fightsLost + 1, winStreak: 0, totalLost: { increment: pointsPerLoser } },
      })
      await tx.pointHistory.create({
        data: { userId: m.userId, delta: -pointsPerLoser, eloAfter: newElo, type: 'FIGHT', reason: 'Défaite (clôture auto)', fightId: fight.id },
      })
      await tx.notification.create({
        data: { userId: m.userId, type: 'FIGHT_RESULT', title: 'Défaite 😔', message: `-${pointsPerLoser} ELO`, link: `/fights/${fight.id}` },
      })
    }

    for (const m of winners) {
      const user = await tx.user.findUnique({
        where: { id: m.userId },
        select: { elo: true, fightsWon: true, winStreak: true, maxWinStreak: true },
      })
      if (!user) continue
      const newElo = user.elo + gainPerWinner
      const newStreak = user.winStreak + 1
      await tx.user.update({
        where: { id: m.userId },
        data: {
          elo: newElo,
          fightsWon: user.fightsWon + 1,
          winStreak: newStreak,
          maxWinStreak: Math.max(user.maxWinStreak, newStreak),
          totalGained: { increment: gainPerWinner },
        },
      })
      await tx.pointHistory.create({
        data: { userId: m.userId, delta: gainPerWinner, eloAfter: newElo, type: 'FIGHT', reason: 'Victoire (clôture auto)', fightId: fight.id },
      })
      await tx.notification.create({
        data: { userId: m.userId, type: 'FIGHT_RESULT', title: 'Victoire ! 🏆', message: `+${gainPerWinner} ELO`, link: `/fights/${fight.id}` },
      })
    }

    await tx.fight.update({
      where: { id: fight.id },
      data: { status: 'RESOLVED', teamAVotes, teamBVotes, resolvedAt: new Date() },
    })
  })
}

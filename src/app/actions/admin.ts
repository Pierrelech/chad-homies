'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyAdmin, verifySuperAdmin, verifySession } from '@/lib/dal'

// ─── NEWS ─────────────────────────────────────────────────────────────────────

const createNewsSchema = z.object({
  title: z.string().min(5, 'Titre trop court').max(200),
  content: z.string().min(10, 'Contenu trop court'),
  votingEndsAt: z.string().optional(),
  imageUrl: z.string().optional(),
  participants: z.string(),
})

export async function createNewsAction(formData: FormData) {
  const session = await verifyAdmin()

  const raw = {
    title: formData.get('title'),
    content: formData.get('content'),
    votingEndsAt: formData.get('votingEndsAt') || undefined,
    imageUrl: formData.get('imageUrl') || undefined,
    participants: formData.get('participants'),
  }

  const parsed = createNewsSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { title, content, votingEndsAt, imageUrl, participants } = parsed.data

  let participantData: { userId: string; deltaPlanned: number; reason: string }[] = []
  try {
    participantData = JSON.parse(participants)
  } catch {
    return { errors: { participants: ['Format JSON invalide'] } }
  }

  const news = await prisma.news.create({
    data: {
      title,
      content,
      imageUrl,
      authorId: session.userId,
      status: 'VOTING',
      votingEndsAt: votingEndsAt ? new Date(votingEndsAt) : undefined,
      participants: {
        create: participantData.map((p) => ({
          userId: p.userId,
          deltaPlanned: p.deltaPlanned,
          reason: p.reason,
        })),
      },
    },
  })

  await logAudit(session.userId, 'CREATE_NEWS', 'News', news.id)
  revalidatePath('/news')
  revalidatePath('/admin/news')
  redirect('/admin/news')
}

const updateNewsSchema = z.object({
  newsId: z.string(),
  title: z.string().min(5, 'Titre trop court').max(200),
  content: z.string().min(10, 'Contenu trop court'),
  votingEndsAt: z.string().optional(),
  imageUrl: z.string().optional(),
})

export async function updateNewsAction(formData: FormData) {
  const session = await verifyAdmin()

  const raw = {
    newsId: formData.get('newsId'),
    title: formData.get('title'),
    content: formData.get('content'),
    votingEndsAt: formData.get('votingEndsAt') || undefined,
    imageUrl: formData.get('imageUrl') || undefined,
  }

  const parsed = updateNewsSchema.safeParse(raw)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const { newsId, title, content, votingEndsAt, imageUrl } = parsed.data

  await prisma.news.update({
    where: { id: newsId },
    data: {
      title,
      content,
      imageUrl: imageUrl ?? null,
      votingEndsAt: votingEndsAt ? new Date(votingEndsAt) : null,
    },
  })

  await logAudit(session.userId, 'UPDATE_NEWS', 'News', newsId)
  revalidatePath('/news')
  revalidatePath(`/news/${newsId}`)
  revalidatePath('/admin/news')
  redirect('/admin/news')
}

export async function deleteNewsAction(formData: FormData) {
  const session = await verifyAdmin()
  const newsId = formData.get('newsId') as string

  await prisma.$transaction([
    prisma.pointHistory.updateMany({ where: { newsId }, data: { newsId: null } }),
    prisma.news.delete({ where: { id: newsId } }),
  ])

  await logAudit(session.userId, 'DELETE_NEWS', 'News', newsId)
  revalidatePath('/news')
  revalidatePath('/admin/news')
}

export async function updateNewsStatusAction(formData: FormData) {
  await verifyAdmin()
  const newsId = formData.get('newsId') as string
  const status = formData.get('status') as string

  await prisma.news.update({
    where: { id: newsId },
    data: { status: status as never },
  })

  revalidatePath('/news')
  revalidatePath('/admin/news')
}

export async function applyNewsPointsAction(formData: FormData) {
  const session = await verifyAdmin()
  const newsId = formData.get('newsId') as string

  const news = await prisma.news.findUnique({
    where: { id: newsId },
    include: {
      participants: true,
      votes: true,
    },
  })

  if (!news || news.status !== 'CLOSED') {
    return { error: 'La news doit être clôturée avant application' }
  }

  const total = news.votes.length
  const positives = news.votes.filter((v) => v.isPositive).length
  const ratio = total >= news.minVotesForBonus ? positives / total : 0.5
  const multiplier = 1 + (ratio - 0.5) * 2 * (news.maxBonusPct / 100)

  await prisma.$transaction(async (tx) => {
    for (const p of news.participants) {
      const deltaFinal = Math.round(p.deltaPlanned * multiplier)

      await tx.newsParticipant.update({
        where: { id: p.id },
        data: { deltaFinal },
      })

      const user = await tx.user.findUnique({
        where: { id: p.userId },
        select: { elo: true, totalGained: true, totalLost: true },
      })
      if (!user) continue

      const newElo = Math.max(0, user.elo + deltaFinal)

      await tx.user.update({
        where: { id: p.userId },
        data: {
          elo: newElo,
          totalGained: deltaFinal > 0 ? user.totalGained + deltaFinal : user.totalGained,
          totalLost: deltaFinal < 0 ? user.totalLost + Math.abs(deltaFinal) : user.totalLost,
        },
      })

      await tx.pointHistory.create({
        data: {
          userId: p.userId,
          delta: deltaFinal,
          eloAfter: newElo,
          type: 'NEWS',
          reason: `News: ${news.title}`,
          newsId: news.id,
          adminId: session.userId,
        },
      })

      await tx.notification.create({
        data: {
          userId: p.userId,
          type: deltaFinal >= 0 ? 'POINTS_GAINED' : 'POINTS_LOST',
          title: deltaFinal >= 0 ? `+${deltaFinal} points ELO` : `${deltaFinal} points ELO`,
          message: `Suite à la news : ${news.title}`,
          link: `/news/${news.id}`,
        },
      })
    }

    await tx.news.update({
      where: { id: newsId },
      data: { status: 'APPLIED', appliedAt: new Date() },
    })
  })

  await logAudit(session.userId, 'APPLY_NEWS_POINTS', 'News', newsId)
  revalidatePath('/news')
  revalidatePath(`/news/${newsId}`)
  revalidatePath('/admin/news')
}

// ─── FIGHTS ───────────────────────────────────────────────────────────────────

const createFightSchema = z.object({
  date: z.string(),
  teamA: z.string(), // JSON: string[] of userIds
  teamB: z.string(), // JSON: string[] of userIds
  redistributionMode: z.enum(['EQUAL', 'RANDOM', 'WEIGHTED']).default('EQUAL'),
})

export async function createFightAction(formData: FormData) {
  const session = await verifyAdmin()

  const raw = {
    date: formData.get('date'),
    teamA: formData.get('teamA'),
    teamB: formData.get('teamB'),
    redistributionMode: formData.get('redistributionMode') || 'EQUAL',
  }

  const parsed = createFightSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { date, teamA, teamB, redistributionMode } = parsed.data

  let teamAIds: string[] = []
  let teamBIds: string[] = []
  try {
    teamAIds = JSON.parse(teamA)
    teamBIds = JSON.parse(teamB)
  } catch {
    return { errors: { teamA: ['Format invalide'] } }
  }

  if (teamAIds.length === 0 || teamBIds.length === 0) {
    return { errors: { teamA: ['Chaque équipe doit avoir au moins 1 joueur'] } }
  }

  const fight = await prisma.fight.create({
    data: {
      date: new Date(date),
      status: 'ACTIVE',
      redistributionMode,
      teams: {
        create: [
          {
            team: 'A',
            members: { create: teamAIds.map((userId) => ({ userId })) },
          },
          {
            team: 'B',
            members: { create: teamBIds.map((userId) => ({ userId })) },
          },
        ],
      },
    },
  })

  // Notify participants
  const allIds = [...teamAIds, ...teamBIds]
  await prisma.notification.createMany({
    data: allIds.map((userId) => ({
      userId,
      type: 'FIGHT_SELECTED' as never,
      title: 'Tu es dans le combat du jour !',
      message: `Combat du ${new Date(date).toLocaleDateString('fr-FR')} — vote en cours !`,
      link: `/fights/${fight.id}`,
    })),
  })

  await logAudit(session.userId, 'CREATE_FIGHT', 'Fight', fight.id)
  revalidatePath('/fights')
  revalidatePath('/home')
  revalidatePath('/admin/fights')
  redirect('/admin/fights')
}

export async function resolveFightAction(formData: FormData) {
  const session = await verifyAdmin()
  const fightId = formData.get('fightId') as string

  const fight = await prisma.fight.findUnique({
    where: { id: fightId },
    include: {
      teams: { include: { members: true } },
      votes: true,
    },
  })

  if (!fight || fight.status === 'RESOLVED') {
    return { error: 'Combat introuvable ou déjà résolu' }
  }

  const teamAVotes = fight.votes.filter((v) => v.team === 'A').length
  const teamBVotes = fight.votes.filter((v) => v.team === 'B').length

  const teamA = fight.teams.find((t) => t.team === 'A')
  const teamB = fight.teams.find((t) => t.team === 'B')
  if (!teamA || !teamB) return { error: 'Équipes introuvables' }

  const aWon = teamAVotes >= teamBVotes
  const winners = aWon ? teamA.members : teamB.members
  const losers = aWon ? teamB.members : teamA.members

  // Points à redistribuer : 10 pts par perdant, pris sur leurs ELOs
  const pointsPerLoser = 10
  const totalPool = losers.length * pointsPerLoser
  const gainPerWinner = Math.floor(totalPool / winners.length)

  await prisma.$transaction(async (tx) => {
    for (const m of losers) {
      const user = await tx.user.findUnique({ where: { id: m.userId }, select: { elo: true, fightsLost: true, winStreak: true } })
      if (!user) continue
      const newElo = Math.max(0, user.elo - pointsPerLoser)
      await tx.user.update({
        where: { id: m.userId },
        data: { elo: newElo, fightsLost: user.fightsLost + 1, winStreak: 0, totalLost: { increment: pointsPerLoser } },
      })
      await tx.pointHistory.create({
        data: { userId: m.userId, delta: -pointsPerLoser, eloAfter: newElo, type: 'FIGHT', reason: 'Défaite au combat', fightId, adminId: session.userId },
      })
      await tx.notification.create({
        data: { userId: m.userId, type: 'FIGHT_RESULT', title: 'Défaite 😔', message: `-${pointsPerLoser} ELO suite au combat`, link: `/fights/${fightId}` },
      })
    }

    for (const m of winners) {
      const user = await tx.user.findUnique({ where: { id: m.userId }, select: { elo: true, fightsWon: true, winStreak: true, maxWinStreak: true } })
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
        data: { userId: m.userId, delta: gainPerWinner, eloAfter: newElo, type: 'FIGHT', reason: 'Victoire au combat', fightId, adminId: session.userId },
      })
      await tx.notification.create({
        data: { userId: m.userId, type: 'FIGHT_RESULT', title: 'Victoire ! 🏆', message: `+${gainPerWinner} ELO`, link: `/fights/${fightId}` },
      })
    }

    await tx.fight.update({
      where: { id: fightId },
      data: { status: 'RESOLVED', teamAVotes, teamBVotes, resolvedAt: new Date() },
    })
  })

  await logAudit(session.userId, 'RESOLVE_FIGHT', 'Fight', fightId)
  revalidatePath('/fights')
  revalidatePath(`/fights/${fightId}`)
  revalidatePath('/rankings')
  revalidatePath('/home')
  revalidatePath('/admin/fights')
}

// ─── USERS ────────────────────────────────────────────────────────────────────

export async function adjustEloAction(formData: FormData) {
  const session = await verifyAdmin()
  const userId = formData.get('userId') as string
  const delta = parseInt(formData.get('delta') as string)
  const reason = (formData.get('reason') as string) || 'Ajustement manuel'

  if (isNaN(delta) || delta === 0) return { error: 'Delta invalide' }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { elo: true, totalGained: true, totalLost: true } })
  if (!user) return { error: 'Utilisateur introuvable' }

  const newElo = Math.max(0, user.elo + delta)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        elo: newElo,
        totalGained: delta > 0 ? user.totalGained + delta : user.totalGained,
        totalLost: delta < 0 ? user.totalLost + Math.abs(delta) : user.totalLost,
      },
    }),
    prisma.pointHistory.create({
      data: { userId, delta, eloAfter: newElo, type: 'MANUAL', reason, adminId: session.userId },
    }),
    prisma.notification.create({
      data: {
        userId,
        type: delta > 0 ? 'POINTS_GAINED' : 'POINTS_LOST',
        title: delta > 0 ? `+${delta} ELO (admin)` : `${delta} ELO (admin)`,
        message: reason,
      },
    }),
  ])

  await logAudit(session.userId, 'ADJUST_ELO', 'User', userId, { delta, reason })
  revalidatePath('/rankings')
  revalidatePath(`/profile`)
  revalidatePath('/admin/users')
}

export async function changeUserRoleAction(formData: FormData) {
  const session = await verifySuperAdmin()
  const userId = formData.get('userId') as string
  const role = formData.get('role') as string

  const allowed = ['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN']
  if (!allowed.includes(role)) return { error: 'Rôle invalide' }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { username: true, role: true } })
  if (!target) return { error: 'Utilisateur introuvable' }

  await prisma.user.update({ where: { id: userId }, data: { role: role as never } })
  await logAudit(session.userId, 'CHANGE_ROLE', 'User', userId, { from: target.role, to: role })
  revalidatePath('/admin/users')
}

// ─── UTILISATEURS ─────────────────────────────────────────────────────────────

const ROLE_RANK: Record<string, number> = { USER: 0, MODERATOR: 1, ADMIN: 2, SUPER_ADMIN: 3 }

export async function banUserAction(formData: FormData) {
  const session = await verifyAdmin()
  const userId = formData.get('userId') as string
  const reason = (formData.get('reason') as string) || 'Aucune raison spécifiée'

  const [moderator, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { role: true, isSystem: true } }),
  ])

  if (!target || target.isSystem) return { error: 'Cible invalide' }
  if (userId === session.userId) return { error: 'Tu ne peux pas te bannir toi-même' }

  const modRank = ROLE_RANK[moderator?.role ?? 'USER'] ?? 0
  const targetRank = ROLE_RANK[target.role] ?? 0
  if (targetRank >= modRank) return { error: 'Rang insuffisant pour bannir cet utilisateur' }

  await prisma.user.update({ where: { id: userId }, data: { banned: true, banReason: reason } })
  await logAudit(session.userId, 'BAN_USER', 'User', userId, { reason })
  revalidatePath('/admin/users')
}

export async function unbanUserAction(formData: FormData) {
  const session = await verifyAdmin()
  const userId = formData.get('userId') as string

  await prisma.user.update({ where: { id: userId }, data: { banned: false, banReason: null } })
  await logAudit(session.userId, 'UNBAN_USER', 'User', userId)
  revalidatePath('/admin/users')
}

// ─── UTILS ────────────────────────────────────────────────────────────────────

async function logAudit(
  userId: string,
  action: string,
  target?: string,
  targetId?: string,
  metadata?: object,
) {
  await prisma.auditLog.create({
    data: { userId, action, target, targetId, metadata: metadata as never },
  })
}

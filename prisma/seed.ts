import { PrismaClient, Role, NewsStatus, FightStatus, BadgeType, HistoryType } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding la base de données...')

  // ─── Paramètres par défaut ──────────────────────────────────────────────────
  await prisma.setting.createMany({
    skipDuplicates: true,
    data: [
      { key: 'news_voting_duration_hours', value: 24 },
      { key: 'news_max_bonus_pct', value: 30 },
      { key: 'news_min_votes_for_bonus', value: 5 },
      { key: 'fight_redistribution_mode', value: 'EQUAL' },
      { key: 'fight_participants_count', value: 8 },
      { key: 'site_name', value: 'CHAD Homies Rankings' },
      { key: 'season_active', value: true },
    ],
  })

  // ─── Badges ────────────────────────────────────────────────────────────────
  const badges = await Promise.all([
    prisma.badge.upsert({
      where: { name: 'Le CHAD Suprême' },
      update: {},
      create: {
        name: 'Le CHAD Suprême',
        description: 'Atteindre la 1ère place du classement',
        imageUrl: '/badges/crown.svg',
        type: BadgeType.RANK,
        condition: { type: 'rank_reached', value: 1 },
      },
    }),
    prisma.badge.upsert({
      where: { name: 'Série Infernale' },
      update: {},
      create: {
        name: 'Série Infernale',
        description: 'Gagner 5 combats consécutifs',
        imageUrl: '/badges/fire.svg',
        type: BadgeType.STREAK,
        condition: { type: 'win_streak', value: 5 },
      },
    }),
    prisma.badge.upsert({
      where: { name: 'Vétéran' },
      update: {},
      create: {
        name: 'Vétéran',
        description: 'Participer à 20 combats',
        imageUrl: '/badges/shield.svg',
        type: BadgeType.SPECIAL,
        condition: { type: 'fights_total', value: 20 },
      },
    }),
    prisma.badge.upsert({
      where: { name: 'ELO 1500' },
      update: {},
      create: {
        name: 'ELO 1500',
        description: 'Atteindre 1500 points ELO',
        imageUrl: '/badges/star.svg',
        type: BadgeType.RANK,
        condition: { type: 'elo_reached', value: 1500 },
      },
    }),
    prisma.badge.upsert({
      where: { name: 'ELO 2000' },
      update: {},
      create: {
        name: 'ELO 2000',
        description: 'Atteindre 2000 points ELO — légendaire',
        imageUrl: '/badges/diamond.svg',
        type: BadgeType.RANK,
        condition: { type: 'elo_reached', value: 2000 },
      },
    }),
  ])

  // ─── Succès ────────────────────────────────────────────────────────────────
  await prisma.achievement.createMany({
    skipDuplicates: true,
    data: [
      {
        name: 'Premier Combat',
        description: 'Participer à ton premier combat',
        xpReward: 100,
        condition: { type: 'fights_total', value: 1 },
      },
      {
        name: 'Première Victoire',
        description: 'Gagner ton premier combat',
        xpReward: 200,
        condition: { type: 'fights_won', value: 1 },
      },
      {
        name: 'Dans l\'actualité',
        description: 'Apparaître dans une news',
        xpReward: 150,
        condition: { type: 'news_mentions', value: 1 },
      },
    ],
  })

  // ─── Saison 1 ──────────────────────────────────────────────────────────────
  await prisma.season.upsert({
    where: { number: 1 },
    update: {},
    create: {
      name: 'Saison 1 — Les Origines',
      number: 1,
      startedAt: new Date('2024-01-01'),
      isActive: true,
    },
  })

  // ─── Utilisateurs demo ─────────────────────────────────────────────────────
  const hash = (pwd: string) => bcrypt.hash(pwd, 12)

  const users = await Promise.all([
    // Admin
    prisma.user.upsert({
      where: { email: 'admin@chadhomies.fr' },
      update: {},
      create: {
        email: 'admin@chadhomies.fr',
        username: 'admin',
        displayName: 'Admin',
        passwordHash: await hash('Admin1234!'),
        role: Role.ADMIN,
        elo: 1000,
        bio: 'Administrateur du site.',
      },
    }),
    // Membres avec différents ELO
    prisma.user.upsert({
      where: { email: 'pierre@chadhomies.fr' },
      update: {},
      create: {
        email: 'pierre@chadhomies.fr',
        username: 'pierre',
        displayName: 'Pierre',
        passwordHash: await hash('Pierre1234!'),
        role: Role.USER,
        elo: 1842,
        totalGained: 842,
        totalLost: 120,
        fightsWon: 15,
        fightsLost: 5,
        winStreak: 3,
        maxWinStreak: 5,
        bestRank: 1,
        bio: 'Le boss incontesté. 👑',
      },
    }),
    prisma.user.upsert({
      where: { email: 'lucas@chadhomies.fr' },
      update: {},
      create: {
        email: 'lucas@chadhomies.fr',
        username: 'lucas',
        displayName: 'Lucas',
        passwordHash: await hash('Lucas1234!'),
        role: Role.USER,
        elo: 1819,
        totalGained: 780,
        totalLost: 190,
        fightsWon: 13,
        fightsLost: 7,
        winStreak: 0,
        maxWinStreak: 4,
        bestRank: 1,
        bio: 'Toujours dans le top. Pour l\'instant.',
      },
    }),
    prisma.user.upsert({
      where: { email: 'thomas@chadhomies.fr' },
      update: {},
      create: {
        email: 'thomas@chadhomies.fr',
        username: 'thomas',
        displayName: 'Thomas',
        passwordHash: await hash('Thomas1234!'),
        role: Role.USER,
        elo: 1810,
        totalGained: 750,
        totalLost: 210,
        fightsWon: 12,
        fightsLost: 8,
        winStreak: 2,
        maxWinStreak: 3,
        bestRank: 2,
        bio: 'Le challenger éternel.',
      },
    }),
    prisma.user.upsert({
      where: { email: 'quentin@chadhomies.fr' },
      update: {},
      create: {
        email: 'quentin@chadhomies.fr',
        username: 'quentin',
        displayName: 'Quentin',
        passwordHash: await hash('Quentin1234!'),
        role: Role.USER,
        elo: 1796,
        totalGained: 720,
        totalLost: 240,
        fightsWon: 11,
        fightsLost: 9,
        winStreak: 1,
        maxWinStreak: 3,
        bestRank: 2,
        bio: 'Régulier et solide.',
      },
    }),
    prisma.user.upsert({
      where: { email: 'antoine@chadhomies.fr' },
      update: {},
      create: {
        email: 'antoine@chadhomies.fr',
        username: 'antoine',
        displayName: 'Antoine',
        passwordHash: await hash('Antoine1234!'),
        role: Role.USER,
        elo: 1771,
        totalGained: 650,
        totalLost: 280,
        fightsWon: 10,
        fightsLost: 10,
        winStreak: 0,
        maxWinStreak: 4,
        bestRank: 3,
        bio: 'Un jour je serai premier. Un jour.',
      },
    }),
    prisma.user.upsert({
      where: { email: 'maxime@chadhomies.fr' },
      update: {},
      create: {
        email: 'maxime@chadhomies.fr',
        username: 'maxime',
        displayName: 'Maxime',
        passwordHash: await hash('Maxime1234!'),
        role: Role.USER,
        elo: 1654,
        totalGained: 580,
        totalLost: 350,
        fightsWon: 9,
        fightsLost: 11,
        winStreak: 0,
        maxWinStreak: 2,
        bestRank: 4,
        bio: 'Victime préférée du groupe.',
      },
    }),
    prisma.user.upsert({
      where: { email: 'julien@chadhomies.fr' },
      update: {},
      create: {
        email: 'julien@chadhomies.fr',
        username: 'julien',
        displayName: 'Julien',
        passwordHash: await hash('Julien1234!'),
        role: Role.USER,
        elo: 1521,
        totalGained: 480,
        totalLost: 420,
        fightsWon: 8,
        fightsLost: 12,
        winStreak: 0,
        maxWinStreak: 2,
        bestRank: 5,
        bio: 'Je remonte, c\'est long mais je remonte.',
      },
    }),
    prisma.user.upsert({
      where: { email: 'baptiste@chadhomies.fr' },
      update: {},
      create: {
        email: 'baptiste@chadhomies.fr',
        username: 'baptiste',
        displayName: 'Baptiste',
        passwordHash: await hash('Baptiste1234!'),
        role: Role.USER,
        elo: 1387,
        totalGained: 350,
        totalLost: 480,
        fightsWon: 6,
        fightsLost: 14,
        winStreak: 0,
        maxWinStreak: 1,
        bestRank: 6,
        worstRank: 9,
        bio: 'Dernier ? Non, avant-dernier.',
      },
    }),
    prisma.user.upsert({
      where: { email: 'remi@chadhomies.fr' },
      update: {},
      create: {
        email: 'remi@chadhomies.fr',
        username: 'remi',
        displayName: 'Rémi',
        passwordHash: await hash('Remi1234!'),
        role: Role.USER,
        elo: 1203,
        totalGained: 250,
        totalLost: 540,
        fightsWon: 4,
        fightsLost: 16,
        winStreak: 0,
        maxWinStreak: 1,
        bestRank: 7,
        worstRank: 10,
        bio: '1000 c\'est un score, pas un objectif.',
      },
    }),
  ])

  const [admin, pierre, lucas, thomas, quentin, antoine, maxime, julien, baptiste, remi] = users
  console.log(`✓ ${users.length} utilisateurs créés`)

  // ─── Historique des points (exemples) ──────────────────────────────────────
  const now = new Date()
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000)

  await prisma.pointHistory.createMany({
    data: [
      // Pierre
      { userId: pierre.id, delta: 27, eloAfter: 1842, type: HistoryType.NEWS, reason: 'Pierre obtient son diplôme 🎓', createdAt: daysAgo(1) },
      { userId: pierre.id, delta: 9, eloAfter: 1815, type: HistoryType.FIGHT, reason: 'Victoire du Fight #3', createdAt: daysAgo(3) },
      { userId: pierre.id, delta: -4, eloAfter: 1806, type: HistoryType.FIGHT, reason: 'Défaite du Fight #2', createdAt: daysAgo(5) },
      { userId: pierre.id, delta: 18, eloAfter: 1810, type: HistoryType.NEWS, reason: 'MVP du tournoi de pétanque', createdAt: daysAgo(8) },
      // Lucas
      { userId: lucas.id, delta: -4, eloAfter: 1819, type: HistoryType.FIGHT, reason: 'Défaite du Fight #3', createdAt: daysAgo(3) },
      { userId: lucas.id, delta: 13, eloAfter: 1823, type: HistoryType.NEWS, reason: 'Organisateur du barbecue', createdAt: daysAgo(6) },
      { userId: lucas.id, delta: 9, eloAfter: 1810, type: HistoryType.FIGHT, reason: 'Victoire du Fight #2', createdAt: daysAgo(8) },
      // Thomas
      { userId: thomas.id, delta: 13, eloAfter: 1810, type: HistoryType.NEWS, reason: 'Meilleure blague du mois', createdAt: daysAgo(2) },
      { userId: thomas.id, delta: 9, eloAfter: 1797, type: HistoryType.FIGHT, reason: 'Victoire du Fight #3', createdAt: daysAgo(3) },
      // Antoine
      { userId: antoine.id, delta: -18, eloAfter: 1771, type: HistoryType.NEWS, reason: 'Retard au barbecue de 2h', createdAt: daysAgo(4) },
      { userId: antoine.id, delta: 9, eloAfter: 1789, type: HistoryType.FIGHT, reason: 'Victoire du Fight #1', createdAt: daysAgo(7) },
      // Remi
      { userId: remi.id, delta: -12, eloAfter: 1203, type: HistoryType.NEWS, reason: 'A oublié de ramener les chips', createdAt: daysAgo(2) },
      { userId: remi.id, delta: -9, eloAfter: 1215, type: HistoryType.FIGHT, reason: 'Défaite du Fight #3', createdAt: daysAgo(3) },
    ],
  })
  console.log('✓ Historique des points créé')

  // ─── News example ──────────────────────────────────────────────────────────
  const news1 = await prisma.news.create({
    data: {
      title: 'Pierre obtient son diplôme 🎓',
      content: 'Notre ami Pierre a enfin décroché son diplôme après 5 longues années d\'études. Le groupe est fier de lui ! Une performance qui mérite bien quelques points de plus dans le classement.',
      authorId: admin.id,
      status: NewsStatus.APPLIED,
      appliedAt: daysAgo(1),
      maxBonusPct: 30,
      minVotesForBonus: 5,
      createdAt: daysAgo(2),
    },
  })

  await prisma.newsParticipant.createMany({
    data: [
      { newsId: news1.id, userId: pierre.id, deltaPlanned: 15, deltaFinal: 27, reason: 'Félicitations pour le diplôme' },
      { newsId: news1.id, userId: lucas.id, deltaPlanned: -5, deltaFinal: -4, reason: 'Avait parié que Pierre n\'y arriverait pas' },
    ],
  })

  const news2 = await prisma.news.create({
    data: {
      title: 'Retard au barbecue — Antoine encore à la traîne',
      content: 'Antoine est arrivé 2 heures en retard au barbecue annuel du groupe, sans prévenir et sans apporter sa part. Le groupe tranche : moins de points.',
      authorId: admin.id,
      status: NewsStatus.APPLIED,
      appliedAt: daysAgo(4),
      maxBonusPct: 30,
      minVotesForBonus: 5,
      createdAt: daysAgo(5),
    },
  })

  await prisma.newsParticipant.create({
    data: { newsId: news2.id, userId: antoine.id, deltaPlanned: -20, deltaFinal: -18, reason: '2h de retard sans prévenir' },
  })

  const news3 = await prisma.news.create({
    data: {
      title: 'Rémi a oublié les chips 🥲',
      content: 'Pour la 3ème soirée consécutive, Rémi a oublié d\'apporter les chips alors qu\'il avait promis. Le groupe est catégorique.',
      authorId: admin.id,
      status: NewsStatus.VOTING,
      votingEndsAt: new Date(now.getTime() + 18 * 60 * 60 * 1000),
      maxBonusPct: 30,
      minVotesForBonus: 5,
      createdAt: daysAgo(1),
    },
  })

  await prisma.newsParticipant.create({
    data: { newsId: news3.id, userId: remi.id, deltaPlanned: -15, reason: 'Oubli répété des chips (3ème fois)' },
  })

  // Quelques votes sur la news en cours
  await prisma.newsVote.createMany({
    data: [
      { newsId: news3.id, userId: pierre.id, isPositive: true },
      { newsId: news3.id, userId: lucas.id, isPositive: true },
      { newsId: news3.id, userId: thomas.id, isPositive: true },
      { newsId: news3.id, userId: quentin.id, isPositive: false },
      { newsId: news3.id, userId: antoine.id, isPositive: true },
    ],
  })

  console.log('✓ News créées')

  // ─── Fight example ─────────────────────────────────────────────────────────
  const fightTeamA = [pierre, thomas, maxime, remi]
  const fightTeamB = [lucas, quentin, antoine, julien]

  const fight = await prisma.fight.create({
    data: {
      date: new Date(daysAgo(3).toISOString().split('T')[0]),
      status: FightStatus.RESOLVED,
      teamAVotes: 148,
      teamBVotes: 139,
      resolvedAt: daysAgo(2),
    },
  })

  const teamA = await prisma.fightTeam.create({ data: { fightId: fight.id, team: 'A' } })
  const teamB = await prisma.fightTeam.create({ data: { fightId: fight.id, team: 'B' } })

  await prisma.fightTeamMember.createMany({
    data: fightTeamA.map((u) => ({ fightTeamId: teamA.id, userId: u.id })),
  })
  await prisma.fightTeamMember.createMany({
    data: fightTeamB.map((u) => ({ fightTeamId: teamB.id, userId: u.id })),
  })

  // Combat actif aujourd'hui
  const fightParticipants = [pierre, lucas, thomas, quentin, antoine, maxime, julien, baptiste]
  const todayFight = await prisma.fight.create({
    data: {
      date: new Date(now.toISOString().split('T')[0]),
      status: FightStatus.ACTIVE,
      teamAVotes: 12,
      teamBVotes: 8,
    },
  })

  const todayTeamA = await prisma.fightTeam.create({ data: { fightId: todayFight.id, team: 'A' } })
  const todayTeamB = await prisma.fightTeam.create({ data: { fightId: todayFight.id, team: 'B' } })

  await prisma.fightTeamMember.createMany({
    data: fightParticipants.slice(0, 4).map((u) => ({ fightTeamId: todayTeamA.id, userId: u.id })),
  })
  await prisma.fightTeamMember.createMany({
    data: fightParticipants.slice(4).map((u) => ({ fightTeamId: todayTeamB.id, userId: u.id })),
  })

  console.log('✓ Combats créés')

  // ─── Citations ─────────────────────────────────────────────────────────────
  await prisma.quote.createMany({
    data: [
      { text: 'J\'aurais dû apporter les chips.', subjectId: remi.id, featured: true },
      { text: 'Le retard c\'est du respect inversé.', subjectId: antoine.id, featured: true },
      { text: '1er ou rien.', subjectId: pierre.id, featured: true },
      { text: 'La régularité, c\'est ma force.', subjectId: quentin.id, featured: false },
    ],
  })

  console.log('✓ Citations créées')
  console.log('\n✅ Seed terminé avec succès !\n')
  console.log('Comptes disponibles :')
  console.log('  Admin   → admin@chadhomies.fr  / Admin1234!')
  console.log('  Pierre  → pierre@chadhomies.fr / Pierre1234!')
  console.log('  Lucas   → lucas@chadhomies.fr  / Lucas1234!')
  console.log('  (etc. — même format pour les autres)\n')
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed :', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

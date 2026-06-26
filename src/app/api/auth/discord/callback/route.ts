import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildSessionCookie } from '@/lib/session'

type DiscordUser = {
  id: string
  username: string
  global_name: string | null
  avatar: string | null
  email: string | null
  verified: boolean
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const savedState = req.cookies.get('discord_oauth_state')?.value

  const appUrl = process.env.APP_URL ?? 'http://localhost:3000'

  const fail = (msg: string) => {
    console.error('[Discord OAuth]', msg)
    const res = NextResponse.redirect(`${appUrl}/login?error=oauth`)
    res.cookies.delete('discord_oauth_state')
    return res
  }

  if (!code || !state || !savedState || state !== savedState) {
    return fail(`state mismatch — code=${code} state=${state} saved=${savedState}`)
  }

  // ─── Échange code → access_token ─────────────────────────────────────────
  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${appUrl}/api/auth/discord/callback`,
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    return fail(`token exchange failed: ${err}`)
  }

  const tokenData = await tokenRes.json()
  const accessToken: string = tokenData.access_token

  // ─── Récupération du profil Discord ──────────────────────────────────────
  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!userRes.ok) {
    return fail('failed to fetch Discord user')
  }

  const discordUser: DiscordUser = await userRes.json()

  const avatarUrl = discordUser.avatar
    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
    : null

  // ─── Trouver ou créer le compte ──────────────────────────────────────────
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: 'discord',
        providerAccountId: discordUser.id,
      },
    },
    include: { user: true },
  })

  let userId: string
  let userRole: string

  if (existingAccount) {
    if (existingAccount.user.banned) {
      const res = NextResponse.redirect(`${appUrl}/login?error=banned`)
      res.cookies.delete('discord_oauth_state')
      return res
    }
    userId = existingAccount.userId
    userRole = existingAccount.user.role
    if (avatarUrl && existingAccount.user.image !== avatarUrl) {
      await prisma.user.update({ where: { id: userId }, data: { image: avatarUrl } })
    }
  } else {
    // Chercher un compte existant par email
    let user = discordUser.email
      ? await prisma.user.findUnique({ where: { email: discordUser.email } })
      : null

    if (!user) {
      // Générer un username unique
      const base = discordUser.username.toLowerCase().replace(/[^a-z0-9_-]/g, '') || `discord${discordUser.id.slice(-6)}`
      let username = base
      let suffix = 2
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${base}${suffix++}`
      }

      user = await prisma.user.create({
        data: {
          username,
          displayName: discordUser.global_name ?? discordUser.username,
          email: discordUser.email ?? undefined,
          image: avatarUrl,
        },
      })
    }

    await prisma.account.create({
      data: {
        userId: user.id,
        type: 'oauth',
        provider: 'discord',
        providerAccountId: discordUser.id,
        access_token: accessToken,
      },
    })

    userId = user.id
    userRole = user.role
  }

  const { token, cookieName, options } = await buildSessionCookie(userId, userRole as never)

  const response = NextResponse.redirect(`${appUrl}/home`)
  response.cookies.set(cookieName, token, options)
  response.cookies.delete('discord_oauth_state')
  return response
}

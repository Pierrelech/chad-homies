import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { Role } from '@prisma/client'

const COOKIE_NAME = 'chad-session'
const DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 jours

export type SessionPayload = {
  userId: string
  role: Role
  expiresAt: string
}

function secretKey() {
  const raw = process.env.AUTH_SECRET
  if (!raw) throw new Error('AUTH_SECRET manquant dans .env')
  return new TextEncoder().encode(raw)
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey())
}

export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] })
    return payload as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(userId: string, role: Role) {
  const { token, expiresAt, options } = await buildSessionCookie(userId, role)
  const store = await cookies()
  store.set(COOKIE_NAME, token, options)
  return { token, expiresAt }
}

export async function buildSessionCookie(userId: string, role: Role) {
  const expiresAt = new Date(Date.now() + DURATION_MS)
  const token = await encrypt({ userId, role, expiresAt: expiresAt.toISOString() })
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax' as const,
    path: '/',
  }
  return { token, expiresAt, cookieName: COOKIE_NAME, options }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  return decrypt(token)
}

export async function deleteSession() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

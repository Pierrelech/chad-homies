import { jwtVerify } from 'jose'

export type SessionPayload = {
  userId: string
  role: string
  expiresAt: string
}

export async function decryptToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const raw = process.env.AUTH_SECRET
    if (!raw) return null
    const key = new TextEncoder().encode(raw)
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

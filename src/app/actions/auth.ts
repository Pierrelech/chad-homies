'use server'

import { redirect } from 'next/navigation'
import crypto from 'crypto'
import * as bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/session'
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/schemas/auth'

export type ActionState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined

// ─── Connexion ────────────────────────────────────────────────────────────────

export async function loginAction(state: ActionState, formData: FormData): Promise<ActionState> {
  const validated = loginSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { username, password } = validated.data

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user?.passwordHash) {
    return { message: 'Pseudo ou mot de passe incorrect' }
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return { message: 'Email ou mot de passe incorrect' }
  }

  if (user.banned) {
    return { message: `Ton compte a été banni.${user.banReason ? ` Raison : ${user.banReason}` : ''}` }
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } })
  await createSession(user.id, user.role)
  redirect('/')
}

// ─── Inscription ──────────────────────────────────────────────────────────────

export async function registerAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validated = registerSchema.safeParse({
    username: formData.get('username'),
    displayName: formData.get('displayName'),
    email: formData.get('email') || undefined,
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { email, username, displayName, password } = validated.data
  const emailValue = email || undefined

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        ...(emailValue ? [{ email: emailValue }] : []),
      ],
    },
    select: { email: true, username: true },
  })

  if (existing) {
    return {
      message: existing.username === username ? 'Ce pseudo est déjà pris' : 'Cet email est déjà utilisé',
    }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { username, displayName, passwordHash, ...(emailValue ? { email: emailValue } : {}) },
  })

  await createSession(user.id, user.role)
  redirect('/')
}

// ─── Déconnexion ──────────────────────────────────────────────────────────────

export async function logoutAction() {
  await deleteSession()
  redirect('/login')
}

// ─── Mot de passe oublié ──────────────────────────────────────────────────────

export async function forgotPasswordAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validated = forgotPasswordSchema.safeParse({ email: formData.get('email') })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { email } = validated.data
  const successMessage = 'Si cet email existe, un lien de réinitialisation a été envoyé.'

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (!user) return { message: successMessage }

  await prisma.passwordResetToken.deleteMany({ where: { email } })

  const token = crypto.randomBytes(32).toString('hex')
  await prisma.passwordResetToken.create({
    data: { email, token, expires: new Date(Date.now() + 60 * 60 * 1000) },
  })

  // En dev : affiche le lien dans la console
  if (process.env.NODE_ENV === 'development') {
    console.warn(`\n[DEV] Lien de réinitialisation :\nhttp://localhost:3000/reset-password?token=${token}\n`)
  }

  // TODO production : envoyer l'email via nodemailer

  return { message: successMessage }
}

// ─── Réinitialisation du mot de passe ─────────────────────────────────────────

export async function resetPasswordAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validated = resetPasswordSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { token, password } = validated.data

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } })
  if (!resetToken || resetToken.expires < new Date()) {
    return { message: 'Ce lien est invalide ou expiré. Fais une nouvelle demande.' }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.update({ where: { email: resetToken.email }, data: { passwordHash } })
  await prisma.passwordResetToken.delete({ where: { token } })

  redirect('/login?reset=success')
}

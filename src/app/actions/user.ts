'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'

const profileSchema = z.object({
  displayName: z.string().min(2, 'Au moins 2 caractères').max(50, 'Max 50 caractères'),
  bio: z.string().max(300, 'Max 300 caractères').optional(),
})

export async function updateProfileAction(formData: FormData) {
  const session = await verifySession()

  const raw = {
    displayName: formData.get('displayName') as string,
    bio: (formData.get('bio') as string) || undefined,
  }

  const parsed = profileSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { displayName: parsed.data.displayName, bio: parsed.data.bio ?? null },
  })

  revalidatePath('/settings')
  revalidatePath(`/profile`)
  return { success: true }
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: z
      .string()
      .min(8, 'Au moins 8 caractères')
      .regex(/[A-Z]/, 'Au moins une majuscule')
      .regex(/[0-9]/, 'Au moins un chiffre'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export async function changePasswordAction(formData: FormData) {
  const session = await verifySession()

  const raw = {
    currentPassword: formData.get('currentPassword') as string,
    newPassword: formData.get('newPassword') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const parsed = passwordSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { passwordHash: true },
  })

  if (!user?.passwordHash) {
    return { errors: { currentPassword: ['Compte sans mot de passe'] } }
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
  if (!valid) {
    return { errors: { currentPassword: ['Mot de passe incorrect'] } }
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12)
  await prisma.user.update({
    where: { id: session.userId },
    data: { passwordHash: newHash },
  })

  return { success: true }
}

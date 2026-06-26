'use client'

import { useActionState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { loginAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FormError } from '@/components/ui/FormError'

function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined)
  const searchParams = useSearchParams()
  const resetSuccess = searchParams.get('reset') === 'success'
  const oauthError = searchParams.get('error') === 'oauth'
  const bannedError = searchParams.get('error') === 'banned'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-white/10 bg-surface-800 p-8 shadow-2xl"
    >
      <h2 className="mb-6 text-xl font-semibold text-white">Connexion</h2>

      {resetSuccess && (
        <div className="mb-4 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          ✓ Mot de passe mis à jour. Tu peux te connecter.
        </div>
      )}

      {oauthError && (
        <FormError message="Erreur lors de la connexion Discord. Réessaie." className="mb-4" />
      )}
      {bannedError && (
        <FormError message="Ton compte a été banni. Contacte un administrateur." className="mb-4" />
      )}
      {state?.message && <FormError message={state.message} className="mb-4" />}

      {/* Discord OAuth */}
      <a
        href="/api/auth/discord"
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#5865F2] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="white">
          <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69Z" />
        </svg>
        Connexion avec Discord
      </a>

      <div className="flex items-center gap-3 text-xs text-white/20">
        <div className="flex-1 border-t border-white/10" />
        ou
        <div className="flex-1 border-t border-white/10" />
      </div>

      <form action={action} className="space-y-4">
        <Input
          label="Pseudo"
          name="username"
          type="text"
          placeholder="pierre42"
          error={state?.errors?.username?.[0]}
          autoComplete="username"
          required
        />
        <div className="space-y-1.5">
          <Input
            label="Mot de passe"
            name="password"
            type="password"
            placeholder="••••••••"
            error={state?.errors?.password?.[0]}
            autoComplete="current-password"
            required
          />
        </div>

        <Button type="submit" loading={pending} size="lg" className="w-full">
          Se connecter
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-white/40">
        Pas encore de compte ?{' '}
        <Link href="/register" className="font-medium text-primary-400 hover:text-primary-300">
          S&apos;inscrire
        </Link>
      </p>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

import { getCurrentUser } from '@/lib/dal'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/settings/ProfileForm'
import { PasswordForm } from '@/components/settings/PasswordForm'

export const metadata = { title: 'Paramètres — CHAD Homies' }

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-black text-white">Paramètres</h1>

      <section className="rounded-2xl border border-white/5 bg-surface-900 p-6 space-y-5">
        <h2 className="font-semibold text-white">Profil</h2>
        <ProfileForm
          defaultDisplayName={user.displayName}
          defaultBio={user.bio ?? ''}
        />
      </section>

      <section className="rounded-2xl border border-white/5 bg-surface-900 p-6 space-y-5">
        <h2 className="font-semibold text-white">Changer le mot de passe</h2>
        <PasswordForm />
      </section>
    </div>
  )
}

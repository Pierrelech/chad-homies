import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/dal'
import { Navbar } from '@/components/layout/Navbar'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.banned) redirect('/login?error=banned')

  return (
    <div className="min-h-screen bg-surface-950">
      <Navbar user={user} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}

import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'
import { NewsCreateForm } from '@/components/admin/NewsCreateForm'

export const metadata = { title: 'Créer une news' }

export default async function NewNewsPage() {
  await verifyAdmin()

  const users = await prisma.user.findMany({
    where: { isSystem: false },
    orderBy: { displayName: 'asc' },
    select: { id: true, displayName: true, username: true, elo: true },
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-black text-white">Créer une actualité</h1>
      <NewsCreateForm users={users} />
    </div>
  )
}

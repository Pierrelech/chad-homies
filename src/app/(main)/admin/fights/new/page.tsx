import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'
import { FightCreateForm } from '@/components/admin/FightCreateForm'

export const metadata = { title: 'Créer un combat' }

export default async function NewFightPage() {
  await verifyAdmin()

  const users = await prisma.user.findMany({
    where: { isSystem: false },
    orderBy: { elo: 'desc' },
    select: { id: true, displayName: true, username: true, elo: true },
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-black text-white">Créer un combat</h1>
      <FightCreateForm users={users} />
    </div>
  )
}

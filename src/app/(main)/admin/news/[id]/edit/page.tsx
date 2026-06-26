import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/dal'
import { NewsEditForm } from '@/components/admin/NewsEditForm'

type Params = { params: Promise<{ id: string }> }

export const metadata = { title: 'Admin — Modifier une actualité' }

export default async function EditNewsPage({ params }: Params) {
  await verifyAdmin()
  const { id } = await params

  const news = await prisma.news.findUnique({
    where: { id },
    include: { participants: { include: { user: { select: { displayName: true, username: true } } } } },
  })

  if (!news || news.status === 'APPLIED') notFound()

  const users = await prisma.user.findMany({
    where: { isSystem: false },
    select: { id: true, displayName: true, username: true, elo: true },
    orderBy: { displayName: 'asc' },
  })

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-white">Modifier l&apos;actualité</h1>
      <NewsEditForm news={news} users={users} />
    </div>
  )
}

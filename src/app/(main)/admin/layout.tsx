import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/dal'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user || !['ADMIN', 'MODERATOR', 'SUPER_ADMIN'].includes(user.role)) {
    redirect('/home')
  }

  return (
    <div className="flex gap-6">
      <AdminSidebar role={user.role} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

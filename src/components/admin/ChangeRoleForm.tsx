'use client'

import { useTransition } from 'react'
import { changeUserRoleAction } from '@/app/actions/admin'

const ROLES = [
  { value: 'USER',        label: 'Membre',      color: 'text-white/60' },
  { value: 'MODERATOR',  label: 'Modérateur',  color: 'text-blue-400' },
  { value: 'ADMIN',      label: 'Admin',        color: 'text-yellow-400' },
  { value: 'SUPER_ADMIN', label: 'Super Admin', color: 'text-primary-400' },
]

export function ChangeRoleForm({ userId, currentRole, isSelf }: { userId: string; currentRole: string; isSelf: boolean }) {
  const [pending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (isSelf && e.target.value !== 'SUPER_ADMIN') {
      if (!confirm('Tu vas te retirer les droits Super Admin. Es-tu sûr ?')) {
        e.target.value = currentRole
        return
      }
    }
    const fd = new FormData()
    fd.set('userId', userId)
    fd.set('role', e.target.value)
    startTransition(async () => { await changeUserRoleAction(fd) })
  }

  return (
    <select
      defaultValue={currentRole}
      onChange={handleChange}
      disabled={pending}
      className="rounded-lg border border-white/10 bg-surface-800 px-2 py-1 text-xs font-medium text-white/70 disabled:opacity-50"
    >
      {ROLES.map((r) => (
        <option key={r.value} value={r.value}>{r.label}</option>
      ))}
    </select>
  )
}

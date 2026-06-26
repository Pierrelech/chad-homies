'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Newspaper, Sword, Users, ScrollText, Shield } from 'lucide-react'

const links = [
  { href: '/admin',        label: 'Vue d\'ensemble', icon: LayoutDashboard, exact: true },
  { href: '/admin/news',   label: 'Actualités',      icon: Newspaper },
  { href: '/admin/fights', label: 'Combats',          icon: Sword },
  { href: '/admin/users',  label: 'Joueurs',          icon: Users },
  { href: '/admin/logs',   label: 'Audit',            icon: ScrollText },
]

export function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname()

  return (
    <aside className="hidden w-52 shrink-0 lg:block">
      <div className="sticky top-24 rounded-2xl border border-white/5 bg-surface-900 p-3">
        <div className="mb-3 flex items-center gap-2 px-2 py-1">
          <Shield size={14} className="text-yellow-400" />
          <span className="text-xs font-bold text-yellow-400">
            {role === 'ADMIN' ? 'Administration' : 'Modération'}
          </span>
        </div>
        <nav className="space-y-0.5">
          {links.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href) && pathname !== '/admin'
            const isExactActive = exact && pathname === href
            const isActive = exact ? isExactActive : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-500/10 font-medium text-primary-400'
                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

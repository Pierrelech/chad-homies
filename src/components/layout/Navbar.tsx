'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, Sword, Newspaper, Bell, LogOut, Shield, Settings } from 'lucide-react'
import { logoutAction } from '@/app/actions/auth'
import type { CurrentUser } from '@/lib/dal'

type NavbarProps = { user: CurrentUser }

const navLinks = [
  { href: '/home', label: 'Accueil', icon: Trophy },
  { href: '/rankings', label: 'Classement', icon: Trophy },
  { href: '/fights', label: 'Combats', icon: Sword },
  { href: '/news', label: 'Actualités', icon: Newspaper },
]

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-surface-900/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight text-primary-400">CHAD</span>
          <span className="hidden text-sm font-medium text-white/40 sm:block">Homies</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/home' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary-500/10 text-primary-400'
                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {['ADMIN', 'MODERATOR', 'SUPER_ADMIN'].includes(user.role) ? (
            <Link
              href="/admin"
              className="hidden rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-yellow-400 sm:block"
              title="Administration"
            >
              <Shield size={18} />
            </Link>
          ) : null}

          <Link
            href="/notifications"
            className="relative rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white"
          >
            <Bell size={18} />
            {user._count.notifications > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                {user._count.notifications > 9 ? '9+' : user._count.notifications}
              </span>
            )}
          </Link>

          <Link
            href="/settings"
            className="rounded-lg p-2 text-white/30 hover:bg-white/5 hover:text-white"
            title="Paramètres"
          >
            <Settings size={18} />
          </Link>

          <Link
            href={`/profile/${user.username}`}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5"
          >
            {user.image ? (
              <img src={user.image} alt="" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500/20 text-xs font-bold text-primary-400">
                {user.displayName[0].toUpperCase()}
              </div>
            )}
            <span className="hidden text-sm font-medium text-white/80 sm:block">
              {user.displayName}
            </span>
          </Link>

          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg p-2 text-white/30 hover:bg-white/5 hover:text-danger"
              title="Se déconnecter"
            >
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="flex border-t border-white/5 md:hidden">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors ${
                active ? 'text-primary-400' : 'text-white/40'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}

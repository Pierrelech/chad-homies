import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: {
    default: 'CHAD Homies Rankings',
    template: '%s | CHAD Homies',
  },
  description: 'Le classement officiel des CHAD Homies — combats, news et ELO.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-surface-900 text-white antialiased">{children}</body>
    </html>
  )
}

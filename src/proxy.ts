import { type NextRequest, NextResponse } from 'next/server'
import { decryptToken } from '@/lib/auth-edge'

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/api/auth/discord', '/api/cron', '/uploads']
const ADMIN_PATHS = ['/admin']

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const token = req.cookies.get('chad-session')?.value
  const session = await decryptToken(token)

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p))
  const isAuthenticated = !!session?.userId

  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL('/home', req.nextUrl))
  }

  // Redirect root / to /home
  if (isAuthenticated && pathname === '/') {
    return NextResponse.redirect(new URL('/home', req.nextUrl))
  }

  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = new URL('/login', req.nextUrl)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Le contrôle fin du rôle admin est fait côté serveur dans verifyAdmin()
  // Le proxy vérifie uniquement l'authentification

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}

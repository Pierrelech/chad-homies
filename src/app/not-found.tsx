import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-950 px-4 text-center">
      <p className="text-8xl font-black text-primary-500/20">404</p>
      <h1 className="mt-4 text-2xl font-bold text-white">Page introuvable</h1>
      <p className="mt-2 text-sm text-white/40">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/home"
        className="mt-8 rounded-xl bg-primary-500/10 px-6 py-3 text-sm font-semibold text-primary-400 hover:bg-primary-500/20"
      >
        ← Retour à l&apos;accueil
      </Link>
    </div>
  )
}

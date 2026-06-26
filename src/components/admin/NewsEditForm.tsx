'use client'

import { useState, useTransition, useRef } from 'react'
import { updateNewsAction } from '@/app/actions/admin'
import { ImagePlus, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type News = {
  id: string
  title: string
  content: string
  imageUrl: string | null
  votingEndsAt: Date | null
  status: string
  participants: Array<{
    id: string
    deltaPlanned: number
    reason: string
    user: { displayName: string; username: string }
  }>
}

type User = { id: string; displayName: string; username: string; elo: number }

export function NewsEditForm({ news, users }: { news: News; users: User[] }) {
  const [pending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [imageUrl, setImageUrl] = useState<string | null>(news.imageUrl)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const votingEndsAtValue = news.votingEndsAt
    ? new Date(news.votingEndsAt).toISOString().slice(0, 16)
    : ''

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) setImageUrl(data.url)
      else setErrors((err) => ({ ...err, image: [data.error ?? 'Erreur upload'] }))
    } finally {
      setUploading(false)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('newsId', news.id)
    if (imageUrl) fd.set('imageUrl', imageUrl)
    startTransition(async () => {
      const res = await updateNewsAction(fd)
      if (res?.errors) setErrors(res.errors as Record<string, string[]>)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-white/5 bg-surface-900 p-5 space-y-4">
        <Input
          label="Titre"
          name="title"
          defaultValue={news.title}
          error={errors.title?.[0]}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-white/70">Contenu</label>
          <textarea
            name="content"
            defaultValue={news.content}
            rows={6}
            className="w-full rounded-xl border border-white/10 bg-surface-800 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-primary-500/50 focus:outline-none"
            required
          />
          {errors.content && <p className="text-xs text-danger">{errors.content[0]}</p>}
        </div>

        <Input
          label="Fin du vote (optionnel)"
          name="votingEndsAt"
          type="datetime-local"
          defaultValue={votingEndsAtValue}
        />

        {/* Image */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/70">Image (optionnel)</label>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          {imageUrl ? (
            <div className="relative w-full overflow-hidden rounded-xl border border-white/10">
              <img src={imageUrl} alt="" className="max-h-48 w-full object-cover" />
              <button
                type="button"
                onClick={() => { setImageUrl(null); if (fileRef.current) fileRef.current.value = '' }}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/80"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-8 text-sm text-white/40 hover:border-white/20 hover:text-white/60 disabled:opacity-50"
            >
              <ImagePlus size={18} />
              {uploading ? 'Upload en cours...' : 'Cliquer pour ajouter une image'}
            </button>
          )}
          {errors.image && <p className="text-xs text-danger">{errors.image[0]}</p>}
        </div>
      </div>

      {/* Participants en lecture seule */}
      {news.participants.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-surface-900 p-5">
          <h2 className="mb-3 font-semibold text-white">Participants</h2>
          <p className="mb-3 text-xs text-white/30">Les participants ne peuvent pas être modifiés après création.</p>
          <div className="space-y-2">
            {news.participants.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-white/5 px-4 py-2.5 text-sm">
                <span className="text-white/70">{p.user.displayName}</span>
                <div className="flex items-center gap-4 text-xs text-white/40">
                  <span className={p.deltaPlanned >= 0 ? 'text-success' : 'text-danger'}>
                    {p.deltaPlanned >= 0 ? '+' : ''}{p.deltaPlanned} aura
                  </span>
                  <span>{p.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button type="submit" loading={pending} size="lg" className="w-full">
        Enregistrer les modifications
      </Button>
    </form>
  )
}

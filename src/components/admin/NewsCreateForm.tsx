'use client'

import { useState, useTransition, useRef } from 'react'
import { createNewsAction } from '@/app/actions/admin'
import { Plus, Trash2, ImagePlus, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type User = { id: string; displayName: string; username: string; elo: number }
type Participant = { userId: string; deltaPlanned: number | string; reason: string }

export function NewsCreateForm({ users }: { users: User[] }) {
  const [pending, startTransition] = useTransition()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

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

  function addParticipant() {
    setParticipants((p) => [...p, { userId: users[0]?.id ?? '', deltaPlanned: 10, reason: '' }])
  }

  function removeParticipant(i: number) {
    setParticipants((p) => p.filter((_, idx) => idx !== i))
  }

  function updateParticipant(i: number, field: keyof Participant, value: string | number) {
    setParticipants((p) => p.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const parsed = participants.map((p) => ({
      ...p,
      deltaPlanned: typeof p.deltaPlanned === 'string' ? (parseInt(p.deltaPlanned) || 0) : p.deltaPlanned,
    }))
    fd.set('participants', JSON.stringify(parsed))
    if (imageUrl) fd.set('imageUrl', imageUrl)
    startTransition(async () => {
      const res = await createNewsAction(fd)
      if (res?.errors) setErrors(res.errors as Record<string, string[]>)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-white/5 bg-surface-900 p-5 space-y-4">
        <Input
          label="Titre"
          name="title"
          placeholder="Pierre a enfin obtenu son diplôme 🎓"
          error={errors.title?.[0]}
          required
        />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-white/70">Contenu</label>
          <textarea
            name="content"
            rows={5}
            placeholder="Décris l'événement en détail..."
            className="w-full rounded-xl border border-white/10 bg-surface-800 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-primary-500/50 focus:outline-none"
            required
          />
          {errors.content && <p className="text-xs text-danger">{errors.content[0]}</p>}
        </div>
        <Input
          label="Fin du vote (optionnel)"
          name="votingEndsAt"
          type="datetime-local"
        />

        {/* Image upload */}
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
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-8 text-sm text-white/40 transition-colors hover:border-white/20 hover:text-white/60 disabled:opacity-50"
            >
              <ImagePlus size={18} />
              {uploading ? 'Upload en cours...' : 'Cliquer pour ajouter une image'}
            </button>
          )}
          {errors.image && <p className="text-xs text-danger">{errors.image[0]}</p>}
        </div>
      </div>

      {/* Participants */}
      <div className="rounded-2xl border border-white/5 bg-surface-900 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">Personnes concernées</h2>
          <button
            type="button"
            onClick={addParticipant}
            className="flex items-center gap-1.5 rounded-lg bg-surface-700 px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-surface-600"
          >
            <Plus size={13} /> Ajouter
          </button>
        </div>

        {participants.length === 0 ? (
          <p className="text-sm text-white/30">Aucun participant — clique sur Ajouter.</p>
        ) : (
          <div className="space-y-3">
            {participants.map((p, i) => (
              <div key={i} className="flex flex-wrap items-end gap-3 rounded-xl border border-white/5 p-3">
                {/* Joueur */}
                <div className="flex-1 min-w-32">
                  <label className="mb-1 block text-xs text-white/50">Joueur</label>
                  <select
                    value={p.userId}
                    onChange={(e) => updateParticipant(i, 'userId', e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-surface-800 px-3 py-2 text-sm text-white"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.displayName} ({u.elo} ELO)
                      </option>
                    ))}
                  </select>
                </div>
                {/* Aura */}
                <div className="w-28">
                  <label className="mb-1 block text-xs text-white/50">Aura (±)</label>
                  <input
                    type="number"
                    value={p.deltaPlanned}
                    onChange={(e) => {
                      const raw = e.target.value
                      if (raw === '' || raw === '-') {
                        updateParticipant(i, 'deltaPlanned', raw)
                      } else {
                        const n = parseInt(raw)
                        if (!isNaN(n)) updateParticipant(i, 'deltaPlanned', n)
                      }
                    }}
                    className="w-full rounded-lg border border-white/10 bg-surface-800 px-3 py-2 text-sm text-white"
                  />
                </div>
                {/* Raison */}
                <div className="flex-1 min-w-40">
                  <label className="mb-1 block text-xs text-white/50">Raison</label>
                  <input
                    type="text"
                    value={p.reason}
                    onChange={(e) => updateParticipant(i, 'reason', e.target.value)}
                    placeholder="Pourquoi ce joueur est concerné"
                    className="w-full rounded-lg border border-white/10 bg-surface-800 px-3 py-2 text-sm text-white placeholder:text-white/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeParticipant(i)}
                  className="rounded-lg p-2 text-danger/50 hover:text-danger"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" loading={pending} size="lg" className="w-full">
        Publier et ouvrir le vote
      </Button>
    </form>
  )
}

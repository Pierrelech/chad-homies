'use client'

import { useState, useTransition } from 'react'
import { updateProfileAction } from '@/app/actions/user'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function ProfileForm({
  defaultDisplayName,
  defaultBio,
}: {
  defaultDisplayName: string
  defaultBio: string
}) {
  const [pending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSuccess(false)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateProfileAction(fd)
      if (res?.errors) {
        setErrors(res.errors as Record<string, string[]>)
      } else {
        setErrors({})
        setSuccess(true)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nom affiché"
        name="displayName"
        defaultValue={defaultDisplayName}
        error={errors.displayName?.[0]}
        required
      />
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-white/70">Bio (optionnel)</label>
        <textarea
          name="bio"
          defaultValue={defaultBio}
          rows={3}
          maxLength={300}
          placeholder="Quelques mots sur toi..."
          className="w-full rounded-xl border border-white/10 bg-surface-800 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-primary-500/50 focus:outline-none"
        />
        {errors.bio && <p className="text-xs text-danger">{errors.bio[0]}</p>}
      </div>
      {success && <p className="text-sm text-success">Profil mis à jour ✓</p>}
      <Button type="submit" loading={pending}>
        Enregistrer
      </Button>
    </form>
  )
}

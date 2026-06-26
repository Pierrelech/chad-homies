'use client'

import { useState, useTransition, useRef } from 'react'
import { changePasswordAction } from '@/app/actions/user'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function PasswordForm() {
  const [pending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [success, setSuccess] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSuccess(false)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await changePasswordAction(fd)
      if (res?.errors) {
        setErrors(res.errors as Record<string, string[]>)
      } else {
        setErrors({})
        setSuccess(true)
        formRef.current?.reset()
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Mot de passe actuel"
        name="currentPassword"
        type="password"
        error={errors.currentPassword?.[0]}
        required
      />
      <Input
        label="Nouveau mot de passe"
        name="newPassword"
        type="password"
        error={errors.newPassword?.[0]}
        required
      />
      <Input
        label="Confirmer le nouveau mot de passe"
        name="confirmPassword"
        type="password"
        error={errors.confirmPassword?.[0]}
        required
      />
      {success && <p className="text-sm text-success">Mot de passe changé ✓</p>}
      <Button type="submit" loading={pending}>
        Changer le mot de passe
      </Button>
    </form>
  )
}

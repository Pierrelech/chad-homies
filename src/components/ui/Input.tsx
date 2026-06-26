'use client'

import { type InputHTMLAttributes, useId } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, ...props }: InputProps) {
  const id = useId()

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-white/70">
          {label}
        </label>
      )}
      <input
        id={id}
        {...props}
        className={clsx(
          'w-full rounded-xl border bg-surface-700 px-4 py-2.5 text-sm text-white',
          'placeholder:text-white/25 transition-all duration-150',
          'focus:outline-none focus:ring-2',
          error
            ? 'border-danger/50 focus:ring-danger/20 focus:border-danger/70'
            : 'border-white/10 hover:border-white/20 focus:border-primary-500/50 focus:ring-primary-500/20',
          className
        )}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-white/40">{hint}</p>}
    </div>
  )
}

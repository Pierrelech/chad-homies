import { clsx } from 'clsx'
import { AlertCircle } from 'lucide-react'

interface FormErrorProps {
  message: string
  className?: string
}

export function FormError({ message, className }: FormErrorProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger',
        className
      )}
    >
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

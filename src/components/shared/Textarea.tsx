import { type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function Textarea({ label, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
          {label}
        </label>
      )}
      <textarea
        className={`px-3 py-2 rounded-lg border border-border bg-card text-text-primary dark:border-border-dark dark:bg-card-dark dark:text-text-primary-dark placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none ${className}`}
        rows={3}
        {...props}
      />
    </div>
  )
}
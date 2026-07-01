import { useEffect, useRef } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Focus trap: focus the confirm button when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to let the modal render
      const timer = setTimeout(() => {
        confirmRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Focus trap: prevent tab from leaving the modal
  useEffect(() => {
    if (!isOpen) return

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const confirmEl = confirmRef.current
      const cancelEl = cancelRef.current
      if (!confirmEl || !cancelEl) return

      if (e.shiftKey) {
        // Shift+Tab: if focus is on cancel, jump to confirm
        if (document.activeElement === cancelEl) {
          e.preventDefault()
          confirmEl.focus()
        }
      } else {
        // Tab: if focus is on confirm, jump to cancel
        if (document.activeElement === confirmEl) {
          e.preventDefault()
          cancelEl.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [isOpen])

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">{message}</p>
        <div className="flex justify-end gap-2">
          <Button
            ref={cancelRef}
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            variant={variant}
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
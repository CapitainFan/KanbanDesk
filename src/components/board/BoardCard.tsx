import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Board } from '../../types'
import { deleteBoard } from '../../services/boardService'
import { Button } from '../shared/Button'
import { ConfirmModal } from '../shared/ConfirmModal'
import toast from 'react-hot-toast'

interface BoardCardProps {
  board: Board
  onDelete: (id: string) => void
}

export function BoardCard({ board, onDelete }: BoardCardProps) {
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteBoard(board.id)
      onDelete(board.id)
      toast.success('Board deleted')
    } catch (e) {
      console.error('Failed to delete board:', e)
      toast.error('Failed to delete board')
    } finally {
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <div
        onClick={() => navigate(`/board/${board.id}`)}
        className="bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-blue-500/50 transition-all group"
      >
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-text-primary dark:text-text-primary-dark">
            {board.title}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setShowConfirm(true) }}
            disabled={deleting}
            className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          >
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
        <p className="text-xs text-text-secondary mt-2">
          Created {new Date(board.created_at).toLocaleDateString()}
        </p>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title="Delete board?"
        message={`Delete "${board.title}" permanently?`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        isLoading={deleting}
      />
    </>
  )
}
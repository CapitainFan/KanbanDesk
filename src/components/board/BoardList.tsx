import { useEffect, useState } from 'react'
import { useAuthContext } from '../../providers/AuthProvider'
import { useAppDispatch, useAppSelector } from '../../hooks/useAppStore'
import { setBoards, addBoard, removeBoard, setLoading } from '../../store/boardSlice'
import { getBoards, createBoard } from '../../services/boardService'
import { BoardCard } from './BoardCard'
import { Button } from '../shared/Button'
import { PageLoader } from '../shared/Spinner'
import toast from 'react-hot-toast'

export function BoardList() {
  const dispatch = useAppDispatch()
  const { user } = useAuthContext()
  const { boards, isLoading } = useAppSelector((state) => state.board)
  const [title, setTitle] = useState('')

  useEffect(() => {
    if (!user) return
    dispatch(setLoading(true))
    getBoards(user.id)
      .then((data) => dispatch(setBoards(data)))
      .catch(() => toast.error('Failed to load boards'))
      .finally(() => dispatch(setLoading(false)))
  }, [user, dispatch])

  const handleCreate = async () => {
    if (!title.trim() || !user) return
    try {
      const board = await createBoard(title.trim(), user.id)
      dispatch(addBoard(board))
      setTitle('')
      toast.success('Board created!')
    } catch {
      toast.error('Failed to create board')
    }
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="New board title..."
          className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-card text-text-primary dark:border-border-dark dark:bg-card-dark dark:text-text-primary-dark placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button onClick={handleCreate} disabled={!title.trim()}>
          Create Board
        </Button>
      </div>

      {boards.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-secondary text-lg">No boards yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onDelete={(id) => dispatch(removeBoard(id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
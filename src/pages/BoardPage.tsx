import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Layout } from '../components/shared/Layout'
import { BoardView } from '../components/board/BoardView'
import { TaskModal } from '../components/task/TaskModal'
import { MemberManagement } from '../components/board/MemberManagement'
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore'
import { setCurrentBoard } from '../store/boardSlice'

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const dispatch = useAppDispatch()
  const currentBoard = useAppSelector((s) =>
    s.board.boards.find((b) => b.id === boardId)
  )

  useEffect(() => {
    if (currentBoard) dispatch(setCurrentBoard(currentBoard))
    return () => { dispatch(setCurrentBoard(null)) }
  }, [currentBoard, dispatch])

  if (!boardId) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <p className="text-text-secondary">Board not found</p>
          <Link to="/dashboard" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to boards
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100dvh-3.5rem)]">
        <div className="px-4 py-2 border-b border-border dark:border-border-dark bg-card dark:bg-card-dark">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Link to="/dashboard" className="text-text-secondary hover:text-blue-600 transition-colors">
                Boards
              </Link>
              <span className="text-text-secondary">/</span>
              <span className="font-medium text-text-primary dark:text-text-primary-dark">
                {currentBoard?.title ?? 'Loading...'}
              </span>
            </div>
            <MemberManagement />
          </div>
        </div>
        <BoardView boardId={boardId} />
      </div>
      <TaskModal />
    </Layout>
  )
}
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Layout } from '../components/shared/Layout'
import { BoardView } from '../components/board/BoardView'
import { TaskModal } from '../components/task/TaskModal'
import { MemberManagement } from '../components/board/MemberManagement'
import { useAppDispatch } from '../hooks/useAppStore'
import { setCurrentBoard } from '../store/boardSlice'
import { Button } from '../components/shared/Button'

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const dispatch = useAppDispatch()
  const [boardTitle, setBoardTitle] = useState<string | null>(null)
  const [showMembers, setShowMembers] = useState(false)

  useEffect(() => {
    if (!boardId) return
    setBoardTitle(null)
    ;(async () => {
      const { data } = await supabase
        .from('boards')
        .select('title')
        .eq('id', boardId)
        .single()
      if (data) {
        setBoardTitle(data.title)
        dispatch(setCurrentBoard({ id: boardId, title: data.title } as never))
      }
    })()
    return () => { dispatch(setCurrentBoard(null)) }
  }, [boardId, dispatch])

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
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 text-sm sm:text-base">
              <Link to="/dashboard" className="text-text-secondary hover:text-blue-600 transition-colors whitespace-nowrap">
                Boards
              </Link>
              <span className="text-text-secondary shrink-0">/</span>
              <span className="font-medium text-text-primary dark:text-text-primary-dark truncate">
                {boardTitle ?? 'Board'}
              </span>
            </div>
            <div className="hidden md:block">
              <MemberManagement />
            </div>
            <Button variant="ghost" size="sm" className="md:hidden shrink-0" onClick={() => setShowMembers(!showMembers)}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </Button>
          </div>
          {showMembers && (
            <div className="md:hidden mt-2 pt-2 border-t border-border dark:border-border-dark">
              <MemberManagement />
            </div>
          )}
        </div>
        <BoardView boardId={boardId} />
      </div>
      <TaskModal />
    </Layout>
  )
}
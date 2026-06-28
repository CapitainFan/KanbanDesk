import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Layout } from '../components/shared/Layout'
import { BoardView } from '../components/board/BoardView'
import { TaskModal } from '../components/task/TaskModal'
import { MemberManagement } from '../components/board/MemberManagement'
import { useAppDispatch } from '../hooks/useAppStore'
import { setCurrentBoard } from '../store/boardSlice'

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const dispatch = useAppDispatch()
  const [boardTitle, setBoardTitle] = useState<string | null>(null)

  // Fetch board title directly (works even after page refresh when store is empty)
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Link to="/dashboard" className="text-text-secondary hover:text-blue-600 transition-colors">
                Boards
              </Link>
              <span className="text-text-secondary">/</span>
              <span className="font-medium text-text-primary dark:text-text-primary-dark">
                {boardTitle ?? 'Board'}
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
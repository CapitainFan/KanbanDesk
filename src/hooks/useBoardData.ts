import { useEffect } from 'react'
import { getColumns } from '../services/columnService'
import { getTasks } from '../services/taskService'
import { getBoardMembers } from '../services/boardService'
import { useAppDispatch } from './useAppStore'
import toast from 'react-hot-toast'
import {
  setColumns,
  setTasks,
  setMembers,
  setLoading,
} from '../store/boardSlice'

export function useBoardData(boardId: string) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    let cancelled = false
    dispatch(setLoading(true))

    const loadData = async () => {
      try {
        const [cols, members] = await Promise.all([
          getColumns(boardId),
          getBoardMembers(boardId),
        ])
        if (cancelled) return
        dispatch(setColumns(cols))
        dispatch(setMembers(members))

        if (cols.length > 0) {
          const colIds = cols.map((c) => c.id)
          const tasks = await getTasks(colIds)
          if (cancelled) return

          const grouped: Record<string, import('../types').Task[]> = {}
          for (const col of cols) grouped[col.id] = []
          for (const t of tasks) {
            if (!grouped[t.column_id]) grouped[t.column_id] = []
            grouped[t.column_id].push(t)
          }
          for (const colId of colIds) {
            dispatch(setTasks({ columnId: colId, tasks: grouped[colId] ?? [] }))
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error('Failed to load board data:', e)
          toast.error('Failed to load board data')
        }
      } finally {
        if (!cancelled) dispatch(setLoading(false))
      }
    }

    loadData()

    return () => { cancelled = true }
  }, [boardId, dispatch])
}
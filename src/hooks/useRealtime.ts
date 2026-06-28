import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAppDispatch, useAppSelector } from './useAppStore'
import {
  addTask,
  updateTaskInState,
  removeTask,
  addColumn,
  updateColumnInState,
  removeColumn,
} from '../store/boardSlice'
import type { Task, Column } from '../types'

export function useRealtime(boardId: string | null) {
  const dispatch = useAppDispatch()
  const columnIdsRef = useRef<string[]>([])
  const columns = useAppSelector((s) => s.board.columns)

  // Keep column IDs ref updated
  useEffect(() => {
    columnIdsRef.current = columns.map((c) => c.id)
  }, [columns])

  useEffect(() => {
    if (!boardId) return

    const channel = supabase.channel(`board-${boardId}`)

    // Subscribe to ALL tasks changes — filter by column_id client-side
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          const task = payload.new as Task
          const oldTask = payload.old as Task | undefined
          const colIds = columnIdsRef.current

          // Skip if task doesn't belong to this board's columns
          if (payload.eventType !== 'DELETE' && !colIds.includes(task.column_id)) return
          if (payload.eventType === 'DELETE' && oldTask && !colIds.includes(oldTask.column_id)) return

          if (payload.eventType === 'INSERT') {
            dispatch(addTask(task))
          } else if (payload.eventType === 'UPDATE') {
            dispatch(updateTaskInState(task))
          } else if (payload.eventType === 'DELETE' && oldTask) {
            dispatch(removeTask({ taskId: oldTask.id, columnId: oldTask.column_id }))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'columns',
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          const column = payload.new as Column
          const oldColumn = payload.old as Column | undefined

          if (payload.eventType === 'INSERT') {
            dispatch(addColumn(column))
          } else if (payload.eventType === 'UPDATE') {
            dispatch(updateColumnInState(column))
          } else if (payload.eventType === 'DELETE' && oldColumn) {
            dispatch(removeColumn(oldColumn.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [boardId, dispatch])
}
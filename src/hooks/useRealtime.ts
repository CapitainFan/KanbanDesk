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
  const tasksRef = useRef<Record<string, Task[]>>({})
  const tasks = useAppSelector((s) => s.board.tasks)

  useEffect(() => {
    columnIdsRef.current = columns.map((c) => c.id)
  }, [columns])

  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  useEffect(() => {
    if (!boardId) return

    const channel = supabase.channel(`board-${boardId}`)

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
      },
      (payload) => {
        const task = payload.new as Task
        const oldTask = payload.old as Task | undefined
        const currentColIds = columnIdsRef.current

        if (payload.eventType === 'DELETE' && oldTask) {
          if (!currentColIds.includes(oldTask.column_id)) return
          dispatch(removeTask({ taskId: oldTask.id, columnId: oldTask.column_id }))
          return
        }

        if (payload.eventType === 'INSERT') {
          if (!currentColIds.includes(task.column_id)) return
          const allTasks = Object.values(tasksRef.current).flat()
          if (allTasks.some((t) => t.id === task.id)) return
          dispatch(addTask(task))
          return
        }

        if (payload.eventType === 'UPDATE') {
          if (oldTask && currentColIds.includes(oldTask.column_id) && !currentColIds.includes(task.column_id)) {
            dispatch(removeTask({ taskId: task.id, columnId: oldTask.column_id }))
            return
          }
          if (oldTask && oldTask.column_id !== task.column_id) {
            dispatch(removeTask({ taskId: task.id, columnId: oldTask.column_id }))
          }
          if (currentColIds.includes(task.column_id)) {
            dispatch(updateTaskInState(task))
          }
        }
      }
    )

    channel.on(
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

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [boardId, dispatch])
}

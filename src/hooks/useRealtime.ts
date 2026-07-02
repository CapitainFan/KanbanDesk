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
import type { Profile } from '../types/profile'

async function enrichAssignee(task: Task): Promise<Task> {
  if (!task.assignee_id) return { ...task, assignee: null }
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', task.assignee_id)
    .single()
  return { ...task, assignee: (profile as Profile | null) ?? null }
}

export function useRealtime(boardId: string | null) {
  const dispatch = useAppDispatch()
  const columns = useAppSelector((s) => s.board.columns)
  const tasksRef = useRef<Record<string, Task[]>>({})
  const tasks = useAppSelector((s) => s.board.tasks)

  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  useEffect(() => {
    if (!boardId) return

    const columnIds = columns.map((c) => c.id)
    if (columnIds.length === 0) return

    const channel = supabase.channel(`board-${boardId}-${Date.now()}`)

    // Server-side filter on column IDs — reduces unnecessary events
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `column_id=in.(${columnIds.join(',')})`,
      },
      async (payload) => {
        const rawTask = payload.new as Task
        const oldTask = payload.old as Task | undefined
        const currentColIds = columnIds

        if (payload.eventType === 'DELETE' && oldTask) {
          if (!currentColIds.includes(oldTask.column_id)) return
          dispatch(removeTask({ taskId: oldTask.id, columnId: oldTask.column_id }))
          return
        }

        if (payload.eventType === 'INSERT') {
          const allTasks = Object.values(tasksRef.current).flat()
          if (allTasks.some((t) => t.id === rawTask.id)) return
          if (!tasksRef.current[rawTask.column_id]) return
          const enriched = await enrichAssignee(rawTask)
          dispatch(addTask(enriched))
          return
        }

        if (payload.eventType === 'UPDATE') {
          // Enrich with assignee profile before dispatching
          const enriched = await enrichAssignee(rawTask)

          if (oldTask && currentColIds.includes(oldTask.column_id) && !currentColIds.includes(enriched.column_id)) {
            dispatch(removeTask({ taskId: enriched.id, columnId: oldTask.column_id }))
            return
          }
          if (oldTask && oldTask.column_id !== enriched.column_id) {
            dispatch(removeTask({ taskId: enriched.id, columnId: oldTask.column_id }))
          }
          if (currentColIds.includes(enriched.column_id)) {
            dispatch(updateTaskInState(enriched))
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
  }, [boardId, dispatch, columns])
}
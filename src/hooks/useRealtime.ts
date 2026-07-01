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
  const boardIdRef = useRef<string | null>(null)

  // Keep column IDs and tasks ref updated
  useEffect(() => {
    columnIdsRef.current = columns.map((c) => c.id)
  }, [columns])

  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  useEffect(() => {
    boardIdRef.current = boardId
  }, [boardId])

  useEffect(() => {
    if (!boardId) return

    // Get current column IDs at subscription time for server-side filter
    const colIds = columnIdsRef.current

    const channel = supabase.channel(`board-${boardId}`)

    // For tasks, use server-side filter with current column IDs
    // When columns change, the hook will re-run and create a new subscription
    if (colIds.length > 0) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `column_id=in.(${colIds.join(',')})`,
        },
        (payload) => {
          const task = payload.new as Task
          const oldTask = payload.old as Task | undefined

          if (payload.eventType === 'INSERT') {
            // Deduplicate: check if task already exists in any column
            const allTasks = Object.values(tasksRef.current).flat()
            if (allTasks.some((t) => t.id === task.id)) return
            dispatch(addTask(task))
          } else if (payload.eventType === 'UPDATE') {
            // Handle cross-column move: remove from old column if column_id changed
            if (oldTask && oldTask.column_id !== task.column_id) {
              // Check if the new column belongs to this board
              if (!colIds.includes(task.column_id)) {
                // Task was moved to a column outside this board - remove it
                dispatch(removeTask({ taskId: task.id, columnId: oldTask.column_id }))
                return
              }
              dispatch(removeTask({ taskId: task.id, columnId: oldTask.column_id }))
            }
            dispatch(updateTaskInState(task))
          } else if (payload.eventType === 'DELETE' && oldTask) {
            dispatch(removeTask({ taskId: oldTask.id, columnId: oldTask.column_id }))
          }
        }
      )
    } else {
      // Fallback: subscribe to all tasks and filter on client
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
          const colIds = columnIdsRef.current

          // Skip if task doesn't belong to this board's columns
          if (payload.eventType !== 'DELETE' && !colIds.includes(task.column_id)) return
          if (payload.eventType === 'DELETE' && oldTask && !colIds.includes(oldTask.column_id)) return

          if (payload.eventType === 'INSERT') {
            const allTasks = Object.values(tasksRef.current).flat()
            if (allTasks.some((t) => t.id === task.id)) return
            dispatch(addTask(task))
          } else if (payload.eventType === 'UPDATE') {
            if (oldTask && oldTask.column_id !== task.column_id) {
              dispatch(removeTask({ taskId: task.id, columnId: oldTask.column_id }))
            }
            dispatch(updateTaskInState(task))
          } else if (payload.eventType === 'DELETE' && oldTask) {
            dispatch(removeTask({ taskId: oldTask.id, columnId: oldTask.column_id }))
          }
        }
      )
    }

    channel
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
    // Re-subscribe when columns change to update server-side filter
  }, [boardId, dispatch, columns.length])
}
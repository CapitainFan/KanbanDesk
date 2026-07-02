import { useCallback, useRef, useState } from 'react'
import type { Task } from '../types'
import { useAppDispatch } from './useAppStore'
import { moveTaskInState, setTasks } from '../store/boardSlice'
import { reorderTasks } from '../services/taskService'
import toast from 'react-hot-toast'

export function useTaskDnD(tasks: Record<string, Task[]>) {
  const dispatch = useAppDispatch()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const previousTasksRef = useRef<Record<string, Task[]> | null>(null)

  const findTaskColumn = useCallback(
    (taskId: string): string | undefined => {
      for (const [colId, ts] of Object.entries(tasks)) {
        if (ts.some((t) => t.id === taskId)) return colId
      }
      return undefined
    },
    [tasks]
  )

  const handleDragStart = useCallback(
    (event: { active: { data: { current: unknown } } }) => {
      const task = (event.active.data.current as { task?: Task })?.task ?? null
      setActiveTask(task as Task | null)
    },
    []
  )

  const handleDragEnd = useCallback(
    async (event: { active: { id: unknown }; over: { id: unknown; data: { current: unknown } } | null }) => {
      setActiveTask(null)
      const { active, over } = event
      if (!over || active.id === over.id) return

      const taskId = active.id as string
      const overId = over.id as string

      const activeColId = findTaskColumn(taskId)
      const overColId =
        (over.data.current as { type?: string })?.type === 'column'
          ? overId
          : findTaskColumn(overId)
      if (!activeColId || !overColId) return

      const sourceTasks = tasks[activeColId] ?? []
      const destTasks = tasks[overColId] ?? []

      const overIndex =
        (over.data.current as { type?: string })?.type === 'column'
          ? destTasks.length
          : destTasks.findIndex((t) => t.id === overId)
      const insertIndex = overIndex < 0 ? destTasks.length : overIndex

      previousTasksRef.current = structuredClone(tasks)

      dispatch(
        moveTaskInState({
          taskId,
          fromColumnId: activeColId,
          toColumnId: overColId,
          newPosition: insertIndex,
        })
      )

      const tasksToReorder: { id: string; position: number; column_id?: string }[] = []

      if (activeColId === overColId) {
        const allTasks = sourceTasks.filter((t) => t.id !== taskId)
        const movedTask = sourceTasks.find((t) => t.id === taskId)
        if (!movedTask) return
        allTasks.splice(insertIndex, 0, movedTask)
        allTasks.forEach((t, i) => tasksToReorder.push({ id: t.id, position: i }))
      } else {
        const srcRemaining = sourceTasks.filter((t) => t.id !== taskId)
        const dstRemaining = destTasks.filter((t) => t.id !== taskId)
        const movedTask = sourceTasks.find((t) => t.id === taskId)
        if (!movedTask) return

        const newDest = [...dstRemaining]
        newDest.splice(insertIndex, 0, movedTask)

        srcRemaining.forEach((t, i) => tasksToReorder.push({ id: t.id, position: i, column_id: activeColId }))
        newDest.forEach((t, i) => tasksToReorder.push({ id: t.id, position: i, column_id: overColId }))
      }

      try {
        await reorderTasks(tasksToReorder)
      } catch (e) {
        console.error('Drag error:', e)
        toast.error('Move failed: ' + (e instanceof Error ? e.message : 'unknown'))
        
        if (previousTasksRef.current) {
          for (const [colId, ts] of Object.entries(previousTasksRef.current)) {
            dispatch(setTasks({ columnId: colId, tasks: ts }))
          }
        }
      }
    },
    [tasks, findTaskColumn, dispatch]
  )

  return { activeTask, handleDragStart, handleDragEnd }
}
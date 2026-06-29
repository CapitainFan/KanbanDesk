import { useEffect, useState, useCallback } from 'react'
import {
  DndContext, DragOverlay, closestCorners,
  type DragStartEvent, type DragEndEvent,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import type { Task } from '../../types'
import { getColumns, createColumn, deleteColumn, updateColumn } from '../../services/columnService'
import { getTasks, createTask, moveTask } from '../../services/taskService'
import { getBoardMembers } from '../../services/boardService'
import { useAppDispatch, useAppSelector } from '../../hooks/useAppStore'
import {
  setColumns, addColumn, removeColumn, setTasks, addTask,
  setMembers, setLoading, moveTaskInState,
} from '../../store/boardSlice'
import { openTaskModal } from '../../store/uiSlice'
import { useRealtime } from '../../hooks/useRealtime'
import { useAuthContext } from '../../providers/AuthProvider'
import { Column } from './Column'
import { TaskCard } from './TaskCard'
import { Button } from '../shared/Button'
import { PageLoader } from '../shared/Spinner'
import toast from 'react-hot-toast'

interface BoardViewProps { boardId: string }

export function BoardView({ boardId }: BoardViewProps) {
  const dispatch = useAppDispatch()
  const { user } = useAuthContext()
  const { columns, tasks, isLoading } = useAppSelector((s) => s.board)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [newColTitle, setNewColTitle] = useState('')
  const [showNewCol, setShowNewCol] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  useRealtime(boardId)

  const reloadAllTasks = useCallback(() => {
    if (columns.length === 0) return
    const colIds = columns.map((c) => c.id)
    getTasks(colIds).then((ts) => {
      const grouped: Record<string, Task[]> = {}
      for (const col of columns) grouped[col.id] = []
      for (const t of ts) {
        if (!grouped[t.column_id]) grouped[t.column_id] = []
        grouped[t.column_id].push(t)
      }
      for (const colId of colIds) {
        dispatch(setTasks({ columnId: colId, tasks: grouped[colId] ?? [] }))
      }
    })
  }, [columns, dispatch])

  useEffect(() => {
    dispatch(setLoading(true))
    Promise.all([
      getColumns(boardId).then((cols) => dispatch(setColumns(cols))),
      getBoardMembers(boardId).then((members) => dispatch(setMembers(members))),
    ]).finally(() => dispatch(setLoading(false)))
  }, [boardId, dispatch])

  useEffect(() => { reloadAllTasks() }, [reloadAllTasks])

  const handleAddColumn = async () => {
    if (!newColTitle.trim()) return
    try {
      const col = await createColumn(boardId, newColTitle.trim())
      dispatch(addColumn(col))
      setNewColTitle('')
      setShowNewCol(false)
      toast.success('Column added')
    } catch { toast.error('Failed to add column') }
  }

  const handleDeleteColumn = async (colId: string) => {
    if (!confirm('Delete this column and all its tasks?')) return
    try {
      await deleteColumn(colId)
      dispatch(removeColumn(colId))
      toast.success('Column deleted')
    } catch { toast.error('Failed to delete column') }
  }

  const handleRenameColumn = async (colId: string, title: string) => {
    try {
      const updated = await updateColumn(colId, { title } as never)
      dispatch({ type: 'board/updateColumnInState', payload: updated })
    } catch { toast.error('Failed to rename column') }
  }

  const handleAddTask = async (colId: string, title: string) => {
    if (!user) return
    try {
      const task = await createTask(colId, title, user.id)
      dispatch(addTask(task))
    } catch { toast.error('Failed to add task') }
  }

  const findTaskColumn = (taskId: string): string | undefined => {
    for (const [colId, ts] of Object.entries(tasks)) {
      if (ts.some((t) => t.id === taskId)) return colId
    }
    return undefined
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTask((event.active.data.current?.task as Task) ?? null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const taskId = active.id as string
    const overId = over.id as string

    // Find columns from current Redux state (no handleDragOver, so unchanged)
    const activeColId = findTaskColumn(taskId)
    const overColId =
      over.data.current?.type === 'column'
        ? (over.id as string)
        : findTaskColumn(overId)
    if (!activeColId || !overColId) return

    try {
      const targetTasks = tasks[overColId] ?? []
      const overIdx =
        over.data.current?.type === 'column'
          ? targetTasks.length
          : targetTasks.findIndex((t) => t.id === overId)
      const newPos = overIdx >= 0 ? overIdx : targetTasks.length

      // OPTIMISTIC UPDATE: update Redux immediately before async API calls
      // This prevents snap-back — CSS transitions animate items to new positions
      dispatch(
        moveTaskInState({
          taskId,
          fromColumnId: activeColId,
          toColumnId: overColId,
          newPosition: newPos,
        })
      )

      // Persist to DB
      if (activeColId === overColId) {
        // Reorder within same column
        const arr = [...targetTasks]
        const fromIdx = arr.findIndex((t) => t.id === taskId)
        if (fromIdx === -1) return
        const [task] = arr.splice(fromIdx, 1)
        const insertAt = newPos > fromIdx ? newPos - 1 : newPos
        arr.splice(insertAt, 0, task)
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].position !== i) {
            await moveTask(arr[i].id, overColId, i)
          }
        }
      } else {
        // Move between columns: update positions in both columns
        await moveTask(taskId, overColId, newPos)
        const srcTasks = (tasks[activeColId] ?? []).filter((t) => t.id !== taskId)
        for (let i = 0; i < srcTasks.length; i++) {
          if (srcTasks[i].position !== i) {
            await moveTask(srcTasks[i].id, activeColId, i)
          }
        }
        const dstTasks = targetTasks.filter((t) => t.id !== taskId)
        for (let i = 0; i < dstTasks.length; i++) {
          const pos = i >= newPos ? i + 1 : i
          if (dstTasks[i].position !== pos) {
            await moveTask(dstTasks[i].id, overColId, pos)
          }
        }
      }
      reloadAllTasks()
    } catch (e) {
      console.error('Drag error:', e)
      toast.error('Move failed: ' + (e instanceof Error ? e.message : 'unknown'))
      reloadAllTasks()
    }
  }

  if (isLoading) return <PageLoader />

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 items-start min-h-[calc(100dvh-8rem)]">
          {columns.map((col) => (
            <Column
              key={col.id}
              column={col}
              tasks={tasks[col.id] ?? []}
              onAddTask={(title) => handleAddTask(col.id, title)}
              onDeleteColumn={() => handleDeleteColumn(col.id)}
              onRename={(t) => handleRenameColumn(col.id, t)}
              onTaskClick={(task) => dispatch(openTaskModal(task))}
            />
          ))}
          <div className="flex-shrink-0 w-72 sm:w-80">
            {showNewCol ? (
              <div className="bg-sidebar dark:bg-sidebar-dark rounded-xl p-3 space-y-2">
                <input value={newColTitle} onChange={(e) => setNewColTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                  placeholder="Column title..." autoFocus
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card dark:border-border-dark dark:bg-card-dark outline-none focus:ring-1 focus:ring-blue-500" />
                <div className="flex gap-1">
                  <Button size="sm" onClick={handleAddColumn}>Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewCol(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowNewCol(true)}
                className="w-full bg-sidebar dark:bg-sidebar-dark rounded-xl p-3 text-sm text-text-secondary hover:text-text-primary dark:hover:text-text-primary-dark transition-colors"
              >+ Add Column</button>
            )}
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeTask ? <div className="w-72 sm:w-80 opacity-90"><TaskCard task={activeTask} onClick={() => {}} /></div> : null}
      </DragOverlay>
    </DndContext>
  )
}

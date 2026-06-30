import { useEffect, useState, useCallback } from 'react'
import {
  DndContext, DragOverlay, closestCorners,
  type DragStartEvent, type DragEndEvent,
  PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import type { Task } from '../../types'
import { getColumns, createColumn, deleteColumn, updateColumn } from '../../services/columnService'
import { getTasks, createTask, reorderTasks } from '../../services/taskService'
import { getBoardMembers } from '../../services/boardService'
import { useAppDispatch, useAppSelector } from '../../hooks/useAppStore'
import {
  setColumns, addColumn, removeColumn, setTasks, addTask,
  setMembers, setLoading, moveTaskInState, updateColumnInState,
} from '../../store/boardSlice'
import { openTaskModal } from '../../store/uiSlice'
import { useRealtime } from '../../hooks/useRealtime'
import { useAuthContext } from '../../providers/AuthContext'
import { Column } from './Column'
import { TaskCard } from './TaskCard'
import { Button } from '../shared/Button'
import { ConfirmModal } from '../shared/ConfirmModal'
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
  const [confirmDeleteCol, setConfirmDeleteCol] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  )
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

  const handleConfirmDeleteColumn = async () => {
    if (!confirmDeleteCol) return
    try {
      await deleteColumn(confirmDeleteCol)
      dispatch(removeColumn(confirmDeleteCol))
      setConfirmDeleteCol(null)
      toast.success('Column deleted')
    } catch { toast.error('Failed to delete column') }
  }

  const handleRenameColumn = async (colId: string, title: string) => {
    try {
      const updated = await updateColumn(colId, { title })
      dispatch(updateColumnInState(updated))
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

      const activeIdx = targetTasks.findIndex((t) => t.id === taskId)
      const newPosRaw = overIdx >= 0 ? overIdx : targetTasks.length
      const newPos =
        activeIdx >= 0 && newPosRaw > activeIdx ? newPosRaw + 1 : newPosRaw

      const insertAt = activeIdx >= 0 && newPos > activeIdx ? newPos - 1 : newPos

      // Optimistic update
      dispatch(
        moveTaskInState({
          taskId,
          fromColumnId: activeColId,
          toColumnId: overColId,
          newPosition: insertAt,
        })
      )

      // Build list of all tasks that need position updates
      const tasksToReorder: { id: string; position: number; column_id?: string }[] = []

      if (activeColId === overColId) {
        // Same column: update all tasks in the column
        const allTasks = [...targetTasks]
        const taskIdx = allTasks.findIndex((t) => t.id === taskId)
        allTasks.splice(taskIdx, 1)
        allTasks.splice(insertAt, 0, allTasks[taskIdx])
        for (let i = 0; i < allTasks.length; i++) {
          tasksToReorder.push({ id: allTasks[i].id, position: i })
        }
      } else {
        // Moved to different column
        const srcTasks = (tasks[activeColId] ?? []).filter((t) => t.id !== taskId)
        const dstTasks = targetTasks.filter((t) => t.id !== taskId)

        // Source column reorder
        for (let i = 0; i < srcTasks.length; i++) {
          tasksToReorder.push({ id: srcTasks[i].id, position: i, column_id: activeColId })
        }
        // Destination column reorder
        for (let i = 0; i < dstTasks.length; i++) {
          const pos = i >= newPos ? i + 1 : i
          tasksToReorder.push({ id: dstTasks[i].id, position: pos, column_id: overColId })
        }
        // Moved task
        tasksToReorder.push({ id: taskId, position: newPos, column_id: overColId })
      }

      // Batch update positions
      await reorderTasks(tasksToReorder)
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
              onDeleteColumn={() => setConfirmDeleteCol(col.id)}
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
        {activeTask ? <div className="w-72 sm:w-80 p-2 opacity-90"><TaskCard task={activeTask} onClick={() => {}} /></div> : null}
      </DragOverlay>

      <ConfirmModal
        isOpen={confirmDeleteCol !== null}
        title="Delete column?"
        message="Delete this column and all its tasks?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDeleteColumn}
        onCancel={() => setConfirmDeleteCol(null)}
      />
    </DndContext>
  )
}
import { useEffect, useState } from 'react'
import {
  DndContext, DragOverlay, closestCorners,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import type { Column as ColumnType, Task } from '../../types'
import { getColumns, createColumn, deleteColumn, updateColumn } from '../../services/columnService'
import { getTasks, createTask, moveTask, reorderTasks } from '../../services/taskService'
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

  useEffect(() => {
    dispatch(setLoading(true))
    Promise.all([
      getColumns(boardId).then((cols) => dispatch(setColumns(cols))),
      getBoardMembers(boardId).then((members) => dispatch(setMembers(members))),
    ]).finally(() => dispatch(setLoading(false)))
  }, [boardId, dispatch])

  useEffect(() => {
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
  }, [columns.length, dispatch])

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
      const updated = await updateColumn(colId, { title } as Partial<ColumnType>)
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

  const findColumnOfTask = (taskId: string): string | null => {
    for (const [colId, ts] of Object.entries(tasks)) {
      if (ts.some((t) => t.id === taskId)) return colId
    }
    return null
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTask((event.active.data.current?.task as Task) ?? null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return
    const activeColId = findColumnOfTask(active.id as string)
    const overColId =
      over.data.current?.type === 'column'
        ? (over.id as string)
        : findColumnOfTask(over.id as string)
    if (!activeColId || !overColId || activeColId === overColId) return
    dispatch(moveTaskInState({
      taskId: active.id as string,
      fromColumnId: activeColId,
      toColumnId: overColId,
      newPosition: 0,
    }))
  }
  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return
    const taskId = active.id as string
    const overId = over.id as string
    const activeColId = findColumnOfTask(taskId)
    const overColId =
      over.data.current?.type === 'column' ? overId : findColumnOfTask(overId)
    if (!activeColId || !overColId) return
    if (activeColId !== overColId) {
      await moveTask(taskId, overColId, 0)
      const ts = tasks[overColId] ?? []
      await reorderTasks(ts.map((t, i) => ({ id: t.id, position: i })))
    }
  }

  if (isLoading) return <PageLoader />

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
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
                <input
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                  placeholder="Column title..." autoFocus
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card dark:border-border-dark dark:bg-card-dark outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex gap-1">
                  <Button size="sm" onClick={handleAddColumn}>Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewCol(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewCol(true)}
                className="w-full bg-sidebar dark:bg-sidebar-dark rounded-xl p-3 text-sm text-text-secondary hover:text-text-primary dark:hover:text-text-primary-dark transition-colors"
              >+ Add Column</button>
            )}
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="w-72 opacity-90">
            <TaskCard task={activeTask} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
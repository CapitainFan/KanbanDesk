import { useState } from 'react'
import {
  DndContext, DragOverlay, closestCorners,
  type DragStartEvent, type DragEndEvent,
  PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import { useAppSelector } from '../../hooks/useAppStore'
import { useAuthContext } from '../../providers/AuthContext'
import { useBoardData } from '../../hooks/useBoardData'
import { useColumnActions } from '../../hooks/useColumnActions'
import { useTaskActions } from '../../hooks/useTaskActions'
import { useTaskDnD } from '../../hooks/useTaskDnD'
import { useRealtime } from '../../hooks/useRealtime'
import { AddColumnCard } from './AddColumnCard'
import { Column } from './Column'
import { TaskCard } from './TaskCard'
import { ConfirmModal } from '../shared/ConfirmModal'
import { PageLoader } from '../shared/Spinner'
import { openTaskModal } from '../../store/uiSlice'
import { useAppDispatch } from '../../hooks/useAppStore'

interface BoardViewProps { boardId: string }

export function BoardView({ boardId }: BoardViewProps) {
  const dispatch = useAppDispatch()
  const { user } = useAuthContext()
  const { columns, tasks, members, isLoading } = useAppSelector((s) => s.board)
  const isOwner = members.some((m) => m.user_id === user?.id && m.role === 'owner')

  useBoardData(boardId)
  useRealtime(boardId)

  const { handleAddColumn, handleDeleteColumn, handleRenameColumn, addingColumn } = useColumnActions(boardId)
  const { handleAddTask } = useTaskActions()
  const { activeTask, handleDragStart, handleDragEnd } = useTaskDnD(tasks)

  const [confirmDeleteCol, setConfirmDeleteCol] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  )

  const onConfirmDeleteColumn = async () => {
    if (!confirmDeleteCol) return
    const success = await handleDeleteColumn(confirmDeleteCol)
    if (success) {
      setConfirmDeleteCol(null)
    }
  }

  const onDragStart = (event: DragStartEvent) => handleDragStart(event)
  const onDragEnd = (event: DragEndEvent) => handleDragEnd(event)

  if (isLoading) return <PageLoader />

  if (columns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <p className="text-text-secondary text-lg mb-4">No columns yet</p>
          {isOwner ? (
            <>
              <p className="text-text-secondary text-sm mb-6">Create your first column to start organizing tasks</p>
              <AddColumnCard onAdd={handleAddColumn} addingColumn={addingColumn} />
            </>
          ) : (
            <p className="text-text-secondary text-sm">Waiting for an owner to add columns</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 items-start min-h-[calc(100dvh-8rem)]">
          {columns.map((col) => (
            <Column
              key={col.id}
              column={col}
              tasks={tasks[col.id] ?? []}
              onAddTask={(title) => handleAddTask(col.id, title, user?.id ?? '')}
              onDeleteColumn={() => setConfirmDeleteCol(col.id)}
              onRename={(t) => handleRenameColumn(col.id, t)}
              onTaskClick={(task) => dispatch(openTaskModal(task))}
              canDelete={isOwner}
            />
          ))}
          {isOwner && <AddColumnCard onAdd={handleAddColumn} addingColumn={addingColumn} />}
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
        onConfirm={onConfirmDeleteColumn}
        onCancel={() => setConfirmDeleteCol(null)}
      />
    </DndContext>
  )
}
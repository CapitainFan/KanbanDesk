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
import { Column } from './Column'
import { TaskCard } from './TaskCard'
import { Button } from '../shared/Button'
import { ConfirmModal } from '../shared/ConfirmModal'
import { PageLoader } from '../shared/Spinner'
import { openTaskModal } from '../../store/uiSlice'
import { useAppDispatch } from '../../hooks/useAppStore'

interface BoardViewProps { boardId: string }

export function BoardView({ boardId }: BoardViewProps) {
  const dispatch = useAppDispatch()
  const { user } = useAuthContext()
  const { columns, tasks, isLoading } = useAppSelector((s) => s.board)

  useBoardData(boardId)
  useRealtime(boardId)

  const { handleAddColumn, handleDeleteColumn, handleRenameColumn, addingColumn } = useColumnActions(boardId)
  const { handleAddTask } = useTaskActions()
  const { activeTask, handleDragStart, handleDragEnd } = useTaskDnD(tasks)

  const [newColTitle, setNewColTitle] = useState('')
  const [showNewCol, setShowNewCol] = useState(false)
  const [confirmDeleteCol, setConfirmDeleteCol] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  )

  const onAddColumn = async () => {
    const success = await handleAddColumn(newColTitle)
    if (success) {
      setNewColTitle('')
      setShowNewCol(false)
    }
  }

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
            />
          ))}
          <div className="flex-shrink-0 w-72 sm:w-80">
            {showNewCol ? (
              <div className="bg-sidebar dark:bg-sidebar-dark rounded-xl p-3 space-y-2">
                <input value={newColTitle} onChange={(e) => setNewColTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onAddColumn()}
                  placeholder="Column title..." autoFocus
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card dark:border-border-dark dark:bg-card-dark outline-none focus:ring-1 focus:ring-blue-500" />
                <div className="flex gap-1">
                  <Button size="sm" onClick={onAddColumn} disabled={addingColumn || !newColTitle.trim()}>
                    {addingColumn ? 'Adding...' : 'Add'}
                  </Button>
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
        onConfirm={onConfirmDeleteColumn}
        onCancel={() => setConfirmDeleteCol(null)}
      />
    </DndContext>
  )
}
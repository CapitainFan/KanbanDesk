import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Column as ColumnType, Task } from '../../types'
import { TaskCard } from './TaskCard'
import { Button } from '../shared/Button'

interface ColumnProps {
  column: ColumnType
  tasks: Task[]
  onAddTask: (title: string) => void
  onDeleteColumn: () => void
  onRename: (title: string) => void
  onTaskClick: (task: Task) => void
}

export function Column({
  column,
  tasks,
  onAddTask,
  onDeleteColumn,
  onRename,
  onTaskClick,
}: ColumnProps) {
  const [newTitle, setNewTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(column.title)

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', column },
  })

  const handleAdd = () => {
    if (!newTitle.trim()) return
    onAddTask(newTitle.trim())
    setNewTitle('')
    setIsAdding(false)
  }

  const handleRename = () => {
    if (renameValue.trim() && renameValue !== column.title) {
      onRename(renameValue.trim())
    }
    setIsRenaming(false)
  }

  return (
    <div
      className={`flex-shrink-0 w-72 sm:w-80 bg-sidebar dark:bg-sidebar-dark rounded-xl flex flex-col max-h-full ${
        isOver ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-center justify-between p-3 border-b border-border dark:border-border-dark">
        {isRenaming ? (
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            autoFocus
            className="text-sm font-semibold bg-transparent border-b border-blue-500 outline-none text-text-primary dark:text-text-primary-dark"
          />
        ) : (
          <h3
            className="text-sm font-semibold text-text-primary dark:text-text-primary-dark cursor-pointer hover:text-blue-600"
            onClick={() => setIsRenaming(true)}
          >
            {column.title}
            <span className="ml-2 text-xs text-text-secondary font-normal">
              {tasks.length}
            </span>
          </h3>
        )}
        <Button variant="ghost" size="sm" onClick={onDeleteColumn}>
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]"
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-text-secondary">
            Drop tasks here
          </div>
        )}
      </div>

      <div className="p-2 border-t border-border dark:border-border-dark">
        {isAdding ? (
          <div className="flex gap-1">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Task title..."
              autoFocus
              className="flex-1 px-2 py-1.5 text-sm rounded border border-border bg-card dark:border-border-dark dark:bg-card-dark outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Button size="sm" onClick={handleAdd}>Add</Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>X</Button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full text-sm text-text-secondary hover:text-text-primary dark:hover:text-text-primary-dark py-1.5 rounded transition-colors"
          >
            + Add Task
          </button>
        )}
      </div>
    </div>
  )
}
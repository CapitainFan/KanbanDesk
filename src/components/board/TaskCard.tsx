import { useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../../types'
import { Avatar } from '../shared/Avatar'

interface TaskCardProps {
  task: Task
  onClick: () => void
}

const priorityColors: Record<Task['priority'], string> = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const wasDragged = useRef(false)
  const startPos = useRef<{ x: number; y: number } | null>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'task', task } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleClick = () => {
    if (wasDragged.current) {
      wasDragged.current = false
      return
    }
    onClick()
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    startPos.current = { x: e.clientX, y: e.clientY }
    wasDragged.current = false
    listeners?.onPointerDown?.(e)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startPos.current) return
    const dx = e.clientX - startPos.current.x
    const dy = e.clientY - startPos.current.y
    if (Math.hypot(dx, dy) > 5) {
      wasDragged.current = true
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    listeners?.onPointerUp?.(e)
  }

  const wrappedListeners = listeners
    ? {
        ...listeners,
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
      }
    : listeners

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...wrappedListeners}
      onClick={handleClick}
      type="button"
      className="w-full text-left bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow group touch-none"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-text-primary dark:text-text-primary-dark break-words">
          {task.title}
        </p>
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${priorityColors[task.priority]}`} />
      </div>
      <div className="flex items-center justify-between mt-2">
        {task.due_date && (
          <span className="text-xs text-text-secondary">
            {new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
        <div className="ml-auto">
          {task.assignee && (
            <Avatar
              src={task.assignee.avatar_url}
              name={task.assignee.name}
              size="sm"
            />
          )}
        </div>
      </div>
    </button>
  )
}
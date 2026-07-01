import { useRef, useCallback } from 'react'
import type { TaskUpdate } from '../../types'
import { updateTask } from '../../services/taskService'
import { useAppDispatch } from '../../hooks/useAppStore'
import { updateTaskInState } from '../../store/boardSlice'
import { updateSelectedTask } from '../../store/uiSlice'
import { Textarea } from '../shared/Textarea'
import toast from 'react-hot-toast'

interface TaskDetailsProps {
  taskId: string;
  initialDescription: string | null;
  initialPriority: TaskUpdate['priority'];
  initialAssigneeId: string | null;
  initialDueDate: string | null;
  members: Array<{ user_id: string; profile?: { name?: string | null; avatar_url?: string | null } | null }>;
}

const SAVE_DEBOUNCE_MS = 400

export function TaskDetails({
  taskId,
  initialDescription,
  initialPriority,
  initialAssigneeId,
  initialDueDate,
  members,
}: TaskDetailsProps) {
  const dispatch = useAppDispatch()
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingUpdatesRef = useRef<Partial<TaskUpdate>>({})

  const saveTask = useCallback(async (updates: Partial<TaskUpdate>) => {
    try {
      const updated = await updateTask(taskId, updates)
      dispatch(updateTaskInState(updated))
      dispatch(updateSelectedTask(updates))
    } catch (e) {
      console.error('Failed to update task:', e)
      toast.error('Failed to update task')
    }
  }, [taskId, dispatch])

  const scheduleSave = useCallback((updates: Partial<TaskUpdate>) => {
    pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const updatesToSend = { ...pendingUpdatesRef.current }
      pendingUpdatesRef.current = {}
      saveTask(updatesToSend)
    }, SAVE_DEBOUNCE_MS)
  }, [saveTask])

  const handleDescriptionChange = (value: string) => {
    scheduleSave({ description: value })
  }

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPriority = e.target.value as TaskUpdate['priority']
    scheduleSave({ priority: newPriority })
  }

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAssigneeId = e.target.value || null
    scheduleSave({ assignee_id: newAssigneeId })
  }

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDueDate = e.target.value || null
    scheduleSave({ due_date: newDueDate })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-text-primary dark:text-text-primary-dark">Description</label>
        <Textarea
          defaultValue={initialDescription ?? ''}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Add a description..."
        />
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[140px]">
          <label className="text-sm font-medium text-text-primary dark:text-text-primary-dark">Assignee</label>
          <select
            defaultValue={initialAssigneeId ?? ''}
            onChange={handleAssigneeChange}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-card text-text-primary dark:border-border-dark dark:bg-card-dark dark:text-text-primary-dark"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.profile?.name ?? m.user_id.slice(0, 8)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="text-sm font-medium text-text-primary dark:text-text-primary-dark">Priority</label>
          <select
            defaultValue={initialPriority}
            onChange={handlePriorityChange}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-card text-text-primary dark:border-border-dark dark:bg-card-dark dark:text-text-primary-dark"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="text-sm font-medium text-text-primary dark:text-text-primary-dark">Due Date</label>
          <input
            type="date"
            defaultValue={initialDueDate ?? ''}
            onChange={handleDueDateChange}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-card text-text-primary dark:border-border-dark dark:bg-card-dark dark:text-text-primary-dark"
          />
        </div>
      </div>
    </div>
  )
}
import { useState, useRef, useEffect, useCallback } from 'react'
import type { Comment, TaskUpdate } from '../../types'
import { getComments, createComment, deleteComment } from '../../services/commentService'
import { updateTask, deleteTask } from '../../services/taskService'
import { useAppDispatch } from '../../hooks/useAppStore'
import { useAuthContext } from '../../providers/AuthContext'
import { closeTaskModal, updateSelectedTask } from '../../store/uiSlice'
import { updateTaskInState, removeTask } from '../../store/boardSlice'
import { useAppSelector } from '../../hooks/useAppStore'
import { Modal } from '../shared/Modal'
import { Button } from '../shared/Button'
import { Textarea } from '../shared/Textarea'
import { Avatar } from '../shared/Avatar'
import { ConfirmModal } from '../shared/ConfirmModal'
import toast from 'react-hot-toast'

function TaskModalContent({ task }: { task: import('../../types').Task }) {
  const dispatch = useAppDispatch()
  const { user } = useAuthContext()
  const { members } = useAppSelector((s) => s.board)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Local draft state for description
  // Component remounts on task change via key={selectedTask.id}, so useState is sufficient
  const [description, setDescription] = useState(task.description ?? '')
  const [priority, setPriority] = useState(task.priority)
  const [assigneeId, setAssigneeId] = useState(task.assignee_id ?? '')
  const [dueDate, setDueDate] = useState(task.due_date ?? '')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveTask = useCallback(async (updates: Partial<TaskUpdate>) => {
    try {
      const updated = await updateTask(task.id, updates)
      dispatch(updateTaskInState(updated))
      dispatch(updateSelectedTask(updates))
    } catch (e) {
      console.error('Failed to update task:', e)
      toast.error('Failed to update task')
    }
  }, [task.id, dispatch])

  const scheduleSave = useCallback((updates: Partial<TaskUpdate>) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveTask(updates), 400)
  }, [saveTask])

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    scheduleSave({ description: value })
  }

  const handlePriorityChange = (value: string) => {
    const newPriority = value as TaskUpdate['priority']
    setPriority(newPriority)
    scheduleSave({ priority: newPriority })
  }

  const handleAssigneeChange = (value: string) => {
    const newAssigneeId = value || null
    setAssigneeId(value)
    scheduleSave({ assignee_id: newAssigneeId })
  }

  const handleDueDateChange = (value: string) => {
    const newDueDate = value || null
    setDueDate(value)
    scheduleSave({ due_date: newDueDate })
  }

  // Load comments on mount (component remounts when key/task changes)
  useEffect(() => {
    getComments(task.id)
      .then(setComments)
      .catch((err) => {
        console.error('Failed to load comments:', err)
        toast.error('Failed to load comments')
      })
      .finally(() => setCommentsLoading(false))
  }, [task.id])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteTask(task.id)
      dispatch(removeTask({ taskId: task.id, columnId: task.column_id }))
      dispatch(closeTaskModal())
      toast.success('Task deleted')
    } catch (e) {
      console.error('Failed to delete task:', e)
      toast.error('Failed to delete task')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return
    try {
      const comment = await createComment(task.id, user.id, newComment.trim())
      setComments((prev) => [...prev, comment])
      setNewComment('')
    } catch (e) {
      console.error('Failed to add comment:', e)
      toast.error('Failed to add comment')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch (e) {
      console.error('Failed to delete comment:', e)
      toast.error('Failed to delete comment')
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-text-primary dark:text-text-primary-dark">Description</label>
          <Textarea
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Add a description..."
          />
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[140px]">
            <label className="text-sm font-medium text-text-primary dark:text-text-primary-dark">Assignee</label>
            <select
              value={assigneeId}
              onChange={(e) => handleAssigneeChange(e.target.value)}
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
              value={priority}
              onChange={(e) => handlePriorityChange(e.target.value)}
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
              value={dueDate}
              onChange={(e) => handleDueDateChange(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-card text-text-primary dark:border-border-dark dark:bg-card-dark dark:text-text-primary-dark"
            />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
            Comments ({comments.length})
          </h4>
          <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
            {commentsLoading ? (
              <p className="text-xs text-text-secondary">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-text-secondary">No comments yet</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-2 text-sm">
                  <Avatar
                    src={comment.profile?.avatar_url}
                    name={comment.profile?.name}
                    size="sm"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary dark:text-text-primary-dark">
                        {comment.profile?.name ?? 'Unknown'}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                      {comment.user_id === user?.id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-500 hover:text-red-700 ml-auto"
                          aria-label="Delete comment"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <p className="text-text-secondary">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-card dark:border-border-dark dark:bg-card-dark outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
              Send
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t border-border dark:border-border-dark">
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Task'}
          </Button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete task?"
        message="Are you sure you want to delete this task?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isDeleting}
      />
    </>
  )
}

export function TaskModal() {
  const { selectedTask, isTaskModalOpen } = useAppSelector((s) => s.ui)
  const dispatch = useAppDispatch()

  return (
    <Modal
      isOpen={isTaskModalOpen}
      onClose={() => dispatch(closeTaskModal())}
      title={selectedTask?.title ?? 'Task'}
    >
      {selectedTask && <TaskModalContent key={selectedTask.id} task={selectedTask} />}
    </Modal>
  )
}
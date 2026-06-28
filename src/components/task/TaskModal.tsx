import { useEffect, useState } from 'react'
import type { Comment } from '../../types'
import { getComments, createComment, deleteComment } from '../../services/commentService'
import { updateTask } from '../../services/taskService'
import { useAppDispatch, useAppSelector } from '../../hooks/useAppStore'
import { useAuthContext } from '../../providers/AuthProvider'
import { closeTaskModal, updateSelectedTask } from '../../store/uiSlice'
import { updateTaskInState } from '../../store/boardSlice'
import { Modal } from '../shared/Modal'
import { Button } from '../shared/Button'
import { Textarea } from '../shared/Textarea'
import { Avatar } from '../shared/Avatar'
import toast from 'react-hot-toast'

export function TaskModal() {
  const dispatch = useAppDispatch()
  const { user } = useAuthContext()
  const { selectedTask, isTaskModalOpen } = useAppSelector((s) => s.ui)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    if (selectedTask) {
      getComments(selectedTask.id).then(setComments).catch(() => {})
    }
  }, [selectedTask])

  if (!selectedTask) return null
const handleUpdate = async (updates: Record<string, unknown>) => {
    try {
      const updated = await updateTask(selectedTask.id, updates)
      dispatch(updateTaskInState(updated))
      dispatch(updateSelectedTask(updates))
    } catch { toast.error('Failed to update task') }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return
    try {
      const comment = await createComment(selectedTask.id, user.id, newComment.trim())
      setComments((prev) => [...prev, comment])
      setNewComment('')
    } catch { toast.error('Failed to add comment') }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch { toast.error('Failed to delete comment') }
  }

  return (
    <Modal
      isOpen={isTaskModalOpen}
      onClose={() => dispatch(closeTaskModal())}
      title={selectedTask.title}
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-text-primary dark:text-text-primary-dark">Description</label>
          <Textarea
            value={selectedTask.description ?? ''}
            onChange={(e) => handleUpdate({ description: e.target.value })}
            placeholder="Add a description..."
          />
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[140px]">
            <label className="text-sm font-medium text-text-primary dark:text-text-primary-dark">Priority</label>
            <select
              value={selectedTask.priority}
              onChange={(e) => handleUpdate({ priority: e.target.value })}
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
              value={selectedTask.due_date ?? ''}
              onChange={(e) => handleUpdate({ due_date: e.target.value || null })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-card text-text-primary dark:border-border-dark dark:bg-card-dark dark:text-text-primary-dark"
            />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
            Comments ({comments.length})
          </h4>
          <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
            {comments.map((comment) => (
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
            ))}
            {comments.length === 0 && (
              <p className="text-xs text-text-secondary">No comments yet</p>
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
      </div>
    </Modal>
  )
}
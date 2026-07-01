import { useState } from 'react'
import { useAppSelector, useAppDispatch } from '../../hooks/useAppStore'
import { closeTaskModal } from '../../store/uiSlice'
import { removeTask } from '../../store/boardSlice'
import { deleteTask } from '../../services/taskService'
import { Modal } from '../shared/Modal'
import { Button } from '../shared/Button'
import { ConfirmModal } from '../shared/ConfirmModal'
import { TaskDetails } from './TaskDetails'
import { CommentsSection } from './CommentsSection'
import toast from 'react-hot-toast'

export function TaskModal() {
  const { selectedTask, isTaskModalOpen } = useAppSelector((s) => s.ui)
  const { members } = useAppSelector((s) => s.board)
  const dispatch = useAppDispatch()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = async () => {
    if (!selectedTask) return
    setIsDeleting(true)
    try {
      await deleteTask(selectedTask.id)
      dispatch(removeTask({ taskId: selectedTask.id, columnId: selectedTask.column_id }))
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

  return (
    <Modal
      isOpen={isTaskModalOpen}
      onClose={() => dispatch(closeTaskModal())}
      title={selectedTask?.title ?? 'Task'}
    >
      {selectedTask && (
        <div className="space-y-6">
          <TaskDetails
            taskId={selectedTask.id}
            initialDescription={selectedTask.description}
            initialPriority={selectedTask.priority}
            initialAssigneeId={selectedTask.assignee_id}
            initialDueDate={selectedTask.due_date}
            members={members}
          />

          <CommentsSection taskId={selectedTask.id} />

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
        </div>
      )}
    </Modal>
  )
}
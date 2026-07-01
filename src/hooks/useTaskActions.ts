import { createTask } from '../services/taskService'
import { useAppDispatch } from './useAppStore'
import { addTask } from '../store/boardSlice'
import toast from 'react-hot-toast'

export function useTaskActions() {
  const dispatch = useAppDispatch()

  const handleAddTask = async (colId: string, title: string, userId: string): Promise<boolean> => {
    if (!userId || !title.trim()) return false
    try {
      const task = await createTask(colId, title.trim(), userId)
      dispatch(addTask(task))
      return true
    } catch (e) {
      console.error('Failed to add task:', e)
      toast.error('Failed to add task')
      return false
    }
  }

  return { handleAddTask }
}
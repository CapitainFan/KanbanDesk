import { useState } from 'react'
import { createColumn, deleteColumn, updateColumn } from '../services/columnService'
import { useAppDispatch } from './useAppStore'
import { addColumn, removeColumn, updateColumnInState } from '../store/boardSlice'
import toast from 'react-hot-toast'

export function useColumnActions(boardId: string) {
  const dispatch = useAppDispatch()
  const [addingColumn, setAddingColumn] = useState(false)

  const handleAddColumn = async (title: string): Promise<boolean> => {
    if (!title.trim()) return false
    setAddingColumn(true)
    try {
      const col = await createColumn(boardId, title.trim())
      dispatch(addColumn(col))
      toast.success('Column added')
      return true
    } catch (e) {
      console.error('Failed to add column:', e)
      toast.error('Failed to add column')
      return false
    } finally {
      setAddingColumn(false)
    }
  }

  const handleDeleteColumn = async (colId: string): Promise<boolean> => {
    try {
      await deleteColumn(colId)
      dispatch(removeColumn(colId))
      toast.success('Column deleted')
      return true
    } catch (e) {
      console.error('Failed to delete column:', e)
      toast.error('Failed to delete column')
      return false
    }
  }

  const handleRenameColumn = async (colId: string, title: string) => {
    try {
      const updated = await updateColumn(colId, { title })
      dispatch(updateColumnInState(updated))
    } catch (e) {
      console.error('Failed to rename column:', e)
      toast.error('Failed to rename column')
    }
  }

  return {
    handleAddColumn,
    handleDeleteColumn,
    handleRenameColumn,
    addingColumn,
  }
}
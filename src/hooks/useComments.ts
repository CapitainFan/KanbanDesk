import { useEffect, useState } from 'react'
import { getComments, createComment, deleteComment } from '../services/commentService'
import { useAppDispatch, useAppSelector } from './useAppStore'
import { setComments, addComment, removeComment } from '../store/commentsSlice'
import { useAuthContext } from '../providers/AuthContext'
import toast from 'react-hot-toast'

export function useComments(taskId: string) {
  const dispatch = useAppDispatch()
  const { user } = useAuthContext()
  const comments = useAppSelector((state) => state.comments.byTaskId[taskId])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(false)

    getComments(taskId)
      .then((data) => {
        if (!cancelled) {
          dispatch(setComments({ taskId, comments: data }))
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load comments:', err)
          toast.error('Failed to load comments')
          setLoadError(true)
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [taskId, dispatch])

  const handleAddComment = async (content: string) => {
    if (!content.trim() || !user) return false
    try {
      const comment = await createComment(taskId, user.id, content.trim())
      dispatch(addComment({ taskId, comment }))
      return true
    } catch (e) {
      console.error('Failed to add comment:', e)
      toast.error('Failed to add comment')
      return false
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId)
      dispatch(removeComment({ taskId, commentId }))
    } catch (e) {
      console.error('Failed to delete comment:', e)
      toast.error('Failed to delete comment')
    }
  }

  return {
    comments: comments ?? [],
    loading,
    loadError,
    addComment: handleAddComment,
    deleteComment: handleDeleteComment,
  }
}
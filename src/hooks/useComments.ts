import { useEffect } from 'react'
import { getComments, createComment, deleteComment } from '../services/commentService'
import { useAppDispatch, useAppSelector } from './useAppStore'
import { setComments, addComment, removeComment } from '../store/commentsSlice'
import { useAuthContext } from '../providers/AuthContext'
import toast from 'react-hot-toast'

export function useComments(taskId: string) {
  const dispatch = useAppDispatch()
  const { user } = useAuthContext()
  const comments = useAppSelector((state) => state.comments.byTaskId[taskId])

  useEffect(() => {
    getComments(taskId)
      .then((data) => dispatch(setComments({ taskId, comments: data })))
      .catch((err) => {
        console.error('Failed to load comments:', err)
        toast.error('Failed to load comments')
      })
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
    addComment: handleAddComment,
    deleteComment: handleDeleteComment,
  }
}
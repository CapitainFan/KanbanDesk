import { useEffect, useReducer } from 'react'
import { getComments, createComment, deleteComment } from '../services/commentService'
import { useAppDispatch, useAppSelector } from './useAppStore'
import { setComments, addComment, removeComment } from '../store/commentsSlice'
import { useAuthContext } from '../providers/AuthContext'
import toast from 'react-hot-toast'

type CommentsLoadState =
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'error' }

type LoadAction =
  | { type: 'start' }
  | { type: 'success' }
  | { type: 'error' }

function loadStateReducer(_state: CommentsLoadState, action: LoadAction): CommentsLoadState {
  switch (action.type) {
    case 'start':  return { status: 'loading' }
    case 'success': return { status: 'success' }
    case 'error':   return { status: 'error' }
  }
}

export function useComments(taskId: string) {
  const dispatch = useAppDispatch()
  const { user } = useAuthContext()
  const comments = useAppSelector((state) => state.comments.byTaskId[taskId])
  const [loadState, dispatchLoad] = useReducer(loadStateReducer, { status: 'loading' })

  useEffect(() => {
    let cancelled = false
    dispatchLoad({ type: 'start' })

    getComments(taskId)
      .then((data) => {
        if (!cancelled) {
          dispatch(setComments({ taskId, comments: data }))
          dispatchLoad({ type: 'success' })
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load comments:', err)
          toast.error('Failed to load comments')
          dispatchLoad({ type: 'error' })
        }
      })

    return () => { cancelled = true }
  }, [taskId, dispatch])

  const loading = loadState.status === 'loading'
  const loadError = loadState.status === 'error'

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
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Comment } from '../types'

interface CommentsState {
  byTaskId: Record<string, Comment[]>
}

const initialState: CommentsState = {
  byTaskId: {},
}

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    setComments(state, action: PayloadAction<{ taskId: string; comments: Comment[] }>) {
      state.byTaskId[action.payload.taskId] = action.payload.comments
    },
    addComment(state, action: PayloadAction<{ taskId: string; comment: Comment }>) {
      const { taskId, comment } = action.payload
      if (!state.byTaskId[taskId]) state.byTaskId[taskId] = []
      const exists = state.byTaskId[taskId].some((c) => c.id === comment.id)
      if (!exists) state.byTaskId[taskId].push(comment)
    },
    removeComment(state, action: PayloadAction<{ taskId: string; commentId: string }>) {
      const { taskId, commentId } = action.payload
      if (state.byTaskId[taskId]) {
        state.byTaskId[taskId] = state.byTaskId[taskId].filter((c) => c.id !== commentId)
      }
    },
    clearCommentsForTask(state, action: PayloadAction<string>) {
      delete state.byTaskId[action.payload]
    },
  },
})

export const { setComments, addComment, removeComment, clearCommentsForTask } = commentsSlice.actions
export default commentsSlice.reducer
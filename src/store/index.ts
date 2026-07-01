import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import boardReducer from './boardSlice'
import uiReducer from './uiSlice'
import commentsReducer from './commentsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    board: boardReducer,
    ui: uiReducer,
    comments: commentsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

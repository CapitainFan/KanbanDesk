import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Task } from '../types'

interface UiState {
  theme: 'light' | 'dark'
  selectedTask: Task | null
  isTaskModalOpen: boolean
}

const initialState: UiState = {
  theme: (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light',
  selectedTask: null,
  isTaskModalOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', state.theme)
    },
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload
      localStorage.setItem('theme', action.payload)
    },
    openTaskModal(state, action: PayloadAction<Task>) {
      state.selectedTask = action.payload
      state.isTaskModalOpen = true
    },
    closeTaskModal(state) {
      state.selectedTask = null
      state.isTaskModalOpen = false
    },
    updateSelectedTask(state, action: PayloadAction<Partial<Task>>) {
      if (state.selectedTask) {
        state.selectedTask = { ...state.selectedTask, ...action.payload }
      }
    },
  },
})

export const {
  toggleTheme,
  setTheme,
  openTaskModal,
  closeTaskModal,
  updateSelectedTask,
} = uiSlice.actions
export default uiSlice.reducer
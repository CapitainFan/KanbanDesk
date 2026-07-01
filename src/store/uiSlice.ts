import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Task } from '../types'
import { getItem, setItem } from '../utils/storage'

interface UiState {
  theme: 'light' | 'dark'
  selectedTask: Task | null
  isTaskModalOpen: boolean
}

const initialState: UiState = {
  theme: getItem<'light' | 'dark'>('theme', 'light'),
  selectedTask: null,
  isTaskModalOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      setItem('theme', state.theme)
    },
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload
      setItem('theme', action.payload)
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
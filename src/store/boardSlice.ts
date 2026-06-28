import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Board, Column, Task, BoardMember } from '../types'

interface BoardState {
  boards: Board[]
  currentBoard: Board | null
  columns: Column[]
  tasks: Record<string, Task[]>
  members: BoardMember[]
  isLoading: boolean
}

const initialState: BoardState = {
  boards: [],
  currentBoard: null,
  columns: [],
  tasks: {},
  members: [],
  isLoading: false,
}

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    setBoards(state, action: PayloadAction<Board[]>) {
      state.boards = action.payload
    },
    addBoard(state, action: PayloadAction<Board>) {
      state.boards.push(action.payload)
    },
    removeBoard(state, action: PayloadAction<string>) {
      state.boards = state.boards.filter((b) => b.id !== action.payload)
    },
    setCurrentBoard(state, action: PayloadAction<Board | null>) {
      state.currentBoard = action.payload
    },
    setColumns(state, action: PayloadAction<Column[]>) {
      state.columns = action.payload
    },
    addColumn(state, action: PayloadAction<Column>) {
      state.columns.push(action.payload)
    },
    updateColumnInState(state, action: PayloadAction<Column>) {
      const idx = state.columns.findIndex((c) => c.id === action.payload.id)
      if (idx !== -1) state.columns[idx] = action.payload
    },
    removeColumn(state, action: PayloadAction<string>) {
      state.columns = state.columns.filter((c) => c.id !== action.payload)
      delete state.tasks[action.payload]
    },
    setTasks(
      state,
      action: PayloadAction<{ columnId: string; tasks: Task[] }>
    ) {
      state.tasks[action.payload.columnId] = action.payload.tasks
    },
    addTask(state, action: PayloadAction<Task>) {
      const colId = action.payload.column_id
      if (!state.tasks[colId]) state.tasks[colId] = []
      state.tasks[colId].push(action.payload)
    },
    updateTaskInState(state, action: PayloadAction<Task>) {
      const colId = action.payload.column_id
      const tasks = state.tasks[colId] ?? []
      const idx = tasks.findIndex((t) => t.id === action.payload.id)
      if (idx !== -1) tasks[idx] = action.payload
    },
    removeTask(state, action: PayloadAction<{ taskId: string; columnId: string }>) {
      const { taskId, columnId } = action.payload
      state.tasks[columnId] = (state.tasks[columnId] ?? []).filter(
        (t) => t.id !== taskId
      )
    },
    moveTaskInState(
      state,
      action: PayloadAction<{
        taskId: string
        fromColumnId: string
        toColumnId: string
        newPosition: number
      }>
    ) {
      const { taskId, fromColumnId, toColumnId, newPosition } = action.payload
      const fromTasks = state.tasks[fromColumnId] ?? []
      const task = fromTasks.find((t) => t.id === taskId)
      if (!task) return

      state.tasks[fromColumnId] = fromTasks.filter((t) => t.id !== taskId)
      task.column_id = toColumnId
      task.position = newPosition
      if (!state.tasks[toColumnId]) state.tasks[toColumnId] = []
      state.tasks[toColumnId].splice(newPosition, 0, task)
      state.tasks[toColumnId] = state.tasks[toColumnId].map((t, i) => ({
        ...t,
        position: i,
      }))
    },
    setMembers(state, action: PayloadAction<BoardMember[]>) {
      state.members = action.payload
    },
    addMember(state, action: PayloadAction<BoardMember>) {
      state.members.push(action.payload)
    },
    removeMember(state, action: PayloadAction<string>) {
      state.members = state.members.filter((m) => m.id !== action.payload)
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
    resetBoard(state) {
      state.currentBoard = null
      state.columns = []
      state.tasks = {}
      state.members = []
    },
  },
})

export const {
  setBoards,
  addBoard,
  removeBoard,
  setCurrentBoard,
  setColumns,
  addColumn,
  updateColumnInState,
  removeColumn,
  setTasks,
  addTask,
  updateTaskInState,
  removeTask,
  moveTaskInState,
  setMembers,
  addMember,
  removeMember,
  setLoading,
  resetBoard,
} = boardSlice.actions
export default boardSlice.reducer
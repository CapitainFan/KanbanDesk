import { useEffect } from 'react'
import { getColumns } from '../services/columnService'
import { getTasks } from '../services/taskService'
import { getBoardMembers } from '../services/boardService'
import { useAppDispatch } from './useAppStore'
import {
  setColumns,
  setTasks,
  setMembers,
  setLoading,
} from '../store/boardSlice'

export function useBoardData(boardId: string) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(setLoading(true))
    Promise.all([
      getColumns(boardId).then((cols) => {
        dispatch(setColumns(cols))
        return cols
      }),
      getBoardMembers(boardId).then((members) => dispatch(setMembers(members))),
    ])
      .then(([cols]) => {
        if (cols.length > 0) {
          const colIds = cols.map((c) => c.id)
          getTasks(colIds).then((ts) => {
            const grouped: Record<string, import('../types').Task[]> = {}
            for (const col of cols) grouped[col.id] = []
            for (const t of ts) {
              if (!grouped[t.column_id]) grouped[t.column_id] = []
              grouped[t.column_id].push(t)
            }
            for (const colId of colIds) {
              dispatch(setTasks({ columnId: colId, tasks: grouped[colId] ?? [] }))
            }
          })
        }
      })
      .finally(() => dispatch(setLoading(false)))
  }, [boardId, dispatch])
}
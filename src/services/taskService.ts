import { supabase } from '../lib/supabase'
import type { Task } from '../types'

export async function getTasks(columnIds: string[]): Promise<Task[]> {
  if (columnIds.length === 0) return []
  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:profiles(*)')
    .in('column_id', columnIds)
    .order('position')
  if (error) throw error
  return data ?? []
}

export async function createTask(
  columnId: string,
  title: string,
  userId: string
) {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('position')
    .eq('column_id', columnId)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = tasks?.[0]?.position != null ? tasks[0].position + 1 : 0

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      column_id: columnId,
      title,
      position: nextPosition,
      created_by: userId,
    })
    .select('*, assignee:profiles(*)')
    .single()
  if (error) throw error
  return data
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select('*, assignee:profiles(*)')
    .single()
  if (error) throw error
  return data
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export async function moveTask(
  taskId: string,
  newColumnId: string,
  newPosition: number
) {
  const { error } = await supabase
    .from('tasks')
    .update({ column_id: newColumnId, position: newPosition })
    .eq('id', taskId)
  if (error) throw error
}

export async function reorderTasks(
  tasks: { id: string; position: number }[]
) {
  for (const task of tasks) {
    await supabase
      .from('tasks')
      .update({ position: task.position })
      .eq('id', task.id)
  }
}
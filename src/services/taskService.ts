import { supabase } from '../lib/supabase'
import type { Task } from '../types'

async function attachAssignee(tasks: Task[]): Promise<Task[]> {
  if (tasks.length === 0) return tasks
  const assigneeIds = tasks
    .filter((t) => t.assignee_id)
    .map((t) => t.assignee_id as string)
  if (assigneeIds.length === 0) return tasks

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', assigneeIds)
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? [])
  return tasks.map((t) => ({
    ...t,
    assignee: t.assignee_id ? (profileMap.get(t.assignee_id) ?? null) : null,
  }))
}

export async function getTasks(columnIds: string[]): Promise<Task[]> {
  if (columnIds.length === 0) return []
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .in('column_id', columnIds)
    .order('position')
  if (error) throw error
  return attachAssignee(data ?? [])
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

  const { data: rawTask, error } = await supabase
    .from('tasks')
    .insert({
      column_id: columnId,
      title,
      position: nextPosition,
      created_by: userId,
    })
    .select()
    .single()
  if (error) throw error

  const [task] = await attachAssignee([rawTask])
  return task
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const { data: rawTask, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error

  const [task] = await attachAssignee([rawTask])
  return task
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
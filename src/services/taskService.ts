import { supabase } from '../lib/supabase'
import type { Task, TaskUpdate } from '../types'

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

export async function updateTask(id: string, updates: Partial<TaskUpdate>) {
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

export async function reorderTasks(
  tasks: { id: string; position: number; column_id?: string }[]
) {
  try {
    const { error } = await supabase.rpc('reorder_tasks_batch', {
      p_tasks: tasks.map((t) => ({
        id: t.id,
        position: t.position,
        column_id: t.column_id ?? null,
      })),
    })
    if (error) throw error
    return
  } catch (e) {
    if (e instanceof Error && e.message.includes('function') && e.message.includes('not found')) {
      console.warn('reorder_tasks_batch RPC not found, falling back to individual updates')
    } else {
      throw e
    }
  }

  const updates = tasks.map((t) => {
    const update: Record<string, unknown> = { position: t.position }
    if (t.column_id) update.column_id = t.column_id
    return supabase
      .from('tasks')
      .update(update)
      .eq('id', t.id)
      .select()
  })

  const results = await Promise.all(updates)
  for (const { error, data } of results) {
    if (error) throw error
    if (!data || data.length === 0) {
      throw new Error('Reorder blocked by RLS')
    }
  }
}

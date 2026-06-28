import { supabase } from '../lib/supabase'
import type { Comment } from '../types'

export async function getComments(taskId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*, profile:profiles(*)')
    .eq('task_id', taskId)
    .order('created_at')
  if (error) throw error
  return data ?? []
}

export async function createComment(
  taskId: string,
  userId: string,
  content: string
) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ task_id: taskId, user_id: userId, content })
    .select('*, profile:profiles(*)')
    .single()
  if (error) throw error
  return data
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) throw error
}
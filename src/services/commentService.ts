import { supabase } from '../lib/supabase'
import type { Comment } from '../types'

async function attachProfile(comments: Comment[]): Promise<Comment[]> {
  if (comments.length === 0) return comments
  const userIds = [...new Set(comments.map((c) => c.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? [])
  return comments.map((c) => ({
    ...c,
    profile: profileMap.get(c.user_id) ?? null,
  }))
}

export async function getComments(taskId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at')
  if (error) throw error
  return attachProfile(data ?? [])
}

export async function createComment(
  taskId: string,
  userId: string,
  content: string
) {
  const { data: rawComment, error } = await supabase
    .from('comments')
    .insert({ task_id: taskId, user_id: userId, content })
    .select()
    .single()
  if (error) throw error

  const [comment] = await attachProfile([rawComment])
  return comment
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) throw error
}
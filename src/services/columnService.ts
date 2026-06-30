import { supabase } from '../lib/supabase'
import type { Column } from '../types'

export async function getColumns(boardId: string): Promise<Column[]> {
  const { data, error } = await supabase
    .from('columns')
    .select('*')
    .eq('board_id', boardId)
    .order('position')
  if (error) throw error
  return data ?? []
}

export async function createColumn(boardId: string, title: string) {
  const { data: cols } = await supabase
    .from('columns')
    .select('position')
    .eq('board_id', boardId)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = cols?.[0]?.position != null ? cols[0].position + 1 : 0

  const { data, error } = await supabase
    .from('columns')
    .insert({ board_id: boardId, title, position: nextPosition })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateColumn(id: string, updates: { title: string }) {
  const { data, error } = await supabase
    .from('columns')
    .update(updates)
    .eq('id', id)
    .select()
  if (error) throw error
  return data?.[0] ?? null
}

export async function deleteColumn(id: string) {
  const { error } = await supabase.from('columns').delete().eq('id', id)
  if (error) throw error
}
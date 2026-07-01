import { supabase } from '../lib/supabase'
import type { Board, BoardMember } from '../types'

const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Done']

export async function getBoards(userId: string): Promise<Board[]> {
  const { data, error } = await supabase
    .from('board_members')
    .select('board_id, boards(*)')
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? []).map((item: any) => item.boards) as Board[]
}

export async function createBoard(title: string, ownerId: string) {
  const { data: board, error: boardError } = await supabase
    .from('boards')
    .insert({ title, owner_id: ownerId })
    .select()
    .single()
  if (boardError) throw new Error(boardError.message)

  const { error: memberError } = await supabase.from('board_members').insert({
    board_id: board.id,
    user_id: ownerId,
    role: 'owner',
  })
  if (memberError) {
    await supabase.from('boards').delete().eq('id', board.id)
    throw new Error(memberError.message)
  }

  const columns = DEFAULT_COLUMNS.map((title, idx) => ({
    board_id: board.id,
    title,
    position: idx,
  }))
  const { error: colError } = await supabase.from('columns').insert(columns)
  if (colError) throw new Error(colError.message)

  return board
}

export async function deleteBoard(boardId: string) {
  const { error } = await supabase.from('boards').delete().eq('id', boardId)
  if (error) throw error
}

export async function getBoardMembers(boardId: string): Promise<BoardMember[]> {
  const { data, error } = await supabase
    .from('board_members')
    .select('*')
    .eq('board_id', boardId)
  if (error) throw error

  const members = data ?? []
  if (members.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', members.map((m) => m.user_id))
    const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? [])
    return members.map((m) => ({ ...m, profile: profileMap.get(m.user_id) ?? null }))
  }
  return members
}

export async function addBoardMember(boardId: string, userId: string) {
  const { data, error } = await supabase
    .from('board_members')
    .insert({ board_id: boardId, user_id: userId, role: 'member' })
    .select()
    .single()
  if (error) throw error

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { ...data, profile: profile ?? null }
}

export async function findUserByEmail(email: string) {
  const { data, error } = await supabase
    .rpc('find_user_by_email', { email_input: email })
  if (error) throw error
  return data as { id: string; email: string; name: string; avatar_url: string | null }[]
}

export async function removeBoardMember(memberId: string) {
  const { error } = await supabase
    .from('board_members')
    .delete()
    .eq('id', memberId)
  if (error) throw error
}
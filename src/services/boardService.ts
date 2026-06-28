import { supabase } from '../lib/supabase'
import type { Board, BoardMember } from '../types'

export async function getBoards(_userId: string): Promise<Board[]> {
  // RLS already filters boards to those where user is a member
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('getBoards error:', error)
    throw error
  }
  return data ?? []
}

export async function createBoard(title: string, ownerId: string) {
  // 1. Create board
  const { data: board, error: boardError } = await supabase
    .from('boards')
    .insert({ title, owner_id: ownerId })
    .select()
    .single()
  if (boardError) {
    console.error('createBoard/boards:', boardError)
    throw new Error(boardError.message)
  }

  // 2. Add owner as member
  const { error: memberError } = await supabase.from('board_members').insert({
    board_id: board.id,
    user_id: ownerId,
    role: 'owner',
  })
  if (memberError) {
    console.error('createBoard/member:', memberError)
    // Cleanup: delete the board if member insert failed
    await supabase.from('boards').delete().eq('id', board.id)
    throw new Error(memberError.message)
  }

  // 3. Create default columns
  const defaultColumns = ['To Do', 'In Progress', 'Done']
  const columns = defaultColumns.map((title, idx) => ({
    board_id: board.id,
    title,
    position: idx,
  }))
  const { error: colError } = await supabase.from('columns').insert(columns)
  if (colError) {
    console.error('createBoard/columns:', colError)
    // Columns are deleted cascade with board, but keep member for consistency
    throw new Error(colError.message)
  }

  return board
}

export async function deleteBoard(boardId: string) {
  const { error } = await supabase.from('boards').delete().eq('id', boardId)
  if (error) throw error
}

export async function getBoardMembers(boardId: string): Promise<BoardMember[]> {
  const { data, error } = await supabase
    .from('board_members')
    .select('*, profile:profiles(*)')
    .eq('board_id', boardId)
  if (error) throw error
  return data ?? []
}

export async function addBoardMember(boardId: string, userId: string) {
  const { data, error } = await supabase
    .from('board_members')
    .insert({ board_id: boardId, user_id: userId, role: 'member' })
    .select('*, profile:profiles(*)')
    .single()
  if (error) throw error
  return data
}

export async function findUserByEmail(email: string) {
  const { data, error } = await supabase
    .rpc('find_user_by_email', { email_input: email })
  if (error) {
    // Fallback: try searching profiles with a matching name
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .ilike('name', `%${email}%`)
      .limit(5)
    return profiles ?? []
  }
  return data
}

export async function removeBoardMember(memberId: string) {
  const { error } = await supabase
    .from('board_members')
    .delete()
    .eq('id', memberId)
  if (error) throw error
}
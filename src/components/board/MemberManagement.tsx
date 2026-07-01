import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../hooks/useAppStore'
import { addMember, removeMember } from '../../store/boardSlice'
import { addBoardMember, removeBoardMember, findUserByEmail } from '../../services/boardService'
import { useAuthContext } from '../../providers/AuthContext'
import { Avatar } from '../shared/Avatar'
import { Button } from '../shared/Button'
import toast from 'react-hot-toast'

export function MemberManagement() {
  const dispatch = useAppDispatch()
  const { user } = useAuthContext()
  const { members, currentBoard } = useAppSelector((s) => s.board)
  const [email, setEmail] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  if (!currentBoard) return null

  const isOwner = members.some(
    (m) => m.user_id === user?.id && m.role === 'owner'
  )

  const handleAddByEmail = async () => {
    if (!email.trim()) return
    setIsAdding(true)
    try {
      const users = await findUserByEmail(email.trim())
      if (users.length === 0) {
        toast.error('No user found with that email')
        return
      }
      const foundUser = users[0]

      if (members.some((m) => m.user_id === foundUser.id)) {
        toast.error('User is already a member')
        return
      }

      const member = await addBoardMember(currentBoard.id, foundUser.id)
      dispatch(addMember(member))
      setEmail('')
      toast.success('Member added')
    } catch (e) {
      console.error('Failed to add member:', e)
      toast.error('Failed to add member. Make sure the RPC function is created in Supabase (see supabase-scripts.md)')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemove = async (memberId: string) => {
    try {
      await removeBoardMember(memberId)
      dispatch(removeMember(memberId))
      toast.success('Member removed')
    } catch (e) {
      console.error('Failed to remove member:', e)
      toast.error('Failed to remove member')
    }
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2">
      {isOwner && (
        <div className="flex flex-col gap-1 md:mr-10 min-w-[200px] max-w-xs">
          <div className="flex flex-col sm:flex-row gap-1">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddByEmail()}
              placeholder="Email to invite..."
              className="w-full sm:w-auto px-2 py-1.5 text-sm rounded border border-border bg-card dark:border-border-dark dark:bg-card-dark outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Button
              size="sm"
              onClick={handleAddByEmail}
              disabled={!email.trim() || isAdding}
              className="self-start"
            >
              {isAdding ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>
      )}
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark mb-2 text-start">
          Members ({members.length})
        </h3>
        <div className="space-y-2 h-[80px] overflow-y-auto pr-1">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-2 text-sm">
              <Avatar
                src={m.profile?.avatar_url}
                name={m.profile?.name}
                size="sm"
              />
              <span className="flex-1 text-text-primary dark:text-text-primary-dark">
                {m.profile?.name ?? m.user_id.slice(0, 8)}
              </span>
              {isOwner && m.role !== 'owner' && (
                <Button variant="ghost" size="sm" onClick={() => handleRemove(m.id)}>
                  <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              )}
              <span className="text-xs text-text-secondary uppercase">{m.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
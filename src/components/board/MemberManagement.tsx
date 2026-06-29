import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../hooks/useAppStore'
import { addMember, removeMember } from '../../store/boardSlice'
import { addBoardMember, removeBoardMember } from '../../services/boardService'
import { useAuthContext } from '../../providers/AuthProvider'
import { Avatar } from '../shared/Avatar'
import { Button } from '../shared/Button'
import toast from 'react-hot-toast'

export function MemberManagement() {
  const dispatch = useAppDispatch()
  const { user } = useAuthContext()
  const { members, currentBoard } = useAppSelector((s) => s.board)
  const [userId, setUserId] = useState('')

  if (!currentBoard) return null

  const isOwner = members.some(
    (m) => m.user_id === user?.id && m.role === 'owner'
  )

  const handleAdd = async () => {
    if (!userId.trim()) return
    try {
      const member = await addBoardMember(currentBoard.id, userId.trim())
      dispatch(addMember(member))
      setUserId('')
      toast.success('Member added')
    } catch {
      toast.error('Failed to add member')
    }
  }

  const handleRemove = async (memberId: string) => {
    try {
      await removeBoardMember(memberId)
      dispatch(removeMember(memberId))
      toast.success('Member removed')
    } catch {
      toast.error('Failed to remove member')
    }
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2">
      {isOwner && (
        <div className="flex flex-col sm:flex-row gap-1 md:mr-10">
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="User ID to invite..."
            className="w-full sm:w-auto px-2 py-1.5 text-sm rounded border border-border bg-card dark:border-border-dark dark:bg-card-dark outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Button size="sm" onClick={handleAdd} disabled={!userId.trim()} className="self-start">
            Add
          </Button>
        </div>
      )}
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark mb-2 text-start">
          Members ({members.length})
        </h3>
        {/* Контейнер списка с фиксированной высотой 80px и скроллом */}
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
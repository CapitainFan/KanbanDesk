import { useState } from 'react'
import { useAuthContext } from '../../providers/AuthContext'
import { useComments } from '../../hooks/useComments'
import { Avatar } from '../shared/Avatar'
import { Button } from '../shared/Button'

interface CommentsSectionProps {
  taskId: string;
}

export function CommentsSection({ taskId }: CommentsSectionProps) {
  const { user } = useAuthContext()
  const { comments, addComment, deleteComment } = useComments(taskId)
  const [newComment, setNewComment] = useState('')
  const [sending, setSending] = useState(false)

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || sending) return
    setSending(true)
    const success = await addComment(newComment)
    if (success) setNewComment('')
    setSending(false)
  }

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId)
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
        Comments ({comments.length})
      </h4>
      <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
        {comments.length === 0 ? (
          <p className="text-xs text-text-secondary">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-2 text-sm">
              <Avatar
                src={comment.profile?.avatar_url}
                name={comment.profile?.name}
                size="sm"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary dark:text-text-primary-dark">
                    {comment.profile?.name ?? 'Unknown'}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                  {comment.user_id === user?.id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-500 hover:text-red-700 ml-auto"
                      aria-label="Delete comment"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-text-secondary">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
          placeholder="Write a comment..."
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-card dark:border-border-dark dark:bg-card-dark outline-none focus:ring-1 focus:ring-blue-500"
        />
        <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
          Send
        </Button>
      </div>
    </div>
  )
}
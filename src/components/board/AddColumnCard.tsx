import { useState } from 'react'
import { Button } from '../shared/Button'

interface AddColumnCardProps {
  onAdd: (title: string) => Promise<boolean>
  addingColumn: boolean
}

export function AddColumnCard({ onAdd, addingColumn }: AddColumnCardProps) {
  const [showNewCol, setShowNewCol] = useState(false)
  const [newColTitle, setNewColTitle] = useState('')

  const handleAdd = async () => {
    const success = await onAdd(newColTitle)
    if (success) {
      setNewColTitle('')
      setShowNewCol(false)
    }
  }

  if (!showNewCol) {
    return (
      <button
        onClick={() => setShowNewCol(true)}
        className="flex-shrink-0 w-72 sm:w-80 bg-sidebar dark:bg-sidebar-dark rounded-xl p-3 text-sm text-text-secondary hover:text-text-primary dark:hover:text-text-primary-dark transition-colors"
      >
        + Add Column
      </button>
    )
  }

  return (
    <div className="flex-shrink-0 w-72 sm:w-80">
      <div className="bg-sidebar dark:bg-sidebar-dark rounded-xl p-3 space-y-2">
        <input
          value={newColTitle}
          onChange={(e) => setNewColTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Column title..."
          autoFocus
          className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card dark:border-border-dark dark:bg-card-dark outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="flex gap-1">
          <Button size="sm" onClick={handleAdd} disabled={addingColumn || !newColTitle.trim()}>
            {addingColumn ? 'Adding...' : 'Add'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowNewCol(false)}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}
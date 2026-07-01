import { useState, useRef, type FormEvent } from 'react'
import { Layout } from '../components/shared/Layout'
import { Button } from '../components/shared/Button'
import { Input } from '../components/shared/Input'
import { Avatar } from '../components/shared/Avatar'
import { useAuthContext } from '../providers/AuthContext'
import { updateProfile } from '../services/authService'
import { useAppDispatch } from '../hooks/useAppStore'
import { setProfile } from '../store/authSlice'
import toast from 'react-hot-toast'

export function ProfilePage() {
  const { profile, user } = useAuthContext()
  const dispatch = useAppDispatch()
  const [name, setName] = useState(profile?.name ?? '')
  const [saving, setSaving] = useState(false)
  const prevProfileIdRef = useRef(profile?.id)

  // Sync local state when profile loads asynchronously (only on profile id change)
  if (prevProfileIdRef.current !== profile?.id) {
    prevProfileIdRef.current = profile?.id
    setName(profile?.name ?? '')
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile?.id) return
    setSaving(true)
    try {
      const updated = await updateProfile({ id: profile.id, name })
      dispatch(setProfile(updated))
      toast.success('Profile updated')
    } catch (e) {
      console.error('Failed to update profile:', e)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyId = async () => {
    if (!user?.id) return
    try {
      await navigator.clipboard.writeText(user.id)
      toast.success('User ID copied!')
    } catch (e) {
      console.error('Failed to copy using clipboard API:', e)
      const textarea = document.createElement('textarea')
      textarea.value = user.id
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      toast.success('User ID copied!')
    }
  }

  const handleCopyEmail = async () => {
    if (!user?.email) return
    try {
      await navigator.clipboard.writeText(user.email)
      toast.success('Email copied!')
    } catch (e) {
      console.error('Failed to copy using clipboard API:', e)
      const textarea = document.createElement('textarea')
      textarea.value = user.email
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      toast.success('Email copied!')
    }
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="flex flex-col items-center mb-8">
          <Avatar src={profile?.avatar_url} name={name || profile?.name} size="lg" />
          <h2 className="mt-4 text-xl font-semibold text-text-primary dark:text-text-primary-dark">
            {profile?.name ?? 'Profile'}
          </h2>
        </div>
      <form key={profile?.id ?? 'no-profile'} onSubmit={handleSave} className="flex flex-col gap-4">
        <Input label="Display Name" value={name} onChange={(e) => setName(e.target.value)} />

          <div className="text-sm text-text-secondary bg-sidebar dark:bg-sidebar-dark rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-1">
              <span className="font-medium whitespace-nowrap">Email:</span>
              <span className="break-all flex-1 min-w-0">{user?.email}</span>
              {user?.email && (
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  aria-label="Copy Email"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-600 dark:text-gray-300"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium whitespace-nowrap">User ID:</span>
              <span className="break-all flex-1 min-w-0">{user?.id}</span>
              {user?.id && (
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  aria-label="Copy User ID"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-600 dark:text-gray-300"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              )}
            </div>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </form>
      </div>
    </Layout>
  )
}
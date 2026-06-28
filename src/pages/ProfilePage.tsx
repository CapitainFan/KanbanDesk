import { useState, type FormEvent } from 'react'
import { Layout } from '../components/shared/Layout'
import { Button } from '../components/shared/Button'
import { Input } from '../components/shared/Input'
import { Avatar } from '../components/shared/Avatar'
import { useAuthContext } from '../providers/AuthProvider'
import { updateProfile } from '../services/authService'
import { useAppDispatch } from '../hooks/useAppStore'
import { setProfile } from '../store/authSlice'
import toast from 'react-hot-toast'

export function ProfilePage() {
  const { profile } = useAuthContext()
  const dispatch = useAppDispatch()
  const [name, setName] = useState(profile?.name ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile?.id) return
    setSaving(true)
    try {
      const updated = await updateProfile({ id: profile.id, name })
      dispatch(setProfile(updated))
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
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
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input label="Display Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </form>
      </div>
    </Layout>
  )
}
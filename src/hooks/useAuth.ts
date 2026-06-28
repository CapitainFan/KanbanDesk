import { useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAppDispatch, useAppSelector } from './useAppStore'
import { setUser, setProfile, setLoading, logout } from '../store/authSlice'
import { getProfile } from '../services/authService'

export function useAuth() {
  const dispatch = useAppDispatch()
  const { user, profile, isLoading } = useAppSelector((state) => state.auth)

  useEffect(() => {
    let cancelled = false

    const initSession = async () => {
      dispatch(setLoading(true))
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return

      const currentUser = session?.user ?? null
      dispatch(setUser(currentUser))

      if (currentUser) {
        try {
          const p = await getProfile(currentUser.id)
          if (!cancelled) dispatch(setProfile(p))
        } catch (e) {
          console.error('Failed to load profile:', e)
        }
      }
      if (!cancelled) dispatch(setLoading(false))
    }

    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (cancelled) return
        const currentUser = session?.user ?? null
        dispatch(setUser(currentUser))

        if (currentUser) {
          try {
            const p = await getProfile(currentUser.id)
            dispatch(setProfile(p))
          } catch (e) {
            console.error('Failed to load profile on change:', e)
          }
        } else {
          dispatch(setProfile(null))
        }
      }
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [dispatch])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    dispatch(logout())
  }, [dispatch])

  return { user, profile, isLoading, logout: handleLogout }
}
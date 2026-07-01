import { useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAppDispatch, useAppSelector } from './useAppStore'
import { setUser, setProfile, setLoading, logout as logoutAction } from '../store/authSlice'
import { resetBoard } from '../store/boardSlice'
import { getProfile } from '../services/authService'

export function useAuth() {
  const dispatch = useAppDispatch()
  const { user, profile, isLoading } = useAppSelector((state) => state.auth)
  const profileCacheRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const initSession = async () => {
      dispatch(setLoading(true))
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (cancelled) return

        const currentUser = session?.user ?? null
        dispatch(setUser(currentUser))

        if (currentUser) {
          try {
            const p = await getProfile(currentUser.id)
            if (!cancelled) {
              dispatch(setProfile(p))
              profileCacheRef.current = currentUser.id
            }
          } catch (e) {
            console.error('Failed to load profile:', e)
          }
        }
      } catch (e) {
        console.error('Failed to get session:', e)
      } finally {
        if (!cancelled) dispatch(setLoading(false))
      }
    }

    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (cancelled) return
        const currentUser = session?.user ?? null
        dispatch(setUser(currentUser))

        if (currentUser) {
          if (profileCacheRef.current !== currentUser.id) {
            try {
              const p = await getProfile(currentUser.id)
              dispatch(setProfile(p))
              profileCacheRef.current = currentUser.id
            } catch (e) {
              console.error('Failed to load profile on change:', e)
            }
          }
        } else {
          dispatch(setProfile(null))
          profileCacheRef.current = null
        }
      }
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [dispatch])

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('Failed to sign out:', e)
    }
    dispatch(logoutAction())
    dispatch(resetBoard())
    profileCacheRef.current = null
  }, [dispatch])

  return { user, profile, isLoading, logout: handleLogout }
}
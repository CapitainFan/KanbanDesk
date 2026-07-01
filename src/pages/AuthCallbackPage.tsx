import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PageLoader } from '../components/shared/Spinner'
import toast from 'react-hot-toast'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    const handleAuth = async () => {
      try {
        // Try PKCE flow (code in URL search params)
        const searchParams = new URLSearchParams(window.location.search)
        const code = searchParams.get('code')

        if (code) {
          await supabase.auth.exchangeCodeForSession(code)
          if (!cancelled) {
            toast.success('Signed in successfully')
            window.history.replaceState(null, '', window.location.pathname)
            navigate('/dashboard', { replace: true })
          }
          return
        }

        // Try implicit flow (tokens in URL hash)
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        )
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken ?? '',
          })
        }

        const { data: { session } } = await supabase.auth.getSession()

        if (!cancelled) {
          if (session) {
            toast.success('Signed in successfully')
            window.history.replaceState(null, '', window.location.pathname)
            navigate('/dashboard', { replace: true })
          } else {
            toast.error('Authentication failed')
            navigate('/login', { replace: true })
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Auth callback error:', err)
          toast.error('Authentication failed')
          navigate('/login', { replace: true })
        }
      }
    }

    handleAuth()

    return () => { cancelled = true }
  }, [navigate])

  return <PageLoader />
}

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PageLoader } from '../components/shared/Spinner'
import toast from 'react-hot-toast'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuth = async () => {
      const params = new URLSearchParams(window.location.hash.replace('#', '?'))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? '',
        })
      }

      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        toast.success('Signed in successfully')
        navigate('/dashboard', { replace: true })
      } else {
        toast.error('Authentication failed')
        navigate('/login', { replace: true })
      }
    }

    handleAuth()
  }, [navigate])

  return <PageLoader />
}
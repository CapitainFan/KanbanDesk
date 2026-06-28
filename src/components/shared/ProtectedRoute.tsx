import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../../providers/AuthProvider'
import { PageLoader } from './Spinner'
import type { ReactNode } from 'react'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuthContext()

  if (isLoading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
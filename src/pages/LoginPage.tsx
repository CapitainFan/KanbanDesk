import { Navigate } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'
import { useAuthContext } from '../providers/AuthContext'
import { PageLoader } from '../components/shared/Spinner'

export function LoginPage() {
  const { user, isLoading } = useAuthContext()

  if (isLoading) return <PageLoader />
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="flex items-center justify-center min-h-dvh px-4">
      <div className="flex flex-col items-center w-full max-w-sm">
        <h1 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-6">
          KanbanDesk
        </h1>
        <LoginForm />
      </div>
    </div>
  )
}
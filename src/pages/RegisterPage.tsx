import { Navigate } from 'react-router-dom'
import { RegisterForm } from '../components/auth/RegisterForm'
import { useAuthContext } from '../providers/AuthProvider'
import { PageLoader } from '../components/shared/Spinner'

export function RegisterPage() {
  const { user, isLoading } = useAuthContext()

  if (isLoading) return <PageLoader />
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="flex items-center justify-center min-h-dvh px-4">
      <div className="flex flex-col items-center w-full max-w-sm">
        <h1 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-6">
          Create Account
        </h1>
        <RegisterForm />
      </div>
    </div>
  )
}
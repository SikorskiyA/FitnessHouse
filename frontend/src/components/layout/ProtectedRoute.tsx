import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface Props {
  children: React.ReactNode
  roles?: string[]  // Если передан — проверяем роль
}

export const ProtectedRoute = ({ children, roles }: Props) => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    // Редиректим на нужный дашборд если роль не подходит
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
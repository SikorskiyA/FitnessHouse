import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

// Редиректит на нужный дашборд в зависимости от роли
export const DashboardRedirect = () => {
  const { user } = useAuthStore()

  if (user?.role === 'Admin') return <Navigate to="/admin" replace />
  if (user?.role === 'Nutritionist') return <Navigate to="/nutritionist" replace />
  return <Navigate to="/client" replace />
}
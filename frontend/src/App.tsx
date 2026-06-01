import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { DashboardRedirect } from './components/layout/DashboardRedirect'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ClientDashboard } from './pages/client/ClientDashboard'
import { NutritionistDashboard } from './pages/nutritionist/NutritionistDashboard'
import { AdminDashboard } from './pages/admin/AdminDashboard'

function App() {
  return (
    <Routes>
      {/* Публичные маршруты */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Редирект на нужный дашборд */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardRedirect />
        </ProtectedRoute>
      } />

      {/* Кабинет клиента */}
      <Route path="/client/*" element={
        <ProtectedRoute roles={['Client']}>
          <ClientDashboard />
        </ProtectedRoute>
      } />

      {/* Кабинет нутрициолога */}
      <Route path="/nutritionist/*" element={
        <ProtectedRoute roles={['Nutritionist']}>
          <NutritionistDashboard />
        </ProtectedRoute>
      } />

      {/* Панель администратора */}
      <Route path="/admin/*" element={
        <ProtectedRoute roles={['Admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* По умолчанию редиректим на дашборд */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
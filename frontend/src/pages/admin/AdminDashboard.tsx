import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { AdminStats } from './AdminStats'
import { AdminUsers } from './AdminUsers'
import { AdminCreateNutritionist } from './AdminCreateNutritionist'
import { LayoutDashboard, Users, UserPlus, User } from 'lucide-react'
import { ProfilePage } from '../profile/ProfilePage'

const navItems = [
  { to: '/admin/stats', label: 'Статистика', icon: <LayoutDashboard size={18} /> },
  { to: '/admin/users', label: 'Пользователи', icon: <Users size={18} /> },
  { to: '/admin/nutritionists/create', label: 'Добавить нутрициолога', icon: <UserPlus size={18} /> },
  { to: '/admin/profile', label: 'Мой профиль', icon: <User size={18} /> },
]

export const AdminDashboard = () => (
  <AppLayout navItems={navItems}>
    <Routes>
      <Route path="/" element={<Navigate to="stats" replace />} />
      <Route path="stats" element={<AdminStats />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="nutritionists/create" element={<AdminCreateNutritionist />} />
      <Route path="profile" element={<ProfilePage />} />
    </Routes>
  </AppLayout>
)
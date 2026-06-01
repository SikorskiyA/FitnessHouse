import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { NutritionistSchedule } from './NutritionistSchedule'
import { NutritionistBookings } from './NutritionistBookings'
import { NutritionistConsultations } from './NutritionistConsultations'
import { Calendar, ClipboardList, Users, User } from 'lucide-react'
import { ProfilePage } from '../profile/ProfilePage'

const navItems = [
  { to: '/nutritionist/schedule', label: 'Моё расписание', icon: <Calendar size={18} /> },
  { to: '/nutritionist/bookings', label: 'Записи клиентов', icon: <Users size={18} /> },
  { to: '/nutritionist/consultations', label: 'Консультации', icon: <ClipboardList size={18} /> },
  { to: '/nutritionist/profile', label: 'Мой профиль', icon: <User size={18} /> },
]

export const NutritionistDashboard = () => (
  <AppLayout navItems={navItems}>
    <Routes>
      <Route path="/" element={<Navigate to="schedule" replace />} />
      <Route path="schedule" element={<NutritionistSchedule />} />
      <Route path="bookings" element={<NutritionistBookings />} />
      <Route path="consultations" element={<NutritionistConsultations />} />
      <Route path="profile" element={<ProfilePage />} />
    </Routes>
  </AppLayout>
)
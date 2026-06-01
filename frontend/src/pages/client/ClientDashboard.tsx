import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout'
import { ClientSchedule } from './ClientSchedule'
import { ClientBookings } from './ClientBookings'
import { ClientHistory } from './ClientHistory'
import { Calendar, ClipboardList, Clock, User } from 'lucide-react'
import { ProfilePage } from '../profile/ProfilePage'

const navItems = [
  { to: '/client/schedule', label: 'Запись на приём', icon: <Calendar size={18} /> },
  { to: '/client/bookings', label: 'Мои записи', icon: <Clock size={18} /> },
  { to: '/client/history', label: 'История консультаций', icon: <ClipboardList size={18} /> },
  { to: '/client/profile', label: 'Мой профиль', icon: <User size={18} /> },
]

export const ClientDashboard = () => (
  <AppLayout navItems={navItems}>
    <Routes>
      <Route path="/" element={<Navigate to="schedule" replace />} />
      <Route path="schedule" element={<ClientSchedule />} />
      <Route path="bookings" element={<ClientBookings />} />
      <Route path="history" element={<ClientHistory />} />
      <Route path="profile" element={<ProfilePage />} />
    </Routes>
  </AppLayout>
)
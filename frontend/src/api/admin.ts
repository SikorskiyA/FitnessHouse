import { api } from './client'
import { StatsResponse, UserListResponse } from '../types'

export const adminApi = {
  getStats: (from?: string, to?: string) =>
    api.get<StatsResponse>('/admin/stats', { params: { from, to } }),

  getUsers: (role?: string) =>
    api.get<UserListResponse[]>('/admin/users', { params: role ? { role } : {} }),

  setUserActive: (id: string, isActive: boolean) =>
    api.patch(`/admin/users/${id}/active`, isActive),

  createNutritionist: (data: {
    firstName: string
    lastName: string
    email: string
    password: string
    phone: string
    specialization: string
    bio?: string
  }) => api.post<UserListResponse>('/admin/nutritionists', data),
}
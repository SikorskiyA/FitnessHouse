import { api } from './client'

export const profileApi = {
  get: () => api.get('/profile'),

  update: (data: {
    firstName: string
    lastName: string
    phone: string
    specialization?: string
    bio?: string
  }) => api.put('/profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/profile/change-password', { currentPassword, newPassword }),
}
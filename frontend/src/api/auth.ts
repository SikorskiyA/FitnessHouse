import { api } from './client'
import { AuthResponse } from '../types'

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  register: (data: {
    firstName: string
    lastName: string
    email: string
    password: string
    phone: string
  }) => api.post<AuthResponse>('/auth/register', data),

  me: () => api.get('/auth/me'),
}
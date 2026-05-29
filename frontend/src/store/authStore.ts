import { create } from 'zustand'
import { AuthResponse } from '../types'

// Zustand — простое хранилище состояния
// Хранит данные текущего пользователя и токен
interface AuthStore {
  user: AuthResponse | null
  isAuthenticated: boolean
  login: (data: AuthResponse) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  // При загрузке страницы восстанавливаем пользователя из localStorage
  user: (() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })(),
  isAuthenticated: !!localStorage.getItem('token'),

  login: (data: AuthResponse) => {
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data))
    set({ user: data, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, isAuthenticated: false })
  }
}))
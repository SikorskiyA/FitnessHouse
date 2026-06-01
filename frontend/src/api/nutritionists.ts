import { api } from './client'

export interface NutritionistOption {
  id: string
  fullName: string
  specialization: string
  bio?: string
}

export const nutritionistsApi = {
  getAll: () => api.get<NutritionistOption[]>('/nutritionists')
}
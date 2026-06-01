import { api } from './client'
import type { SlotResponse } from '../types'

export const slotsApi = {
  getAvailable: (nutritionistId?: string) =>
    api.get<SlotResponse[]>('/slots/available', {
      params: nutritionistId ? { nutritionistId } : {}
    }),

  getMy: () => api.get<SlotResponse[]>('/slots/my'),

  create: (startTime: string, endTime: string) =>
    api.post<SlotResponse>('/slots', { startTime, endTime }),

  cancel: (id: string) => api.delete(`/slots/${id}`),
}
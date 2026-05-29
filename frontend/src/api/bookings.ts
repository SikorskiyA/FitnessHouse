import { api } from './client'
import { BookingResponse } from '../types'

export const bookingsApi = {
  create: (slotId: string) =>
    api.post<BookingResponse>('/bookings', { slotId }),

  getMy: () => api.get<BookingResponse[]>('/bookings/my'),

  getNutritionistBookings: () =>
    api.get<BookingResponse[]>('/bookings/nutritionist'),

  cancel: (id: string, reason?: string) =>
    api.delete(`/bookings/${id}`, { data: { reason } }),
}
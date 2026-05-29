import { api } from './client'
import { ConsultationResponse } from '../types'

export const consultationsApi = {
  getMy: () => api.get<ConsultationResponse[]>('/consultations/my'),

  getNutritionistConsultations: () =>
    api.get<ConsultationResponse[]>('/consultations/nutritionist'),

  update: (id: string, data: {
    status: number
    notes?: string
    recommendations?: string
  }) => api.put<ConsultationResponse>(`/consultations/${id}`, data),
}
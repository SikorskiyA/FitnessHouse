// Эти типы соответствуют DTO которые возвращает наш API

export interface AuthResponse {
  token: string
  expiresAt: string
  userId: string
  email: string
  fullName: string
  role: 'Admin' | 'Nutritionist' | 'Client'
}

export interface SlotResponse {
  id: string
  nutritionistId: string
  nutritionistName: string
  startTime: string
  endTime: string
  status: 0 | 1 | 2  // 0=Available, 1=Booked, 2=Cancelled
  statusName: string
}

export interface BookingResponse {
  id: string
  slotId: string
  startTime: string
  endTime: string
  nutritionistName: string
  clientName: string
  clientPhone: string
  clientEmail: string
  status: 0 | 1 | 2  // 0 - Confirmed, 1 - Cancelled, 2 - Completed 
  statusName: string
  createdAt: string
}

export interface ConsultationResponse {
  id: string
  bookingId: string
  clientName: string
  clientPhone: string
  clientEmail: string
  nutritionistName: string
  startTime: string
  endTime: string
  status: 0 | 1 | 2 | 3  // 0=Scheduled, 1=Completed, 2=NoShow, 3=Cancelled
  statusName: string
  notes?: string
  recommendations?: string
  completedAt?: string
}

export interface StatsResponse {
  totalClients: number
  totalNutritionists: number
  totalBookings: number
  activeBookings: number
  completedConsultations: number
  cancelledBookings: number
  availableSlots: number
  periodFrom: string
  periodTo: string
}

export interface UserListResponse {
  id: string
  fullName: string
  email: string
  phone: string
  role: string
  isActive: boolean
  createdAt: string
}
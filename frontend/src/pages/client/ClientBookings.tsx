import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingsApi } from '../../api/bookings'
import toast from 'react-hot-toast'
import { Clock, User, Calendar, XCircle } from 'lucide-react'

export const ClientBookings = () => {
  const queryClient = useQueryClient()
  const [cancelId, setCancelId] = useState<string | null>(null)

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', 'my'],
    queryFn: () => bookingsApi.getMy().then(r => r.data)
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id),
    onSuccess: () => {
      toast.success('Запись отменена')
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      setCancelId(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при отмене')
    }
  })

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric'
    })

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('ru-RU', {
      hour: '2-digit', minute: '2-digit'
    })

  const statusColors: Record<number, string> = {
    0: 'bg-emerald-100 text-emerald-700',
    1: 'bg-red-100 text-red-700',
    2: 'bg-gray-100 text-gray-700',
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Мои записи</h1>

      {!bookings?.length ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">У вас пока нет записей</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => (
            <div key={booking.id} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <User size={16} className="text-emerald-600" />
                    <span className="font-medium">{booking.nutritionistName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Calendar size={14} />
                    <span>{formatDate(booking.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Clock size={14} />
                    <span>{formatTime(booking.startTime)} — {formatTime(booking.endTime)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                    {booking.statusName}
                  </span>
                  {booking.status === 0 && (
                    <button
                      onClick={() => setCancelId(booking.id)}
                      className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 transition"
                    >
                      <XCircle size={14} />
                      Отменить
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Подтверждение отмены */}
      {cancelId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Отменить запись?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Отмена возможна не позже чем за 12 часов до консультации.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelId(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
              >
                Назад
              </button>
              <button
                onClick={() => cancelMutation.mutate(cancelId)}
                disabled={cancelMutation.isPending}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Отмена...' : 'Да, отменить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
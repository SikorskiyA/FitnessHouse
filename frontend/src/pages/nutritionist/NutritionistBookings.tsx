import { useQuery } from '@tanstack/react-query'
import { bookingsApi } from '../../api/bookings'
import { Calendar, Clock, User } from 'lucide-react'

export const NutritionistBookings = () => {
    const { data: bookings, isLoading } = useQuery({
        queryKey: ['bookings', 'nutritionist'],
        queryFn: () => bookingsApi.getNutritionistBookings().then(r => r.data)
    })

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric'
        })

    const formatTime = (dateStr: string) =>
        new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

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
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Записи клиентов</h1>
            {!bookings?.length ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                    <User size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Записей пока нет</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {bookings.map(booking => (
                        <div key={booking.id} className="bg-white rounded-2xl p-6 shadow-sm flex items-start justify-between">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 font-medium text-gray-900">
                                    <User size={16} className="text-emerald-600" />
                                    {booking.clientName}
                                </div>
                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                    <Calendar size={14} />
                                    {formatDate(booking.startTime)}
                                </div>
                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                    <Clock size={14} />
                                    {formatTime(booking.startTime)} — {formatTime(booking.endTime)}
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                                {booking.statusName}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
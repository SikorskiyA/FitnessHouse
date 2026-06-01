import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { bookingsApi } from '../../api/bookings'
import { Calendar, Clock, User, Phone, Mail, ChevronDown, ChevronUp } from 'lucide-react'

export const NutritionistBookings = () => {
    const [expandedId, setExpandedId] = useState<string | null>(null)

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
                <div className="space-y-3">
                    {bookings.map(booking => (
                        <div key={booking.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                            {/* Основная строка */}
                            <div className="p-5 flex items-center justify-between">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 font-medium text-gray-900">
                                        <User size={16} className="text-emerald-600" />
                                        {booking.clientName}
                                    </div>
                                    <div className="flex items-center gap-4 text-gray-500 text-sm">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={13} />
                                            {formatDate(booking.startTime)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={13} />
                                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                                        {booking.statusName}
                                    </span>
                                    {/* Кнопка раскрытия контактов */}
                                    <button
                                        onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                                        className="text-gray-400 hover:text-emerald-600 transition"
                                        title="Контакты клиента"
                                    >
                                        {expandedId === booking.id
                                            ? <ChevronUp size={18} />
                                            : <ChevronDown size={18} />
                                        }
                                    </button>
                                </div>
                            </div>

                            {/* Раскрывающийся блок с контактами */}
                            {expandedId === booking.id && (
                                <div className="px-5 pb-5 pt-0 border-t border-gray-100">
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3 mt-3">
                                        Контакты клиента
                                    </p>
                                    <div className="space-y-2">
                                        {booking.clientPhone && (
                                            <a
                                                href={`tel:${booking.clientPhone}`}
                                                className="flex items-center gap-2 text-sm text-gray-700 hover:text-emerald-600 transition">

                                                <Phone size={14} className="text-emerald-500" />
                                                {booking.clientPhone}
                                            </a>
                                        )}
                                        {booking.clientEmail && (
                                            <a
                                                href={`mailto:${booking.clientEmail}`}
                                                className="flex items-center gap-2 text-sm text-gray-700 hover:text-emerald-600 transition">

                                                <Mail size={14} className="text-emerald-500" />
                                                {booking.clientEmail}
                                            </a>
                                        )}
                                        {!booking.clientPhone && !booking.clientEmail && (
                                            <p className="text-sm text-gray-400">Контакты не указаны</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
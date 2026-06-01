import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { slotsApi } from '../../api/slots'
import toast from 'react-hot-toast'
import { Plus, Clock, Trash2, Calendar } from 'lucide-react'

interface SlotForm {
    startTime: string
    endTime: string
}

export const NutritionistSchedule = () => {
    const queryClient = useQueryClient()
    const [showForm, setShowForm] = useState(false)
    const [showCancelled, setShowCancelled] = useState(false)
    const { register, handleSubmit, reset, formState: { errors } } = useForm<SlotForm>()

    const { data: slots, isLoading } = useQuery({
        queryKey: ['slots', 'my'],
        queryFn: () => slotsApi.getMy().then(r => r.data)
    })

    const createMutation = useMutation({
        mutationFn: (data: SlotForm) => slotsApi.create(data.startTime, data.endTime),
        onSuccess: () => {
            toast.success('Слот добавлен в расписание')
            queryClient.invalidateQueries({ queryKey: ['slots'] })
            reset()
            setShowForm(false)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Ошибка при создании слота')
        }
    })

    const cancelMutation = useMutation({
        mutationFn: (id: string) => slotsApi.cancel(id),
        onSuccess: () => {
            toast.success('Слот удалён')
            queryClient.invalidateQueries({ queryKey: ['slots'] })
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Ошибка при удалении')
        }
    })

    // Сортировка: Занятые (1) → Свободные (0) → Отменённые (2)
    // Внутри каждой группы — по времени начала
    const sortedSlots = useMemo(() => {
        if (!slots) return []

        const order: Record<number, number> = { 1: 0, 0: 1, 2: 2 }

        return [...slots]
            .filter(s => showCancelled ? true : s.status !== 2)
            .sort((a, b) => {
                const orderDiff = order[a.status] - order[b.status]
                if (orderDiff !== 0) return orderDiff
                return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            })
    }, [slots, showCancelled])

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric', weekday: 'short'
        })

    const formatTime = (dateStr: string) =>
        new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

    const statusColors: Record<number, string> = {
        0: 'bg-emerald-100 text-emerald-700',
        1: 'bg-blue-100 text-blue-700',
        2: 'bg-gray-100 text-gray-400',
    }

    // Считаем количество по статусам для отображения
    const counts = useMemo(() => ({
        booked: slots?.filter(s => s.status === 1).length ?? 0,
        available: slots?.filter(s => s.status === 0).length ?? 0,
        cancelled: slots?.filter(s => s.status === 2).length ?? 0,
    }), [slots])

    if (isLoading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
    )

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Моё расписание</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl transition"
                >
                    <Plus size={18} />
                    Добавить слот
                </button>
            </div>

            {/* Счётчики по статусам */}
            {slots && slots.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-xl px-4 py-3 text-center">
                        <p className="text-2xl font-bold text-blue-600">{counts.booked}</p>
                        <p className="text-xs text-blue-500 mt-0.5">Занятых</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl px-4 py-3 text-center">
                        <p className="text-2xl font-bold text-emerald-600">{counts.available}</p>
                        <p className="text-xs text-emerald-500 mt-0.5">Свободных</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                        <p className="text-2xl font-bold text-gray-400">{counts.cancelled}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Отменённых</p>
                    </div>
                </div>
            )}

            {/* Чекбокс показа отменённых */}
            {counts.cancelled > 0 && (
                <label className="flex items-center gap-2 mb-4 cursor-pointer w-fit">
                    <input
                        type="checkbox"
                        checked={showCancelled}
                        onChange={e => setShowCancelled(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">
                        Показывать отменённые ({counts.cancelled})
                    </span>
                </label>
            )}

            {!sortedSlots.length ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                    <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">Расписание пустое</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl hover:bg-emerald-600 transition"
                    >
                        Добавить первый слот
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedSlots.map(slot => (
                        <div
                            key={slot.id}
                            className={`bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between ${slot.status === 2 ? 'opacity-50' : ''
                                }`}
                        >
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-gray-600 text-sm">
                                    <Calendar size={14} />
                                    <span>{formatDate(slot.startTime)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-900 font-medium">
                                    <Clock size={16} className="text-emerald-600" />
                                    <span>{formatTime(slot.startTime)} — {formatTime(slot.endTime)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[slot.status]}`}>
                                    {slot.statusName}
                                </span>
                                {slot.status === 0 && (
                                    <button
                                        onClick={() => cancelMutation.mutate(slot.id)}
                                        disabled={cancelMutation.isPending}
                                        className="text-gray-400 hover:text-red-500 transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Форма создания слота */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Новый слот</h3>
                        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Начало консультации
                                </label>
                                <input
                                    {...register('startTime', { required: 'Укажите время начала' })}
                                    type="datetime-local"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Конец консультации
                                </label>
                                <input
                                    {...register('endTime', { required: 'Укажите время окончания' })}
                                    type="datetime-local"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime.message}</p>}
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); reset() }}
                                    className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition disabled:opacity-50"
                                >
                                    {createMutation.isPending ? 'Создание...' : 'Создать'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
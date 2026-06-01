import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { consultationsApi } from '../../api/consultations'
import type { ConsultationResponse } from '../../types'
import toast from 'react-hot-toast'
import { FileText, Calendar, Clock, User, Edit2, Phone, Mail } from 'lucide-react'

interface UpdateForm {
    status: number
    notes: string
    recommendations: string
}

export const NutritionistConsultations = () => {
    const queryClient = useQueryClient()
    const [selected, setSelected] = useState<ConsultationResponse | null>(null)
    const { register, handleSubmit, reset } = useForm<UpdateForm>()

    const { data: consultations, isLoading } = useQuery({
        queryKey: ['consultations', 'nutritionist'],
        queryFn: () => consultationsApi.getNutritionistConsultations().then(r => r.data)
    })

    const updateMutation = useMutation({
        mutationFn: (data: UpdateForm) =>
            consultationsApi.update(selected!.id, {
                status: Number(data.status),
                notes: data.notes,
                recommendations: data.recommendations
            }),
        onSuccess: () => {
            toast.success('Консультация обновлена')
            queryClient.invalidateQueries({ queryKey: ['consultations'] })
            setSelected(null)
            reset()
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Ошибка обновления')
        }
    })

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

    const formatTime = (dateStr: string) =>
        new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

    const statusColors: Record<number, string> = {
        0: 'bg-blue-100 text-blue-700',
        1: 'bg-emerald-100 text-emerald-700',
        2: 'bg-orange-100 text-orange-700',
        3: 'bg-red-100 text-red-700',
    }

    if (isLoading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
    )

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Консультации</h1>

            {!consultations?.length ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                    <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Консультаций пока нет</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {consultations.map(c => (
                        <div key={c.id} className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 font-medium text-gray-900">
                                        <User size={16} className="text-emerald-600" />
                                        {c.clientName}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {c.clientPhone && (
                                            <a href={`tel:${c.clientPhone}`}
                                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-600 transition">
                                                <Phone size={11} />
                                                {c.clientPhone}
                                            </a>
                                        )}
                                        {c.clientEmail && (
                                            <a href={`mailto:${c.clientEmail}`}
                                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-600 transition">
                                                <Mail size={11} />
                                                {c.clientEmail}
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-gray-500 text-sm">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={13} />{formatDate(c.startTime)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={13} />{formatTime(c.startTime)} - {formatTime(c.endTime)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[c.status]}`}>
                                        {c.statusName}
                                    </span>
                                    {c.status === 0 && (
                                        <button
                                            onClick={() => { setSelected(c); reset({ notes: c.notes || '', recommendations: c.recommendations || '', status: 1 }) }}
                                            className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-800 transition"
                                        >
                                            <Edit2 size={14} />
                                            Заполнить
                                        </button>
                                    )}
                                </div>
                            </div>

                            {c.notes && (
                                <div className="bg-gray-50 rounded-xl p-3 mb-2">
                                    <p className="text-xs text-gray-500 mb-1">Заметки</p>
                                    <p className="text-sm text-gray-700">{c.notes}</p>
                                </div>
                            )}
                            {c.recommendations && (
                                <div className="bg-emerald-50 rounded-xl p-3">
                                    <p className="text-xs text-emerald-600 mb-1">Рекомендации</p>
                                    <p className="text-sm text-gray-700">{c.recommendations}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Форма заполнения консультации */}
            {selected && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Итоги консультации</h3>
                        <p className="text-sm text-gray-500 mb-4">{selected.clientName}</p>
                        <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                                <select
                                    {...register('status')}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value={1}>Проведена</option>
                                    <option value={2}>Неявка клиента</option>
                                    <option value={3}>Отменена</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
                                <textarea
                                    {...register('notes')}
                                    rows={3}
                                    placeholder="Наблюдения во время консультации..."
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Рекомендации</label>
                                <textarea
                                    {...register('recommendations')}
                                    rows={3}
                                    placeholder="Рекомендации по питанию..."
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setSelected(null); reset() }}
                                    className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateMutation.isPending}
                                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition disabled:opacity-50"
                                >
                                    {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
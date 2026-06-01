import { useQuery } from '@tanstack/react-query'
import { consultationsApi } from '../../api/consultations'
import { Calendar, Clock, FileText, User } from 'lucide-react'

export const ClientHistory = () => {
  const { data: consultations, isLoading } = useQuery({
    queryKey: ['consultations', 'my'],
    queryFn: () => consultationsApi.getMy().then(r => r.data)
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">История консультаций</h1>

      {!consultations?.length ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">История консультаций пуста</p>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map(consultation => (
            <div key={consultation.id} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-700">
                    <User size={16} className="text-emerald-600" />
                    <span className="font-medium">{consultation.nutritionistName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Calendar size={14} />
                    <span>{formatDate(consultation.startTime)}</span>
                    <Clock size={14} className="ml-2" />
                    <span>{formatTime(consultation.startTime)}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[consultation.status]}`}>
                  {consultation.statusName}
                </span>
              </div>

              {/* Заметки нутрициолога */}
              {consultation.notes && (
                <div className="bg-gray-50 rounded-xl p-4 mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Заметки специалиста</p>
                  <p className="text-gray-700 text-sm">{consultation.notes}</p>
                </div>
              )}

              {consultation.recommendations && (
                <div className="bg-emerald-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-emerald-600 mb-1">Рекомендации</p>
                  <p className="text-gray-700 text-sm">{consultation.recommendations}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
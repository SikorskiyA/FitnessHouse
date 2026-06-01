import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api/admin'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Users, Calendar, CheckCircle, XCircle, Clock, UserCheck } from 'lucide-react'

export const AdminStats = () => {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'stats', from, to],
    queryFn: () => adminApi.getStats(from || undefined, to || undefined).then(r => r.data)
  })

  const cards = stats ? [
    { label: 'Клиентов', value: stats.totalClients, icon: <Users size={20} />, color: 'bg-blue-500' },
    { label: 'Нутрициологов', value: stats.totalNutritionists, icon: <UserCheck size={20} />, color: 'bg-purple-500' },
    { label: 'Всего записей', value: stats.totalBookings, icon: <Calendar size={20} />, color: 'bg-emerald-500' },
    { label: 'Активных записей', value: stats.activeBookings, icon: <Clock size={20} />, color: 'bg-orange-500' },
    { label: 'Проведено консультаций', value: stats.completedConsultations, icon: <CheckCircle size={20} />, color: 'bg-teal-500' },
    { label: 'Отменено записей', value: stats.cancelledBookings, icon: <XCircle size={20} />, color: 'bg-red-500' },
  ] : []

  const chartData = stats ? [
    { name: 'Активные', value: stats.activeBookings, color: '#10b981' },
    { name: 'Завершённые', value: stats.completedConsultations, color: '#6366f1' },
    { name: 'Отменённые', value: stats.cancelledBookings, color: '#ef4444' },
    { name: 'Свободных слотов', value: stats.availableSlots, color: '#f59e0b' },
  ] : []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Статистика</h1>

      {/* Фильтр по периоду */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">С</label>
          <input
            type="datetime-local"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">По</label>
          <input
            type="datetime-local"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          onClick={() => refetch()}
          className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
        >
          Применить
        </button>
        <button
          onClick={() => { setFrom(''); setTo('') }}
          className="px-6 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition"
        >
          Сбросить
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Карточки */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {cards.map(card => (
              <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className={`${card.color} p-3 rounded-xl text-white`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-sm text-gray-500">{card.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* График */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Сводная диаграмма</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {stats && (
            <p className="text-sm text-gray-400 mt-3 text-right">
              Период: {new Date(stats.periodFrom).toLocaleDateString('ru-RU')} — {new Date(stats.periodTo).toLocaleDateString('ru-RU')}
            </p>
          )}
        </>
      )}
    </div>
  )
}
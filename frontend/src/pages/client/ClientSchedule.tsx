import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { slotsApi } from '../../api/slots'
import { bookingsApi } from '../../api/bookings'
import { nutritionistsApi } from '../../api/nutritionists'
import type { SlotResponse } from '../../types'
import toast from 'react-hot-toast'
import { Calendar, Clock, User, X, ChevronDown } from 'lucide-react'

export const ClientSchedule = () => {
  const queryClient = useQueryClient()
  const [selectedSlot, setSelectedSlot] = useState<SlotResponse | null>(null)

  // Фильтры по дате/времени
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [timeFrom, setTimeFrom] = useState('')
  const [timeTo, setTimeTo] = useState('')

  // Фильтр по нутрициологу - автокомплит
  const [nutritionistSearch, setNutritionistSearch] = useState('')
  const [selectedNutritionistId, setSelectedNutritionistId] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [successBooking, setSuccessBooking] = useState<{
    nutritionistName: string
    startTime: string
    endTime: string
  } | null>(null)

  // Закрываем дропдаун при клике вне него
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: slots, isLoading } = useQuery({
    queryKey: ['slots', 'available'],
    queryFn: () => slotsApi.getAvailable().then(r => r.data)
  })

  // Загружаем список нутрициологов для автокомплита
  const { data: nutritionists } = useQuery({
    queryKey: ['nutritionists'],
    queryFn: () => nutritionistsApi.getAll().then(r => r.data)
  })

  // Фильтруем нутрициологов по введённому тексту
  const filteredNutritionists = useMemo(() => {
    if (!nutritionists || !nutritionistSearch.trim()) return nutritionists ?? []
    const q = nutritionistSearch.toLowerCase()
    return nutritionists.filter(n =>
      n.fullName.toLowerCase().includes(q) ||
      n.specialization.toLowerCase().includes(q)
    )
  }, [nutritionists, nutritionistSearch])

  // Обнови bookMutation
  const bookMutation = useMutation({
    mutationFn: (slotId: string) => bookingsApi.create(slotId),
    onSuccess: () => {
      setSuccessBooking({
        nutritionistName: selectedSlot!.nutritionistName,
        startTime: selectedSlot!.startTime,
        endTime: selectedSlot!.endTime,
      })
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setSelectedSlot(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при записи')
    }
  })

  // Выбор нутрициолога из дропдауна
  const handleSelectNutritionist = (id: string, name: string) => {
    setSelectedNutritionistId(id)
    setNutritionistSearch(name)
    setShowDropdown(false)
  }

  // Сброс фильтра нутрициолога
  const clearNutritionist = () => {
    setSelectedNutritionistId(null)
    setNutritionistSearch('')
  }

  // Применяем все фильтры
  const filteredSlots = useMemo(() => {
    if (!slots) return []
    return slots.filter(slot => {
      const start = new Date(slot.startTime)

      if (selectedNutritionistId && slot.nutritionistId !== selectedNutritionistId)
        return false

      if (dateFrom) {
        const from = new Date(dateFrom)
        from.setHours(0, 0, 0, 0)
        if (start < from) return false
      }
      if (dateTo) {
        const to = new Date(dateTo)
        to.setHours(23, 59, 59, 999)
        if (start > to) return false
      }
      if (timeFrom) {
        const [h, m] = timeFrom.split(':').map(Number)
        if (start.getHours() < h || (start.getHours() === h && start.getMinutes() < m))
          return false
      }
      if (timeTo) {
        const [h, m] = timeTo.split(':').map(Number)
        if (start.getHours() > h || (start.getHours() === h && start.getMinutes() > m))
          return false
      }

      return true
    })
  }, [slots, selectedNutritionistId, dateFrom, dateTo, timeFrom, timeTo])

  const hasFilters = dateFrom || dateTo || timeFrom || timeTo || selectedNutritionistId

  const resetFilters = () => {
    setDateFrom('')
    setDateTo('')
    setTimeFrom('')
    setTimeTo('')
    clearNutritionist()
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', {
      weekday: 'long', day: 'numeric', month: 'long'
    })

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  const groupedSlots = filteredSlots.reduce((acc, slot) => {
    const date = formatDate(slot.startTime)
    if (!acc[date]) acc[date] = []
    acc[date].push(slot)
    return acc
  }, {} as Record<string, SlotResponse[]>)

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Запись на консультацию</h1>

      {/* Блок фильтров */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 space-y-4">

        {/* Фильтр по нутрициологу - автокомплит */}
        <div ref={dropdownRef} className="relative">
          <label className="block text-xs font-medium text-gray-500 mb-1">Нутрициолог</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={nutritionistSearch}
              onChange={e => {
                setNutritionistSearch(e.target.value)
                setSelectedNutritionistId(null)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Начните вводить ФИО или специализацию..."
              className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {/* Кнопка очистки */}
            {nutritionistSearch && (
              <button
                onClick={clearNutritionist}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
            {/* Стрелка */}
            {!nutritionistSearch && (
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            )}
          </div>

          {/* Дропдаун со списком */}
          {showDropdown && filteredNutritionists.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
              {filteredNutritionists.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleSelectNutritionist(n.id, n.fullName)}
                  className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition border-b border-gray-50 last:border-0"
                >
                  <p className="text-sm font-medium text-gray-900">{n.fullName}</p>
                  <p className="text-xs text-gray-500">{n.specialization}</p>
                </button>
              ))}
            </div>
          )}

          {/* Нет результатов */}
          {showDropdown && nutritionistSearch && filteredNutritionists.length === 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
              <p className="text-sm text-gray-400">Нутрициологи не найдены</p>
            </div>
          )}
        </div>

        {/* Фильтры по дате и времени */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Дата с</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Дата по</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Время с</label>
            <input
              type="time"
              value={timeFrom}
              onChange={e => setTimeFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Время по</label>
            <input
              type="time"
              value={timeTo}
              onChange={e => setTimeTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <X size={14} />
              Сбросить всё
            </button>
          )}
        </div>

        {hasFilters && (
          <p className="text-xs text-gray-400">Найдено слотов: {filteredSlots.length}</p>
        )}
      </div>

      {/* Слоты */}
      {!filteredSlots.length ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">
            {hasFilters ? 'Нет слотов по выбранным фильтрам' : 'Свободных слотов пока нет'}
          </p>
          {hasFilters && (
            <button onClick={resetFilters} className="mt-3 text-emerald-600 text-sm hover:underline">
              Сбросить фильтры
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSlots).map(([date, daySlots]) => (
            <div key={date} className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4 capitalize">{date}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {daySlots.map(slot => (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className="border-2 border-gray-100 hover:border-emerald-400 rounded-xl p-4 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2 text-emerald-600 mb-2">
                      <Clock size={16} />
                      <span className="font-semibold">
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <User size={14} />
                      <span>{slot.nutritionistName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно подтверждения */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Подтвердите запись</h3>
            <div className="bg-emerald-50 rounded-xl p-4 mb-6 space-y-2">
              <div className="flex items-center gap-2 text-gray-700">
                <User size={16} className="text-emerald-600" />
                <span>{selectedSlot.nutritionistName}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar size={16} className="text-emerald-600" />
                <span>{formatDate(selectedSlot.startTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Clock size={16} className="text-emerald-600" />
                <span>{formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedSlot(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
              >
                Отмена
              </button>
              <button
                onClick={() => bookMutation.mutate(selectedSlot.id)}
                disabled={bookMutation.isPending}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition disabled:opacity-50"
              >
                {bookMutation.isPending ? 'Запись...' : 'Записаться'}
              </button>
            </div>
          </div>
        </div>

      )}
      {/* Модальное окно успешной записи - ФТ-06 */}
      {successBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md text-center">
            {/* Иконка успеха */}
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-1">Запись подтверждена!</h3>
            <p className="text-gray-500 text-sm mb-6">Вы успешно записались на консультацию</p>

            {/* Детали записи */}
            <div className="bg-emerald-50 rounded-xl p-4 text-left space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Нутрициолог</p>
                  <p className="font-medium text-gray-900">{successBooking.nutritionistName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Дата</p>
                  <p className="font-medium text-gray-900">{formatDate(successBooking.startTime)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Время</p>
                  <p className="font-medium text-gray-900">
                    {formatTime(successBooking.startTime)} - {formatTime(successBooking.endTime)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSuccessBooking(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
              >
                Закрыть
              </button>
              <button
                onClick={() => {
                  setSuccessBooking(null)
                  window.location.href = '/client/bookings'
                }}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition"
              >
                Мои записи
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { adminApi } from '../../api/admin'
import toast from 'react-hot-toast'
import { UserPlus } from 'lucide-react'

interface NutritionistForm {
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  specialization: string
  bio: string
}

export const AdminCreateNutritionist = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<NutritionistForm>()

  const mutation = useMutation({
    mutationFn: (data: NutritionistForm) => adminApi.createNutritionist(data),
    onSuccess: () => {
      toast.success('Нутрициолог успешно добавлен!')
      reset()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка создания')
    }
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Добавить нутрициолога</h1>

      <div className="bg-white rounded-2xl p-6 shadow-sm max-w-2xl">
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
              <input
                {...register('firstName', { required: 'Обязательное поле' })}
                placeholder="Мария"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
              <input
                {...register('lastName', { required: 'Обязательное поле' })}
                placeholder="Петрова"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              {...register('email', { required: 'Обязательное поле' })}
              type="email"
              placeholder="maria@fitnesshouse.ru"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
            <input
              {...register('password', { required: 'Обязательное поле', minLength: { value: 6, message: 'Минимум 6 символов' } })}
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
            <input
              {...register('phone', { required: 'Обязательное поле' })}
              placeholder="+79001234567"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Специализация</label>
            <input
              {...register('specialization', { required: 'Обязательное поле' })}
              placeholder="Спортивное питание"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.specialization && <p className="text-red-500 text-xs mt-1">{errors.specialization.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">О специалисте</label>
            <textarea
              {...register('bio')}
              rows={3}
              placeholder="Краткое описание специалиста..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white py-2.5 rounded-xl transition"
          >
            <UserPlus size={18} />
            {mutation.isPending ? 'Создание...' : 'Создать нутрициолога'}
          </button>
        </form>
      </div>
    </div>
  )
}
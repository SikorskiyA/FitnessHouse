import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { profileApi } from '../../api/profile'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { User, Lock, Save } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface ProfileForm {
    firstName: string
    lastName: string
    phone: string
    specialization?: string
    bio?: string
}

interface PasswordForm {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

export const ProfilePage = () => {
    const { user } = useAuthStore()
    const [tab, setTab] = useState<'profile' | 'password'>('profile')

    const queryClient = useQueryClient() // ← добавить в начало компонента

    // Заменить useQuery на такой — refetchOnMount: 'always' означает
    // что при каждом заходе на страницу данные будут загружаться заново из БД
    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: () => profileApi.get().then(r => r.data),
        refetchOnMount: 'always',   // ← добавить
        staleTime: 0,               // ← добавить — данные всегда считаются устаревшими
    })

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>()
    const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd, watch, formState: { errors: pwdErrors } } = useForm<PasswordForm>()
    const newPassword = watch('newPassword')

    // Заполняем форму данными профиля когда они загрузились
    useEffect(() => {
        if (profile) {
            reset({
                firstName: profile.firstName,
                lastName: profile.lastName,
                phone: profile.phone || '',
                specialization: profile.extra?.specialization || '',
                bio: profile.extra?.bio || '',
            })
        }
    }, [profile, reset])

    const updateMutation = useMutation({
        mutationFn: (data: ProfileForm) => profileApi.update(data),
        onSuccess: () => {
            toast.success('Профиль обновлён')
            queryClient.invalidateQueries({ queryKey: ['profile'] }) // ← добавить
        },
        onError: () => toast.error('Ошибка обновления профиля')
    })

    const passwordMutation = useMutation({
        mutationFn: (data: PasswordForm) =>
            profileApi.changePassword(data.currentPassword, data.newPassword),
        onSuccess: () => {
            toast.success('Пароль изменён')
            resetPwd()
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Ошибка смены пароля')
        }
    })

    if (isLoading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
    )

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Мой профиль</h1>

            {/* Табы */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setTab('profile')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'profile'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    <User size={16} />
                    Личные данные
                </button>
                <button
                    onClick={() => setTab('password')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'password'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    <Lock size={16} />
                    Сменить пароль
                </button>
            </div>

            {tab === 'profile' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    {/* Аватар */}
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-emerald-700 text-2xl font-bold">
                                {profile?.firstName?.charAt(0)}
                            </span>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">{profile?.fullName}</p>
                            <p className="text-sm text-gray-500">{profile?.email}</p>
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                                {profile?.role === 'Client' ? 'Клиент' : profile?.role === 'Nutritionist' ? 'Нутрициолог' : 'Администратор'}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                                <input
                                    {...register('firstName', { required: 'Обязательное поле' })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                                <input
                                    {...register('lastName', { required: 'Обязательное поле' })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                            <input
                                {...register('phone')}
                                placeholder="+79001234567"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        {/* Дополнительные поля для нутрициолога */}
                        {user?.role === 'Nutritionist' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Специализация</label>
                                    <input
                                        {...register('specialization')}
                                        placeholder="Спортивное питание"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">О себе</label>
                                    <textarea
                                        {...register('bio')}
                                        rows={3}
                                        placeholder="Расскажите о своём опыте..."
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                    />
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white px-6 py-2.5 rounded-xl transition"
                        >
                            <Save size={16} />
                            {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </form>
                </div>
            )}

            {tab === 'password' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <form onSubmit={handlePwd(d => passwordMutation.mutate(d))} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Текущий пароль</label>
                            <input
                                {...regPwd('currentPassword', { required: 'Введите текущий пароль' })}
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            {pwdErrors.currentPassword && <p className="text-red-500 text-xs mt-1">{pwdErrors.currentPassword.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
                            <input
                                {...regPwd('newPassword', {
                                    required: 'Введите новый пароль',
                                    minLength: { value: 6, message: 'Минимум 6 символов' }
                                })}
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            {pwdErrors.newPassword && <p className="text-red-500 text-xs mt-1">{pwdErrors.newPassword.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Повторите новый пароль</label>
                            <input
                                {...regPwd('confirmPassword', {
                                    required: 'Повторите пароль',
                                    validate: v => v === newPassword || 'Пароли не совпадают'
                                })}
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            {pwdErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{pwdErrors.confirmPassword.message}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={passwordMutation.isPending}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white px-6 py-2.5 rounded-xl transition"
                        >
                            <Lock size={16} />
                            {passwordMutation.isPending ? 'Сохранение...' : 'Сменить пароль'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    )
}
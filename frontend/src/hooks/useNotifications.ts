import { useEffect, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

export const useNotifications = () => {
  const { isAuthenticated } = useAuthStore()

  const connect = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/notifications', {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()  // Автоматически переподключается при обрыве
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    // Обработчик входящих уведомлений
    connection.on('ReceiveNotification', (notification: {
      type: string
      payload: { message: string }
      createdAt: string
    }) => {
      switch (notification.type) {
        case 'NewBooking':
          toast.success(notification.payload.message, {
            duration: 6000,
            icon: '📅',
          })
          break
        case 'BookingCancelled':
          toast.error(notification.payload.message, {
            duration: 6000,
            icon: '❌',
          })
          break
        default:
          toast(notification.payload.message, { duration: 5000 })
      }
    })

    try {
      await connection.start()
      console.log('SignalR подключён')
    } catch (err) {
      console.warn('SignalR ошибка подключения:', err)
    }

    // Возвращаем функцию для отключения
    return () => {
      connection.stop()
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    let cleanup: (() => void) | undefined

    connect().then(fn => {
      cleanup = fn
    })

    return () => {
      cleanup?.()
    }
  }, [isAuthenticated, connect])
}
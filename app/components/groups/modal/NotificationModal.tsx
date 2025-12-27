'use client'

// Las notificaciones programadas funcionan correctamente:
// - Se guardan con scheduled_for en la BD
// - No se muestran hasta que llegue la hora programada
// - Al hacer refresh después de la hora, aparecen automáticamente

import { useState, useRef, useEffect, useMemo } from 'react'
import { FiBell, FiX, FiCalendar, FiClock, FiAlertCircle } from 'react-icons/fi'
import { groupsApi, type CreateNotificationDTO, NotificationPriority } from '@/app/lib/groups'
import SimpleCalendarCompact from '@/app/ui/calendar/SimpleCalendarCompact'
import TimePicker from '@/app/ui/calendar/timepicker'
import { useTranslations } from 'next-intl'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: number
  groupName: string
}

// Helper: obtener hora redondeada al siguiente intervalo de 30 min + 30 min extra
function getSmartDefaultTime(): string {
  const now = new Date()
  const minutes = now.getMinutes()
  const hours = now.getHours()

  // Redondear al siguiente bloque de 30 + 30 min extra de margen
  let nextMinutes: number
  let nextHours = hours

  if (minutes < 30) {
    nextMinutes = 30 // siguiente :30
  } else {
    nextMinutes = 0 // siguiente :00
    nextHours += 1
  }

  // Añadir 30 min extra de margen
  nextMinutes += 30
  if (nextMinutes >= 60) {
    nextMinutes -= 60
    nextHours += 1
  }

  // Si pasa de las 24h, ajustar
  if (nextHours >= 24) {
    nextHours = nextHours - 24
  }

  return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`
}

// Helper: obtener hora mínima para hoy (ahora + 5 min, redondeado)
function getMinTimeForToday(): string {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 10) // 10 min de margen

  const hours = now.getHours()
  const minutes = now.getMinutes() < 30 ? 30 : 0
  const adjustedHours = now.getMinutes() < 30 ? hours : hours + 1

  return `${String(adjustedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function NotificationModal({ isOpen, onClose, groupId, groupName }: NotificationModalProps) {
  const t = useTranslations('notifications')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState('09:00')
  const [scheduleType, setScheduleType] = useState<'now' | 'scheduled'>('now')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Estados para controlar dropdowns
  const [showCalendar, setShowCalendar] = useState(false)

  const calendarRef = useRef<HTMLDivElement>(null)

  // Cerrar calendar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-inicializar fecha y hora cuando se cambia a modo programado
  useEffect(() => {
    if (scheduleType === 'scheduled' && !selectedDate) {
      setSelectedDate(new Date())
      setSelectedTime(getSmartDefaultTime())
    }
  }, [scheduleType, selectedDate])

  // Formatear fecha para mostrar
  const formatDate = (date: Date | null) => {
    if (!date) return t('modal.selectDate')

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()

    const isTomorrow =
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear()

    if (isToday) return t('modal.today')
    if (isTomorrow) return t('modal.tomorrow')

    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    })
  }

  // Calcular la fecha/hora programada
  const scheduledDateTime = useMemo(() => {
    if (scheduleType !== 'scheduled' || !selectedDate) return null

    const [hours, minutes] = selectedTime.split(':').map(Number)
    const dateTime = new Date(selectedDate)
    dateTime.setHours(hours, minutes, 0, 0)
    return dateTime
  }, [scheduleType, selectedDate, selectedTime])

  // Validar que la fecha/hora sea válida (al menos 5 minutos en el futuro)
  const validationResult = useMemo(() => {
    if (scheduleType === 'now') return { valid: true, message: null }
    if (!selectedDate) return { valid: false, message: t('validation.selectDate') }
    if (!scheduledDateTime) return { valid: false, message: t('validation.invalidDateTime') }

    const now = new Date()
    const minDateTime = new Date(now.getTime() + 5 * 60000) // +5 minutos

    if (scheduledDateTime < minDateTime) {
      return {
        valid: false,
        message: t('validation.timeMinFuture'),
      }
    }

    return { valid: true, message: null }
  }, [scheduleType, selectedDate, scheduledDateTime, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validationResult.valid) {
      setError(validationResult.message)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data: CreateNotificationDTO = {
        title,
        message,
        priority: priority as NotificationPriority,
      }

      // Construir scheduled_for si es programada
      if (scheduleType === 'scheduled' && scheduledDateTime) {
        data.scheduled_for = scheduledDateTime.toISOString()
      }

      await groupsApi.createNotification(groupId, data)

      setSuccess(true)
      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating notification'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setMessage('')
    setPriority('medium')
    setSelectedDate(null)
    setSelectedTime('09:00')
    setScheduleType('now')
    setError(null)
    setSuccess(false)
    setShowCalendar(false)
    onClose()
  }

  if (!isOpen) return null

  const today = new Date()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#151b23] rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-[#151b23] z-10">
          <div className="flex items-center gap-2">
            <FiBell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('modal.title')}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-3 space-y-3">
          {/* Group Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-2">
            <p className="text-[10px] text-gray-600 dark:text-gray-400">Grupo:</p>
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{groupName}</p>
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t('modal.titleLabel')}
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
              placeholder={t('modal.titlePlaceholder')}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Message */}
          <div>
            <label
              htmlFor="message"
              className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t('modal.messageLabel')}
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={3}
              maxLength={500}
              placeholder={t('modal.messagePlaceholder')}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-[10px] text-gray-400 mt-0.5 text-right">{message.length}/500</p>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('modal.priority')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    priority === p
                      ? p === 'high'
                        ? 'bg-red-600 text-white'
                        : p === 'medium'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {t(`priority.${p}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('modal.scheduling')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScheduleType('now')}
                className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                  scheduleType === 'now'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <FiClock className="w-3.5 h-3.5" />
                {t('modal.sendNow')}
              </button>
              <button
                type="button"
                onClick={() => setScheduleType('scheduled')}
                className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                  scheduleType === 'scheduled'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <FiCalendar className="w-3.5 h-3.5" />
                {t('modal.schedule')}
              </button>
            </div>
          </div>

          {/* Scheduled DateTime (solo si es programada) */}
          {scheduleType === 'scheduled' && (
            <div className="space-y-2 p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-800">
              <div className="grid grid-cols-2 gap-2">
                {/* Fecha con Calendario */}
                <div className="relative" ref={calendarRef}>
                  <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t('modal.dateLabel')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between"
                  >
                    <span className="truncate">{formatDate(selectedDate)}</span>
                    <FiCalendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  </button>

                  {/* Calendario hacia arriba */}
                  {showCalendar && (
                    <div className="absolute z-20 bottom-full mb-1 left-0">
                      <SimpleCalendarCompact
                        selectedDate={selectedDate}
                        minDate={today}
                        onSelect={(date) => {
                          setSelectedDate(date)
                          setShowCalendar(false)
                          // Si cambia a hoy, ajustar la hora si es necesario
                          if (date) {
                            const isToday =
                              date.getDate() === today.getDate() &&
                              date.getMonth() === today.getMonth() &&
                              date.getFullYear() === today.getFullYear()
                            if (isToday) {
                              const minTime = getMinTimeForToday()
                              if (selectedTime < minTime) {
                                setSelectedTime(getSmartDefaultTime())
                              }
                            }
                          }
                        }}
                        onClose={() => setShowCalendar(false)}
                      />
                    </div>
                  )}
                </div>

                {/* Hora */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t('modal.timeLabel')}
                  </label>
                  <TimePicker
                    value={selectedTime}
                    onChange={setSelectedTime}
                    openTo="left"
                    openDirection="up"
                    minTime={getMinTimeForToday()}
                    forDate={selectedDate}
                  />
                </div>
              </div>

              {/* Preview de la fecha/hora programada */}
              {scheduledDateTime && validationResult.valid && (
                <div className="flex items-center gap-1.5 text-[10px] text-green-600 dark:text-green-400">
                  <FiClock className="w-3 h-3" />
                  <span>
                    {t('modal.willSendAt', {
                      date: scheduledDateTime.toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      }),
                      time: selectedTime,
                    })}
                  </span>
                </div>
              )}

              {/* Warning si la hora no es válida */}
              {!validationResult.valid && validationResult.message && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400">
                  <FiAlertCircle className="w-3 h-3" />
                  <span>{validationResult.message}</span>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-2">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-2">
              <p className="text-xs text-green-600 dark:text-green-400">
                {scheduleType === 'now' ? t('toast.sentSuccess') : t('toast.scheduledSuccess')}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {t('modal.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || success || !validationResult.valid}
              className="flex-1 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
            >
              {loading ? (
                t('modal.creating')
              ) : success ? (
                t('modal.created')
              ) : scheduleType === 'now' ? (
                <>
                  <FiBell className="w-3 h-3" />
                  {t('modal.send')}
                </>
              ) : (
                <>
                  <FiCalendar className="w-3 h-3" />
                  {t('modal.schedule')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

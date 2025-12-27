'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { FiBell, FiX, FiCalendar, FiClock, FiAlertCircle, FiLink } from 'react-icons/fi'
import { apiClient } from '@/app/lib/apiClient'
import { API_BASE_URL } from '@/app/lib/env'
import SimpleCalendarCompact from '@/app/ui/calendar/SimpleCalendarCompact'
import TimePicker from '@/app/ui/calendar/timepicker'
import { toast } from 'react-hot-toast'

const API_URL = API_BASE_URL

interface GlobalNotificationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

// Secciones disponibles en la app
const APP_SECTIONS = [
  { value: '/dashboard', label: 'Dashboard', module: 'system' },
  { value: '/dashboard/groups', label: 'Grupos', module: 'groups' },
  { value: '/dashboard/parking', label: 'Parking', module: 'parking' },
  { value: '/dashboard/parking/bookings', label: 'Parking - Reservas', module: 'parking' },
  { value: '/dashboard/parking/status', label: 'Parking - Estado', module: 'parking' },
  { value: '/dashboard/logbooks', label: 'Logbooks', module: 'logbooks' },
  { value: '/dashboard/maintenance', label: 'Mantenimiento', module: 'system' },
  { value: '/dashboard/blacklist', label: 'Blacklist', module: 'system' },
  { value: '/dashboard/cashier/hotel', label: 'Caja Hotel', module: 'system' },
  { value: '/dashboard/cashier/logs', label: 'Caja - Registros', module: 'system' },
  { value: '/dashboard/cashier/reports', label: 'Caja - Reportes', module: 'system' },
  { value: '/dashboard/conciliation', label: 'Conciliacion', module: 'system' },
  { value: '/dashboard/invoices', label: 'Facturas', module: 'system' },
  { value: '/dashboard/profile', label: 'Perfil', module: 'system' },
  { value: '/dashboard/profile?panel=settings', label: 'Configuracion', module: 'system' },
] as const

type Priority = 'low' | 'medium' | 'high'

// Helper: obtener hora redondeada al siguiente intervalo de 30 min + 30 min extra
function getSmartDefaultTime(): string {
  const now = new Date()
  const minutes = now.getMinutes()
  const hours = now.getHours()

  let nextMinutes: number
  let nextHours = hours

  if (minutes < 30) {
    nextMinutes = 30
  } else {
    nextMinutes = 0
    nextHours += 1
  }

  nextMinutes += 30
  if (nextMinutes >= 60) {
    nextMinutes -= 60
    nextHours += 1
  }

  if (nextHours >= 24) {
    nextHours = nextHours - 24
  }

  return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`
}

// Helper: obtener hora mínima para hoy
function getMinTimeForToday(): string {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 10)

  const hours = now.getHours()
  const minutes = now.getMinutes() < 30 ? 30 : 0
  const adjustedHours = now.getMinutes() < 30 ? hours : hours + 1

  return `${String(adjustedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function GlobalNotificationModal({
  isOpen,
  onClose,
  onSuccess,
}: GlobalNotificationModalProps) {
  const t = useTranslations('notifications')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [selectedSection, setSelectedSection] = useState<string>(APP_SECTIONS[0].value)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState('09:00')
  const [scheduleType, setScheduleType] = useState<'now' | 'scheduled'>('now')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
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

  // Validar fecha/hora
  const validationResult = useMemo(() => {
    if (scheduleType === 'now') return { valid: true, message: null }
    if (!selectedDate) return { valid: false, message: t('validation.selectDate') }
    if (!scheduledDateTime) return { valid: false, message: t('validation.invalidDateTime') }

    const now = new Date()
    const minDateTime = new Date(now.getTime() + 5 * 60000)

    if (scheduledDateTime < minDateTime) {
      return {
        valid: false,
        message: t('validation.timeMinFuture'),
      }
    }

    return { valid: true, message: null }
  }, [scheduleType, selectedDate, scheduledDateTime, t])

  // Obtener el módulo basado en la sección seleccionada
  const getModuleForSection = (sectionValue: string) => {
    const section = APP_SECTIONS.find((s) => s.value === sectionValue)
    return section?.module || 'system'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validationResult.valid) {
      setError(validationResult.message)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data: {
        title: string
        message: string
        priority: Priority
        module: string
        direct_link: string
        scheduled_for?: string
      } = {
        title,
        message,
        priority,
        module: getModuleForSection(selectedSection),
        direct_link: selectedSection,
      }

      if (scheduleType === 'scheduled' && scheduledDateTime) {
        data.scheduled_for = scheduledDateTime.toISOString()
      }

      await apiClient.post(`${API_URL}/api/notifications`, data)

      setSuccess(true)
      toast.success(
        scheduleType === 'now'
          ? t('toast.sent')
          : t('toast.scheduled', {
              date:
                scheduledDateTime?.toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                }) ?? '',
              time: selectedTime,
            })
      )

      setTimeout(() => {
        handleClose()
        onSuccess?.()
      }, 1000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('toast.error')
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setMessage('')
    setPriority('medium')
    setSelectedSection(APP_SECTIONS[0].value)
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
  const _selectedSectionLabel =
    APP_SECTIONS.find((s) => s.value === selectedSection)?.label || 'Dashboard'

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
          {/* Section Selector */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              <FiLink className="inline w-3 h-3 mr-1" />
              {t('modal.destinationLink')}
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {APP_SECTIONS.map((section) => (
                <option key={section.value} value={section.value}>
                  {section.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {t('modal.redirectTo')}{' '}
              <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{selectedSection}</code>
            </p>
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

          {/* Scheduled DateTime */}
          {scheduleType === 'scheduled' && (
            <div className="space-y-2 p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-800">
              <div className="grid grid-cols-2 gap-2">
                {/* Fecha */}
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

                  {showCalendar && (
                    <div className="absolute z-20 bottom-full mb-1 left-0">
                      <SimpleCalendarCompact
                        selectedDate={selectedDate}
                        minDate={today}
                        onSelect={(date) => {
                          setSelectedDate(date)
                          setShowCalendar(false)
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

              {/* Preview */}
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

              {/* Warning */}
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
              disabled={loading || success || !validationResult.valid || !title || !message}
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

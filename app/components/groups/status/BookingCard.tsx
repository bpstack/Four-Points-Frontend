// app/components/groups/status/BookingCard.tsx

// TODO (Estado unificado):
// Actualmente existe lógica de sincronización entre hotel_groups.status
// y group_status.booking_confirmed porque ambas tablas duplican el estado del grupo.
// Cuando se elimine esta duplicidad en la base de datos:
//   1. ELIMINAR toda la lógica de sincronización.
//   2. Unificar el estado en una sola tabla (decidir entre hotel_groups o group_status).
//   3. Simplificar updateGroup() y updateBooking() para evitar actualizaciones cruzadas.
//   4. Actualizar modelos, DTOs y store del frontend.
// IMPORTANTE: Este archivo depende directamente del diseño actual duplicado.

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bookingSchema, type BookingFormData } from '@/app/lib/schemas/group-schemas'
import { groupsApi, type GroupStatusRecord } from '@/app/lib/groups'
import { useGroupStore } from '@/app/stores/useGroupStore'
import { FiCalendar, FiEdit2, FiSave, FiX, FiCheckCircle } from 'react-icons/fi'
import { formatDateForInput, parseInputDate } from '@/app/lib/helpers/date'
import SimpleCalendarCompact from '@/app/ui/calendar/SimpleCalendarCompact'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'

interface BookingCardProps {
  status: GroupStatusRecord
  groupId: number
}

export function BookingCard({ status, groupId }: BookingCardProps) {
  const t = useTranslations('groups')
  const locale = useLocale()
  const [isEditing, setIsEditing] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const { refreshStatus, refreshGroup } = useGroupStore()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      confirmed: status.booking_confirmed,
      date: status.booking_confirmed_date
        ? new Date(status.booking_confirmed_date).toISOString().split('T')[0]
        : '',
    },
  })

  const dateValue = watch('date') ?? '' // This ensures it's always a string

  // Cerrar calendario al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.calendar-container')) {
        setShowCalendar(false)
      }
    }

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCalendar])

  const onSubmit = async (data: BookingFormData) => {
    try {
      await groupsApi.updateBooking(groupId, data)
      toast.success(t('statusCards.bookingUpdateSuccess'))

      await Promise.all([refreshStatus(groupId), refreshGroup(groupId)])

      setIsEditing(false)
      setShowCalendar(false)
    } catch (error) {
      console.error('Error updating booking:', error)
      const message = error instanceof Error ? error.message : t('statusCards.bookingUpdateError')
      toast.error(message)
    }
  }

  const handleCancel = () => {
    reset()
    setIsEditing(false)
    setShowCalendar(false)
  }

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return ''
    const date = parseInputDate(dateString)
    return date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="bg-white dark:bg-[#0D1117] rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <FiCalendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t('statusCards.booking')}
          </h4>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Confirmed Checkbox */}
          <div className="flex items-center gap-2">
            <input
              {...register('confirmed')}
              type="checkbox"
              id="booking_confirmed"
              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
            />
            <label
              htmlFor="booking_confirmed"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t('statusCards.bookingConfirmedLabel')}
            </label>
          </div>

          {/* Date con Calendar */}
          <div className="relative calendar-container">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('statusCards.confirmationDate')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={formatDateDisplay(dateValue)}
                readOnly
                placeholder={t('statusCards.selectDate')}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowCalendar(!showCalendar)
                }}
                className="w-full px-3 py-1.5 pr-8 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 cursor-pointer"
              />
              <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.date && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.date.message}</p>
            )}

            {/* Calendar Dropdown */}
            {showCalendar && (
              <div className="absolute z-50 mt-1" onClick={(e) => e.stopPropagation()}>
                <SimpleCalendarCompact
                  selectedDate={dateValue ? parseInputDate(dateValue) : null}
                  onSelect={(date) => {
                    if (date) {
                      const formatted = formatDateForInput(date)
                      setValue('date', formatted, { shouldValidate: true })
                    }
                    setShowCalendar(false)
                  }}
                  onClose={() => setShowCalendar(false)}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiSave className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-2">
          {/* Status Badge */}
          <div>
            {status.booking_confirmed ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-md text-xs font-medium">
                <FiCheckCircle className="w-3.5 h-3.5" />
                {t('statusCards.confirmed')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 rounded-md text-xs font-medium">
                {t('statusCards.pending')}
              </span>
            )}
          </div>

          {/* Date */}
          {status.booking_confirmed_date && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('statusCards.confirmedOn')}{' '}
              {new Date(status.booking_confirmed_date).toLocaleDateString(
                locale === 'es' ? 'es-ES' : 'en-US',
                {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                }
              )}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

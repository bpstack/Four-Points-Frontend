// app/components/groups/status/RoomingCard.tsx

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { roomingSchema, type RoomingFormData } from '@/app/lib/schemas/group-schemas'
import {
  groupsApi,
  type GroupStatusRecord,
  type UpdateRoomingDTO,
  RoomingStatus,
} from '@/app/lib/groups'
import { useGroupStore } from '@/app/stores/useGroupStore'
import { FiUsers, FiEdit2, FiSave, FiX, FiCalendar } from 'react-icons/fi'
import { formatDateForInput, parseInputDate } from '@/app/lib/helpers/date'
import SimpleCalendarCompact from '@/app/ui/calendar/SimpleCalendarCompact'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'

interface RoomingCardProps {
  status: GroupStatusRecord
  groupId: number
}

export function RoomingCard({ status, groupId }: RoomingCardProps) {
  const t = useTranslations('groups')
  const locale = useLocale()
  const [isEditing, setIsEditing] = useState(false)
  const [showRequestedCalendar, setShowRequestedCalendar] = useState(false)
  const [showReceivedCalendar, setShowReceivedCalendar] = useState(false)
  const { refreshStatus, refreshGroup } = useGroupStore()

  const ROOMING_STATUS_CONFIG = {
    [RoomingStatus.PENDING]: {
      label: t('statusCards.roomingPending'),
      color:
        'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800',
    },
    [RoomingStatus.REQUESTED]: {
      label: t('statusCards.roomingRequested'),
      color:
        'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    },
    [RoomingStatus.RECEIVED]: {
      label: t('statusCards.roomingReceived'),
      color:
        'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    },
  }

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RoomingFormData>({
    resolver: zodResolver(roomingSchema),
    defaultValues: {
      rooming_status: status.rooming_status,
      rooming_requested_date: status.rooming_requested_date
        ? new Date(status.rooming_requested_date).toISOString().split('T')[0]
        : '',
      rooming_received_date: status.rooming_received_date
        ? new Date(status.rooming_received_date).toISOString().split('T')[0]
        : '',
    },
  })

  const roomingStatus = watch('rooming_status')
  const requestedDate = watch('rooming_requested_date') ?? ''
  const receivedDate = watch('rooming_received_date') ?? ''

  // Cerrar calendarios al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.calendar-container')) {
        setShowRequestedCalendar(false)
        setShowReceivedCalendar(false)
      }
    }

    if (showRequestedCalendar || showReceivedCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showRequestedCalendar, showReceivedCalendar])

  const onSubmit = async (data: RoomingFormData) => {
    try {
      const payload: UpdateRoomingDTO = {
        rooming_status: data.rooming_status as RoomingStatus,
        rooming_requested_date: undefined,
        rooming_received_date: undefined,
      }

      if (data.rooming_status !== RoomingStatus.PENDING) {
        payload.rooming_requested_date = data.rooming_requested_date || undefined

        if (data.rooming_status === RoomingStatus.RECEIVED) {
          payload.rooming_received_date = data.rooming_received_date || undefined
        }
      }

      await groupsApi.updateRooming(groupId, payload)
      toast.success(t('statusCards.roomingUpdateSuccess'))

      await Promise.all([refreshStatus(groupId), refreshGroup(groupId)])

      setIsEditing(false)
      setShowRequestedCalendar(false)
      setShowReceivedCalendar(false)
    } catch (error) {
      console.error('Error updating rooming:', error)
      const message = error instanceof Error ? error.message : t('statusCards.roomingUpdateError')
      toast.error(message)
    }
  }

  const handleCancel = () => {
    reset()
    setIsEditing(false)
    setShowRequestedCalendar(false)
    setShowReceivedCalendar(false)
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

  const statusConfig = ROOMING_STATUS_CONFIG[status.rooming_status]

  return (
    <div className="bg-white dark:bg-[#0D1117] rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
            <FiUsers className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t('statusCards.rooming')}
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
          {/* Status Select */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('statusCards.statusLabel')}
            </label>
            <select
              {...register('rooming_status')}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">{t('statusCards.roomingPending')}</option>
              <option value="requested">{t('statusCards.roomingRequested')}</option>
              <option value="received">{t('statusCards.roomingReceived')}</option>
            </select>
          </div>

          {/* Requested Date - Si NO es pending */}
          {roomingStatus !== RoomingStatus.PENDING && (
            <div className="relative calendar-container">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('statusCards.requestDate')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatDateDisplay(requestedDate)}
                  readOnly
                  placeholder={t('statusCards.selectDate')}
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowReceivedCalendar(false)
                    setShowRequestedCalendar(!showRequestedCalendar)
                  }}
                  className="w-full px-3 py-1.5 pr-8 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 cursor-pointer"
                />
                <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.rooming_requested_date && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.rooming_requested_date.message}
                </p>
              )}

              {showRequestedCalendar && (
                <div className="absolute z-50 mt-1" onClick={(e) => e.stopPropagation()}>
                  <SimpleCalendarCompact
                    selectedDate={requestedDate ? parseInputDate(requestedDate) : null}
                    onSelect={(date) => {
                      if (date) {
                        const formatted = formatDateForInput(date)
                        setValue('rooming_requested_date', formatted, { shouldValidate: true })
                      }
                      setShowRequestedCalendar(false)
                    }}
                    onClose={() => setShowRequestedCalendar(false)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Received Date - Solo si status es "received" */}
          {roomingStatus === RoomingStatus.RECEIVED && (
            <div className="relative calendar-container">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('statusCards.receiveDate')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatDateDisplay(receivedDate)}
                  readOnly
                  placeholder={t('statusCards.selectDate')}
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowRequestedCalendar(false)
                    setShowReceivedCalendar(!showReceivedCalendar)
                  }}
                  className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 cursor-pointer"
                />
                <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.rooming_received_date && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.rooming_received_date.message}
                </p>
              )}

              {showReceivedCalendar && (
                <div className="absolute z-50 mt-1" onClick={(e) => e.stopPropagation()}>
                  <SimpleCalendarCompact
                    selectedDate={receivedDate ? parseInputDate(receivedDate) : null}
                    onSelect={(date) => {
                      if (date) {
                        const formatted = formatDateForInput(date)
                        setValue('rooming_received_date', formatted, { shouldValidate: true })
                      }
                      setShowReceivedCalendar(false)
                    }}
                    onClose={() => setShowReceivedCalendar(false)}
                  />
                </div>
              )}
            </div>
          )}

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
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 border rounded-md text-xs font-medium ${statusConfig.color}`}
            >
              {statusConfig.label}
            </span>
          </div>

          {/* Dates */}
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            {status.rooming_requested_date && (
              <p>
                {t('statusCards.requested')}{' '}
                {new Date(status.rooming_requested_date).toLocaleDateString(
                  locale === 'es' ? 'es-ES' : 'en-US'
                )}
              </p>
            )}
            {status.rooming_received_date && (
              <p>
                {t('statusCards.received')}{' '}
                {new Date(status.rooming_received_date).toLocaleDateString(
                  locale === 'es' ? 'es-ES' : 'en-US'
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

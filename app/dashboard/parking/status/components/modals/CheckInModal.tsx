// app/dashboard/parking/status/components/modals/CheckInModal.tsx

'use client'

import React from 'react'
import { FiCheckCircle } from 'react-icons/fi'
import { useTranslations, useLocale } from 'next-intl'
import BaseModal from './BaseModal'
import type { ParkingBooking } from '@/app/lib/parking/types'

interface CheckInModalProps {
  booking: ParkingBooking | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  loading: boolean
}

export default function CheckInModal({
  booking,
  isOpen,
  onClose,
  onConfirm,
  loading,
}: CheckInModalProps) {
  const t = useTranslations('parking.statusModals')
  const locale = useLocale()

  if (!booking) return null

  const checkinDate = booking.schedule?.expected_checkin
    ? new Date(booking.schedule.expected_checkin)
    : null
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isLateCheckin = checkinDate && checkinDate < today
  const daysDifference = checkinDate
    ? Math.floor((today.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('confirmCheckIn')}
      icon={<FiCheckCircle className="w-5 h-5" />}
      colorScheme="emerald"
      loading={loading}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {loading ? t('processing') : t('confirmEntry')}
          </button>
        </>
      }
    >
      {isLateCheckin && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500 rounded-r-lg">
          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
            ⚠️{' '}
            {t('lateCheckIn', {
              date: checkinDate?.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US'),
              days: daysDifference,
              dayWord: daysDifference === 1 ? t('day') : t('days'),
            })}
          </p>
        </div>
      )}

      <div className="space-y-3 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-slate-800/60 dark:to-slate-900/60 p-5 rounded-xl border border-gray-100 dark:border-slate-700/50">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {t('client')}:
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {booking.vehicle?.owner || t('noClient')}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {t('vehicle')}:
          </span>
          <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
            {booking.vehicle?.plate}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('spot')}:</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {booking.spot?.level} · {booking.spot?.number}
          </span>
        </div>
      </div>
    </BaseModal>
  )
}

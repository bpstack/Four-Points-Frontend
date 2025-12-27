// app/components/cashier/ReopenDayModal.tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { FiX, FiAlertCircle } from 'react-icons/fi'
import { useReopenDay } from '@/app/lib/cashier/queries'
import { toast } from 'react-hot-toast'

interface ReopenDayModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: string
}

export default function ReopenDayModal({ isOpen, onClose, selectedDate }: ReopenDayModalProps) {
  const t = useTranslations('cashier')
  const [reason, setReason] = useState('')
  const reopenDayMutation = useReopenDay()

  const handleReopen = async () => {
    if (!reason.trim()) {
      toast.error(t('reopenDay.mustProvideReason'))
      return
    }

    try {
      await reopenDayMutation.mutateAsync({ date: selectedDate, reason })
      toast.success(t('reopenDay.dayReopened'))
      setReason('')
      onClose()
    } catch (error) {
      console.error('Error reabriendo día:', error)
      const errorMessage = error instanceof Error ? error.message : t('error.reopenDay')
      toast.error(errorMessage)
    }
  }

  if (!isOpen) return null

  const isLoading = reopenDayMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#0d1117] rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FiAlertCircle className="w-5 h-5 text-orange-600" />
            {t('reopenDay.title')}
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Fecha */}
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-700 dark:text-orange-300 mb-1">
              {t('reopenDay.reopeningClosedDay')}
            </p>
            <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
              {new Date(selectedDate).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Warning */}
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2">
            <FiAlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              <p className="font-medium">⚠️ {t('reopenDay.attention')}</p>
              <p className="text-xs mt-1">{t('reopenDay.warningMessage')}</p>
            </div>
          </div>

          {/* Razón */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('reopenDay.reopenReason')}{' '}
              <span className="text-red-500">{t('common.required')}</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('reopenDay.reasonPlaceholder')}
              disabled={isLoading}
              rows={3}
              className="w-full px-4 py-2 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-[#151b23] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              required
              minLength={10}
            />
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                {t('reopenDay.minCharacters')}
              </span>
              <span
                className={`font-medium ${
                  reason.length < 10
                    ? 'text-gray-400 dark:text-gray-500'
                    : reason.length < 30
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-green-600 dark:text-green-400'
                }`}
              >
                {reason.length} {t('reopenDay.characters')}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('reopenDay.cancel')}
          </button>
          <button
            onClick={handleReopen}
            disabled={isLoading || reason.length < 10}
            className="px-6 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('reopenDay.reopening')}
              </>
            ) : (
              <>
                <FiAlertCircle className="w-4 h-4" />
                {t('reopenDay.reopen')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

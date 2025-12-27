// app/components/cashier/DaySummaryCard.tsx
'use client'

import { FiDollarSign, FiAlertCircle } from 'react-icons/fi'
import type { CashierDaily } from '@/app/lib/cashier/types'
import { useTranslations } from 'next-intl'

interface DaySummaryCardProps {
  daily: CashierDaily
  selectedDate: string
  onCloseDay: () => void
  onReopenDay: () => void
}

export default function DaySummaryCard({
  daily,
  selectedDate,
  onCloseDay,
  onReopenDay,
}: DaySummaryCardProps) {
  const t = useTranslations('cashier')

  return (
    <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FiDollarSign className="w-4 h-4 text-green-600" />
          {t('summary.dayTitle')}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">{selectedDate}</span>
          {daily.status === 'closed' && (
            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-medium rounded">
              {t('summary.closed')}
            </span>
          )}
          {daily.status === 'open' && (
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-medium rounded">
              {t('summary.open')}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mb-0.5">
            {t('summary.totalCash')}
          </p>
          <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
            {parseFloat(daily.total_cash || '0').toFixed(2)}€
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-[10px] text-green-600 dark:text-green-400 font-medium mb-0.5">
            {t('summary.cardAndOthers')}
          </p>
          <p className="text-xl font-bold text-green-700 dark:text-green-300">
            {(
              parseFloat(daily.total_card || '0') +
              parseFloat(daily.total_bacs || '0') +
              parseFloat(daily.total_web_payment || '0') +
              parseFloat(daily.total_transfer || '0') +
              parseFloat(daily.total_other || '0')
            ).toFixed(2)}
            €
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium mb-0.5">
            {t('summary.grandTotal')}
          </p>
          <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
            {parseFloat(daily.grand_total || '0').toFixed(2)}€
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/30 p-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm">📝</span>
            <p className="text-[9px] text-gray-500 dark:text-gray-400 font-medium">
              {t('summary.activeVouchers')}
            </p>
          </div>
          <p className="text-base font-bold text-orange-600 dark:text-orange-400">
            {parseFloat(daily.active_vouchers_total || '0').toFixed(2)}€
          </p>
        </div>
      </div>

      {daily.validation_errors && daily.validation_errors.length > 0 && (
        <div className="mt-3 p-2.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2">
          <FiAlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-yellow-700 dark:text-yellow-300">
            <p className="font-medium mb-1">{t('closeDay.validations')}:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              {daily.validation_errors.map((error: string, idx: number) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Botón Cerrar Día (si está abierto y puede cerrarse) */}
      {daily.can_close && (
        <div className="mt-3">
          <button
            onClick={onCloseDay}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <FiDollarSign className="w-4 h-4" />
            {t('closeDay.closeDayComplete')}
          </button>
        </div>
      )}

      {/* Botón Reabrir Día (si está cerrado) */}
      {daily.status === 'closed' && (
        <div className="mt-3">
          <button
            onClick={onReopenDay}
            className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <FiAlertCircle className="w-4 h-4" />
            {t('reopenDay.reopen')}
          </button>
        </div>
      )}
    </div>
  )
}

// app/components/cashier/layout/DaySummarySidebar.tsx
'use client'

import { useTranslations } from 'next-intl'
import { FiDollarSign, FiCreditCard, FiAlertCircle } from 'react-icons/fi'
import type { CashierDaily } from '@/app/lib/cashier/types'

interface DaySummarySidebarProps {
  daily: CashierDaily
  selectedDate: string
  onCloseDay: () => void
  onReopenDay: () => void
}

export default function DaySummarySidebar({
  daily,
  selectedDate,
  onCloseDay,
  onReopenDay,
}: DaySummarySidebarProps) {
  const t = useTranslations('cashier')
  const totalCash = parseFloat(daily.total_cash || '0')
  const totalCard = parseFloat(daily.total_card || '0')
  const totalBacs = parseFloat(daily.total_bacs || '0')
  const totalWebPayment = parseFloat(daily.total_web_payment || '0')
  const totalTransfer = parseFloat(daily.total_transfer || '0')
  const totalOther = parseFloat(daily.total_other || '0')
  const grandTotal = parseFloat(daily.grand_total || '0')
  const activeVouchers = parseFloat(daily.active_vouchers_total || '0')

  const electronicPayments = totalCard + totalBacs + totalWebPayment + totalTransfer + totalOther

  return (
    <div className="sticky top-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        {t('summary.dayTitle')}
      </h3>

      {/* Status Badge */}
      <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {t('summary.status')}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
              {selectedDate}
            </p>
          </div>
          {daily.status === 'closed' ? (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-medium rounded-full">
              {t('summary.closed')}
            </span>
          ) : (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-medium rounded-full">
              {t('summary.open')}
            </span>
          )}
        </div>
      </div>

      {/* Gran Total */}
      <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {t('summary.grandTotal')}
            </p>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-400 mt-0.5">
              {grandTotal.toFixed(2)}€
            </p>
          </div>
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <FiDollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Total Efectivo */}
      <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {t('summary.cash')}
            </p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-0.5">
              {totalCash.toFixed(2)}€
            </p>
          </div>
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <FiDollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Pagos Electrónicos */}
      <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {t('summary.electronic')}
            </p>
            <p className="text-xl font-bold text-green-700 dark:text-green-400 mt-0.5">
              {electronicPayments.toFixed(2)}€
            </p>
          </div>
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <FiCreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* Vales Activos */}
      {activeVouchers > 0 && (
        <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {t('summary.activeVouchers')}
              </p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-0.5">
                {activeVouchers.toFixed(2)}€
              </p>
            </div>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <span className="text-lg">📝</span>
            </div>
          </div>
        </div>
      )}

      {/* Validaciones/Errores */}
      {daily.validation_errors && daily.validation_errors.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <FiAlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-yellow-700 dark:text-yellow-300">
              <p className="font-medium mb-1">{t('closeShift.validations')}:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {daily.validation_errors.map((error: string, idx: number) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="pt-2 space-y-2">
        {daily.can_close && (
          <button
            onClick={onCloseDay}
            className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <FiDollarSign className="w-3.5 h-3.5" />
            {t('closeDay.closeDayComplete')}
          </button>
        )}

        {daily.status === 'closed' && (
          <button
            onClick={onReopenDay}
            className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <FiAlertCircle className="w-3.5 h-3.5" />
            {t('reopenDay.title')}
          </button>
        )}
      </div>
    </div>
  )
}

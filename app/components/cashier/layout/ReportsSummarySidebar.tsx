// app/components/cashier/layout/ReportsSummarySidebar.tsx
'use client'

import { useTranslations } from 'next-intl'
import { FiTrendingUp, FiDollarSign, FiCreditCard, FiCheckCircle } from 'react-icons/fi'

interface ReportsSummarySidebarProps {
  grandTotal: number
  totalCash: number
  electronicPayments: number
  daysClosed: number
  totalDays: number
  averageDaily: number
}

export default function ReportsSummarySidebar({
  grandTotal,
  totalCash,
  electronicPayments,
  daysClosed,
  totalDays,
  averageDaily,
}: ReportsSummarySidebarProps) {
  const t = useTranslations('cashier')
  const completionRate = totalDays > 0 ? (daysClosed / totalDays) * 100 : 0
  const cashPercentage = grandTotal > 0 ? (totalCash / grandTotal) * 100 : 0
  const electronicPercentage = grandTotal > 0 ? (electronicPayments / grandTotal) * 100 : 0

  return (
    <div className="sticky top-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        {t('summary.monthTitle')}
      </h3>

      {/* Gran Total */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-green-700 dark:text-green-300 font-medium">
              {t('summary.grandTotal')}
            </p>
            <p className="text-xl font-bold text-green-900 dark:text-green-100 mt-0.5">
              {grandTotal.toFixed(2)}€
            </p>
            <p className="text-[10px] text-green-600 dark:text-green-400 mt-1">
              {t('summary.average')}: {averageDaily.toFixed(2)}€{t('summary.perDay')}
            </p>
          </div>
          <div className="p-2 bg-green-200 dark:bg-green-800/30 rounded-lg">
            <FiTrendingUp className="w-5 h-5 text-green-700 dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* Efectivo Total */}
      <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {t('summary.totalEffective')}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
              {totalCash.toFixed(2)}€
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              {cashPercentage.toFixed(1)}% {t('summary.ofTotal')}
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
              {t('summary.electronicPayments')}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
              {electronicPayments.toFixed(2)}€
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              {electronicPercentage.toFixed(1)}% {t('summary.ofTotal')}
            </p>
          </div>
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <FiCreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Días Cerrados */}
      <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {t('reports.daysClosed')}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
              {daysClosed}/{totalDays}
            </p>
          </div>
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
            <FiCheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <div className="mt-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
            {completionRate.toFixed(0)}% {t('summary.completed')}
          </p>
        </div>
      </div>
    </div>
  )
}

// app/dashboard/cashier/page.tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useDashboardOverview } from '@/app/lib/cashier/queries'
import {
  FiDollarSign,
  FiCreditCard,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiArrowRight,
  FiFileText,
  FiList,
} from 'react-icons/fi'
import { MdPointOfSale } from 'react-icons/md'

export default function CashierDashboardPage() {
  const t = useTranslations('cashier')
  const { data, isLoading, error } = useDashboardOverview()

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-solid border-blue-600 dark:border-blue-500 border-r-transparent" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('page.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
          <FiAlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 text-center mb-2">
            {t('error.title')}
          </h3>
          <p className="text-sm text-red-700 dark:text-red-400 text-center">
            {(error as Error).message}
          </p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { today, vouchers } = data

  // Parse values - backend puede enviar strings
  const todayParsed = {
    date: today.date,
    total_shifts: Number(today.total_shifts) || 0,
    open_shifts: Number(today.open_shifts) || 0,
    closed_shifts: Number(today.closed_shifts) || 0,
    total_cash: Number(today.total_cash) || 0,
    total_payments: Number(today.total_payments) || 0,
    grand_total: Number(today.grand_total) || 0,
  }

  const vouchersParsed = {
    active_count: Number(vouchers.active_count) || 0,
    active_amount: Number(vouchers.active_amount) || 0,
    total_repaid: Number(vouchers.total_repaid) || 0,
  }

  const shiftsProgress =
    todayParsed.total_shifts > 0 ? (todayParsed.closed_shifts / todayParsed.total_shifts) * 100 : 0
  const isDayInitialized = todayParsed.total_shifts > 0

  return (
    <div className="min-h-screen bg-white dark:bg-[#010409] p-4 md:p-6">
      <div className="max-w-[1400px] space-y-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {t('dashboard.title')}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {todayParsed.date}
              </p>
            </div>
          </div>
        </div>

        {/* Day not initialized alert */}
        {!isDayInitialized && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FiClock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-sm">
                  {t('dashboard.dayNotInitialized')}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  {t('dashboard.dayNotInitializedDesc')}
                </p>
              </div>
              <Link
                href="/dashboard/cashier/hotel"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                {t('dashboard.initializeDay')}
              </Link>
            </div>
          </div>
        )}

        {/* Vouchers Alert (if any pending) */}
        {vouchersParsed.active_count > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FiAlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                  {t('dashboard.pendingVouchersAlert')}
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  {vouchersParsed.active_count} {t('dashboard.vouchersPending')} -{' '}
                  {vouchersParsed.active_amount.toFixed(2)}€
                </p>
              </div>
              <Link
                href="/dashboard/cashier/hotel"
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                {t('dashboard.viewVouchers')}
              </Link>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Grand Total */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-green-700 dark:text-green-300">
                {t('summary.grandTotal')}
              </span>
              <FiDollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {todayParsed.grand_total.toFixed(2)}€
            </p>
          </div>

          {/* Cash */}
          <div className="bg-white dark:bg-[#151b23] border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {t('summary.cash')}
              </span>
              <FiDollarSign className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {todayParsed.total_cash.toFixed(2)}€
            </p>
          </div>

          {/* Electronic */}
          <div className="bg-white dark:bg-[#151b23] border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {t('summary.electronic')}
              </span>
              <FiCreditCard className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {todayParsed.total_payments.toFixed(2)}€
            </p>
          </div>

          {/* Shifts Status */}
          <div className="bg-white dark:bg-[#151b23] border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {t('shifts.shiftStatus')}
              </span>
              {todayParsed.closed_shifts === todayParsed.total_shifts ? (
                <FiCheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <FiClock className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {todayParsed.closed_shifts}/{todayParsed.total_shifts}
            </p>
            <div className="mt-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    shiftsProgress === 100
                      ? 'bg-green-500'
                      : shiftsProgress >= 50
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                  }`}
                  style={{ width: `${shiftsProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Go to Daily Cashier */}
          <Link
            href="/dashboard/cashier/hotel"
            className="group bg-white dark:bg-[#151b23] border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <MdPointOfSale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {t('dashboard.dailyCashier')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('dashboard.dailyCashierDesc')}
                  </p>
                </div>
              </div>
              <FiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          {/* Go to Reports */}
          <Link
            href="/dashboard/cashier/reports"
            className="group bg-white dark:bg-[#151b23] border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                  <FiFileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {t('dashboard.reports')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('dashboard.reportsDesc')}
                  </p>
                </div>
              </div>
              <FiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          {/* Go to Logs */}
          <Link
            href="/dashboard/cashier/logs"
            className="group bg-white dark:bg-[#151b23] border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                  <FiList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {t('dashboard.logs')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('dashboard.logsDesc')}
                  </p>
                </div>
              </div>
              <FiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </div>

        {/* Vouchers Summary (if any) */}
        {vouchersParsed.total_repaid > 0 && (
          <div className="bg-white dark:bg-[#151b23] border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">
              {t('dashboard.vouchersSummary')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('dashboard.totalJustified')}
                </p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {vouchersParsed.total_repaid.toFixed(2)}€
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('dashboard.pendingAmount')}
                </p>
                <p
                  className={`text-lg font-bold ${vouchersParsed.active_amount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  {vouchersParsed.active_amount.toFixed(2)}€
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

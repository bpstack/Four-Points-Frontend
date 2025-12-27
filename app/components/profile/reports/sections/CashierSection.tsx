// app/components/profile/reports/sections/CashierSection.tsx

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { apiClient } from '@/app/lib/apiClient'
import { cn } from '@/app/lib/helpers/utils'
import { API_BASE_URL } from '@/app/lib/env'
import DateFilter from '../DateFilter'
import {
  FiDollarSign,
  FiLoader,
  FiAlertCircle,
  FiRefreshCw,
  FiUser,
  FiCalendar,
  FiClock,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi'
interface CashierHistoryEntry {
  id: number
  shift_id: number
  action: string
  table_affected: string | null
  field_changed: string | null
  old_value: string | null
  new_value: string | null
  changed_by: string
  username?: string // Backend returns this from JOIN
  changed_at: string
  shift_date?: string
  shift_type?: string
  shift_status?: string
}

const API_URL = API_BASE_URL
const DEFAULT_LIMIT = 50

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface DashboardOverview {
  today: {
    date: string
    total_shifts: number
    open_shifts: number
    closed_shifts: number
    total_cash: number
    total_payments: number
    grand_total: number
  }
  vouchers: {
    active_count: number
    active_amount: number
    total_repaid: number
    oldest_active_date: string | null
  }
}

interface DailyReportShift {
  shift: {
    id: number
    shift_type: string
  }
  total_income: number
  expected_in_box: number
  is_balanced: boolean
}

interface DailyReport {
  date: string
  shifts: DailyReportShift[]
  summary: {
    total_cash: number
    total_payments: number
    grand_total: number
    total_vouchers: number
    total_difference: number
    shifts_count: number
    shifts_closed: number
  }
}

interface Voucher {
  id: number
  shift_id: number
  voucher_number: string
  amount: number
  recipient: string
  concept: string
  status: 'pending' | 'justified' | 'cancelled'
  created_at: string
  justified_at: string | null
  justified_by: string | null
}

interface _Shift {
  id: number
  daily_id: number
  shift_type: string
  shift_date: string
  is_closed: boolean
  total_cash: number
  total_card: number
  total_income: number
  notes: string | null
}

type ViewMode = 'dashboard' | 'vouchers' | 'history'

// ═══════════════════════════════════════════════════════
// CONFIG (colors and icons only - labels moved inside component for i18n)
// ═══════════════════════════════════════════════════════

const VOUCHER_STATUS_COLORS: Record<string, { color: string; icon: React.ReactNode }> = {
  pending: {
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: <FiClock className="w-3 h-3" />,
  },
  justified: {
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: <FiCheckCircle className="w-3 h-3" />,
  },
  cancelled: {
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: <FiXCircle className="w-3 h-3" />,
  },
}

// ═══════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════

export default function CashierSection() {
  const t = useTranslations('profile.reports.cashier')
  const locale = useLocale()

  // Status labels with translations
  const VOUCHER_STATUS_LABELS = useMemo(
    () => ({
      pending: t('voucherStatus.pending'),
      justified: t('voucherStatus.justified'),
      cancelled: t('voucherStatus.cancelled'),
    }),
    [t]
  )

  // Shift types with translations
  const SHIFT_TYPES = useMemo(
    () => ({
      morning: t('shiftTypes.morning'),
      afternoon: t('shiftTypes.afternoon'),
      night: t('shiftTypes.night'),
      audit: t('shiftTypes.audit'),
    }),
    [t]
  )

  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null)
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [historyData, setHistoryData] = useState<CashierHistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')

  // Voucher filters
  const [voucherStatus, setVoucherStatus] = useState<string>('all')

  // Date filter for history view
  const [historyDate, setHistoryDate] = useState<string | null>(null)

  // Date filter for dashboard view
  const [dashboardDate, setDashboardDate] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (viewMode === 'dashboard') {
        // If a specific date is selected, use the daily report endpoint
        if (dashboardDate) {
          const response = await apiClient.get(
            `${API_URL}/api/cashier/reports/daily/${dashboardDate}`
          )
          const data = response as { data?: DailyReport } | DailyReport
          setDailyReport((data as { data?: DailyReport }).data || (data as DailyReport))
          setOverview(null)
        } else {
          const response = await apiClient.get(`${API_URL}/api/cashier/reports/dashboard`)
          const data = response as { data?: DashboardOverview } | DashboardOverview
          setOverview((data as { data?: DashboardOverview }).data || (data as DashboardOverview))
          setDailyReport(null)
        }
      } else if (viewMode === 'vouchers') {
        const params = new URLSearchParams({ limit: DEFAULT_LIMIT.toString() })
        if (voucherStatus !== 'all') params.set('status', voucherStatus)
        const response = await apiClient.get(
          `${API_URL}/api/cashier/reports/vouchers-history?${params.toString()}`
        )
        const data = response as
          | { data?: { vouchers?: Voucher[] }; vouchers?: Voucher[] }
          | Voucher[]
        if (Array.isArray(data)) {
          setVouchers(data)
        } else {
          setVouchers(data.data?.vouchers || data.vouchers || [])
        }
      } else if (viewMode === 'history') {
        const params = new URLSearchParams({ limit: DEFAULT_LIMIT.toString() })
        if (historyDate) {
          params.set('from_date', historyDate)
          params.set('to_date', historyDate)
        }
        const response = await apiClient.get(`${API_URL}/api/cashier/history?${params.toString()}`)
        const data = response as
          | { data?: { data?: CashierHistoryEntry[] } | CashierHistoryEntry[] }
          | CashierHistoryEntry[]
        if (Array.isArray(data)) {
          setHistoryData(data)
        } else if (Array.isArray(data.data)) {
          setHistoryData(data.data)
        } else {
          setHistoryData((data.data as { data?: CashierHistoryEntry[] })?.data || [])
        }
      }
      setLoaded(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('errorLoading'))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, voucherStatus, historyDate, dashboardDate])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr))
  }

  const formatDateTime = (dateStr: string) => {
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  }

  // Estado inicial
  if (!loaded && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center">
          <FiDollarSign className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{t('title')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">{t('description')}</p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <FiRefreshCw className="w-4 h-4" />
          {t('loadDashboard')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* View Mode Tabs */}
      <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-[#30363d] flex-wrap">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#161b22] rounded-lg p-1">
          <button
            onClick={() => {
              setViewMode('dashboard')
              setLoaded(false)
            }}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              viewMode === 'dashboard'
                ? 'bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            {t('views.dashboard')}
          </button>
          <button
            onClick={() => {
              setViewMode('vouchers')
              setLoaded(false)
            }}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              viewMode === 'vouchers'
                ? 'bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            {t('views.vouchers')}
          </button>
          <button
            onClick={() => {
              setViewMode('history')
              setLoaded(false)
            }}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              viewMode === 'history'
                ? 'bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            {t('views.history')}
          </button>
        </div>

        {/* Filters - inline with tabs */}
        {viewMode === 'dashboard' && (
          <DateFilter
            selectedDate={dashboardDate}
            onDateChange={(date) => {
              setDashboardDate(date)
              setLoaded(false)
            }}
            label={t('dateFilter')}
          />
        )}

        {viewMode === 'vouchers' && (
          <select
            value={voucherStatus}
            onChange={(e) => {
              setVoucherStatus(e.target.value)
              setLoaded(false)
            }}
            className="text-sm border border-gray-300 dark:border-[#30363d] rounded-lg px-3 py-1.5 bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white"
          >
            <option value="all">{t('voucherStatus.all')}</option>
            <option value="pending">{t('voucherStatus.pending')}</option>
            <option value="justified">{t('voucherStatus.justified')}</option>
            <option value="cancelled">{t('voucherStatus.cancelled')}</option>
          </select>
        )}

        {viewMode === 'history' && (
          <DateFilter
            selectedDate={historyDate}
            onDateChange={(date) => {
              setHistoryDate(date)
              setLoaded(false)
            }}
            label={t('historyDateFilter')}
          />
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <FiLoader className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
          </div>
        </div>
      )}

      {/* Dashboard View */}
      {!loading && !error && viewMode === 'dashboard' && overview && (
        <div className="space-y-6">
          {/* Today's Summary */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <FiCalendar className="w-4 h-4 text-blue-500" />
              {t('dashboard.today')} - {formatDate(overview.today.date)}
              {overview.today.closed_shifts === overview.today.total_shifts &&
                overview.today.total_shifts > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {t('dashboard.closed')}
                  </span>
                )}
            </h4>
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(overview.today.grand_total)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('dashboard.totalIncome')}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(overview.today.total_cash)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('dashboard.cash')}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(overview.today.total_payments)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('dashboard.otherPayments')}
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {overview.today.open_shifts}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('dashboard.openShifts')}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-[#161b22] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  {overview.today.total_shifts}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('dashboard.totalShifts')}
                </p>
              </div>
            </div>
          </div>

          {/* Vouchers Summary */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <FiFileText className="w-4 h-4 text-purple-500" />
              {t('vouchersSummary.title')}
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {overview.vouchers.active_count}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('vouchersSummary.activeVouchers')}
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {formatCurrency(overview.vouchers.active_amount)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('vouchersSummary.pendingAmount')}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(overview.vouchers.total_repaid)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('vouchersSummary.totalJustified')}
                </p>
              </div>
            </div>
          </div>

          {/* Pending Vouchers Alert */}
          {overview.vouchers.active_count > 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiAlertCircle className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      {t('vouchersSummary.pendingAlert', { count: overview.vouchers.active_count })}
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      Total: {formatCurrency(overview.vouchers.active_amount)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setViewMode('vouchers')
                    setVoucherStatus('pending')
                    setLoaded(false)
                  }}
                  className="text-xs font-medium text-yellow-700 dark:text-yellow-300 hover:underline"
                >
                  {t('vouchersSummary.viewVouchers')} →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily Report View (when specific date is selected) */}
      {!loading && !error && viewMode === 'dashboard' && dailyReport && (
        <div className="space-y-6">
          {/* Date Summary */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <FiCalendar className="w-4 h-4 text-blue-500" />
              {formatDate(dailyReport.date)}
              {dailyReport.summary.shifts_closed === dailyReport.summary.shifts_count &&
                dailyReport.summary.shifts_count > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {t('dashboard.closed')}
                  </span>
                )}
            </h4>
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(dailyReport.summary.grand_total)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('dashboard.totalIncome')}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(dailyReport.summary.total_cash)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('dashboard.cash')}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(dailyReport.summary.total_payments)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('dashboard.otherPayments')}
                </p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(dailyReport.summary.total_vouchers)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('dashboard.vouchers')}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-[#161b22] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  {dailyReport.summary.shifts_count}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('dashboard.shifts')} (
                  {t('dashboard.shiftsClosed', { count: dailyReport.summary.shifts_closed })})
                </p>
              </div>
            </div>
          </div>

          {/* Difference Alert */}
          {Math.abs(dailyReport.summary.total_difference) > 0.5 && (
            <div
              className={cn(
                'p-4 border rounded-lg',
                dailyReport.summary.total_difference > 0
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              )}
            >
              <div className="flex items-center gap-2">
                <FiAlertCircle
                  className={cn(
                    'w-5 h-5',
                    dailyReport.summary.total_difference > 0 ? 'text-green-500' : 'text-red-500'
                  )}
                />
                <div>
                  <p
                    className={cn(
                      'text-sm font-medium',
                      dailyReport.summary.total_difference > 0
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                    )}
                  >
                    {t('difference.title')}: {formatCurrency(dailyReport.summary.total_difference)}
                  </p>
                  <p
                    className={cn(
                      'text-xs',
                      dailyReport.summary.total_difference > 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {dailyReport.summary.total_difference > 0
                      ? t('difference.surplus')
                      : t('difference.shortage')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Shifts Details */}
          {dailyReport.shifts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FiClock className="w-4 h-4 text-blue-500" />
                {t('shiftDetail.title')}
              </h4>
              <div className="border border-gray-200 dark:border-[#30363d] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-[#161b22]">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                        {t('shiftDetail.shift')}
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                        {t('shiftDetail.income')}
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                        {t('shiftDetail.inBox')}
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
                        {t('shiftDetail.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-[#30363d]">
                    {dailyReport.shifts.map((shiftData) => (
                      <tr
                        key={shiftData.shift.id}
                        className="hover:bg-gray-50 dark:hover:bg-[#161b22]"
                      >
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                          {SHIFT_TYPES[shiftData.shift.shift_type as keyof typeof SHIFT_TYPES] ||
                            shiftData.shift.shift_type}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                          {formatCurrency(shiftData.total_income)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                          {formatCurrency(shiftData.expected_in_box)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {shiftData.is_balanced ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <FiCheckCircle className="w-3 h-3" />
                              {t('shiftDetail.balanced')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                              <FiAlertCircle className="w-3 h-3" />
                              {t('shiftDetail.unbalanced')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vouchers View */}
      {!loading && !error && viewMode === 'vouchers' && vouchers.length > 0 && (
        <div className="space-y-2">
          {vouchers.map((voucher) => {
            const statusLabel =
              VOUCHER_STATUS_LABELS[voucher.status as keyof typeof VOUCHER_STATUS_LABELS] ||
              VOUCHER_STATUS_LABELS.pending
            const statusConfig =
              VOUCHER_STATUS_COLORS[voucher.status] || VOUCHER_STATUS_COLORS.pending

            return (
              <div
                key={voucher.id}
                className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                          statusConfig.color
                        )}
                      >
                        {statusConfig.icon}
                        {statusLabel}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        #{voucher.voucher_number || voucher.id}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {voucher.concept}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('voucher.for')}: {voucher.recipient}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <span className="inline-flex items-center gap-1">
                        <FiCalendar className="w-3.5 h-3.5" />
                        {formatDateTime(voucher.created_at)}
                      </span>
                      {voucher.justified_at && (
                        <span className="inline-flex items-center gap-1">
                          <FiCheckCircle className="w-3.5 h-3.5 text-green-500" />
                          {t('voucher.justified')}: {formatDate(voucher.justified_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(voucher.amount)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {t('voucher.shift')} #{voucher.shift_id}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* History View */}
      {!loading && !error && viewMode === 'history' && historyData.length > 0 && (
        <div className="border border-gray-200 dark:border-[#30363d] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-[#161b22]">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  {t('historyTable.action')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  {t('historyTable.table')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  {t('historyTable.field')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  {t('historyTable.user')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  {t('historyTable.date')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#30363d]">
              {historyData.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-gray-50 dark:hover:bg-[#161b22] transition-colors"
                >
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                    {entry.action}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {entry.table_affected || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {entry.field_changed || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FiUser className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {entry.username || entry.changed_by}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                    {formatDateTime(entry.changed_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty States */}
      {!loading && !error && viewMode === 'vouchers' && vouchers.length === 0 && loaded && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <FiFileText className="w-10 h-10 mb-2" />
          <p>
            {voucherStatus !== 'all'
              ? t('empty.noVouchersWithStatus', {
                  status:
                    VOUCHER_STATUS_LABELS[voucherStatus as keyof typeof VOUCHER_STATUS_LABELS],
                })
              : t('empty.noVouchers')}
          </p>
        </div>
      )}

      {!loading && !error && viewMode === 'history' && historyData.length === 0 && loaded && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <FiClock className="w-10 h-10 mb-2" />
          <p>{t('empty.noHistory')}</p>
        </div>
      )}

      {/* Count */}
      {!loading && viewMode === 'vouchers' && vouchers.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {t('showing', { count: vouchers.length, type: t('voucher_plural'), max: DEFAULT_LIMIT })}
        </div>
      )}

      {!loading && viewMode === 'history' && historyData.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {t('showing', {
            count: historyData.length,
            type: t('record_plural'),
            max: DEFAULT_LIMIT,
          })}
        </div>
      )}
    </div>
  )
}

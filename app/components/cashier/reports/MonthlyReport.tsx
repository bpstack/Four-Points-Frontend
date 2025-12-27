'use client'

import { useTranslations } from 'next-intl'
import { FiAlertCircle, FiCheckCircle, FiClock, FiDownload } from 'react-icons/fi'
import { useMonthlyReport } from '@/app/lib/cashier/queries'

interface MonthlyReportProps {
  year: number
  month: number
}

interface ParsedMethod {
  method_name: string
  total_amount: number
  percentage: number
}

interface ParsedDay {
  date: string
  status: 'open' | 'closed'
  total_cash: number
  grand_total: number
  has_discrepancy: boolean
}

// Raw types from API (values come as strings)
interface RawMethod {
  method_name: string
  total_amount: string | number
  percentage: string | number
}

interface RawDay {
  date: string
  status: 'open' | 'closed'
  total_cash: string | number
  grand_total: string | number
  has_discrepancia: boolean
}

interface RawReport {
  period: {
    year: number
    month: number
    start: string
    end: string
    total_days: number
    days_closed: number
    days_open: number
  }
  totals: {
    total_cash: string | number
    total_card: string | number
    total_bacs: string | number
    total_web_payment: string | number
    total_transfer: string | number
    total_other: string | number
    grand_total: string | number
  }
  payment_methods_breakdown: RawMethod[]
  daily_breakdown: RawDay[]
  validation_errors?: string[]
}

export default function MonthlyReport({ year, month }: MonthlyReportProps) {
  const t = useTranslations('cashier')
  const { data: reportData, isLoading, error } = useMonthlyReport(year, month)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-solid border-blue-600 dark:border-blue-500 border-r-transparent"></div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('page.loadingReport')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <FiAlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-300 text-sm mb-1">
              {t('error.loadingReport')}
            </h3>
            <p className="text-xs text-red-700 dark:text-red-400">{(error as Error).message}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!reportData) return null

  const rawReport = reportData as unknown as RawReport

  // Verificación defensiva - si no hay datos de totals, mostrar mensaje
  if (!rawReport.totals) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <FiAlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800 dark:text-yellow-300 text-sm mb-1">
              {t('reports.noDataForPeriod')}
            </h3>
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              {t('reports.noDataDescription')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // PARSEO SIMPLE - Backend ya envía valores correctos
  const report = {
    period: rawReport.period,
    totals: {
      grand_total: parseFloat(String(rawReport.totals.grand_total)) || 0,
      total_cash: parseFloat(String(rawReport.totals.total_cash)) || 0,
      total_card: parseFloat(String(rawReport.totals.total_card)) || 0,
      total_bacs: parseFloat(String(rawReport.totals.total_bacs)) || 0,
      total_web_payment: parseFloat(String(rawReport.totals.total_web_payment)) || 0,
      total_transfer: parseFloat(String(rawReport.totals.total_transfer)) || 0,
      total_other: parseFloat(String(rawReport.totals.total_other)) || 0,
    },
    payment_methods_breakdown: (rawReport.payment_methods_breakdown || []).map(
      (method: RawMethod): ParsedMethod => ({
        method_name: method.method_name,
        total_amount: parseFloat(String(method.total_amount)) || 0,
        percentage: parseFloat(String(method.percentage)) || 0,
      })
    ),
    daily_breakdown: (rawReport.daily_breakdown || []).map(
      (day: RawDay): ParsedDay => ({
        date: day.date,
        status: day.status,
        total_cash: parseFloat(String(day.total_cash)) || 0,
        grand_total: parseFloat(String(day.grand_total)) || 0,
        has_discrepancy: day.has_discrepancia,
      })
    ),
    validation_errors: rawReport.validation_errors || [],
  }

  return (
    <div className="space-y-4">
      {/* Desglose por Método de Pago */}
      <div className="bg-white dark:bg-[#151b23] border border-gray-200 dark:border-gray-800 rounded-md p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          {t('reports.paymentMethodBreakdown')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {report.payment_methods_breakdown.map((method: ParsedMethod) => (
            <div
              key={method.method_name}
              className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
            >
              <p className="text-[10px] text-gray-600 dark:text-gray-400 mb-1">
                {method.method_name}
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {method.total_amount.toFixed(2)}€
              </p>
              <div className="mt-1.5">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <div
                    className="bg-blue-600 h-1 rounded-full transition-all"
                    style={{ width: `${method.percentage}%` }}
                  />
                </div>
                <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {method.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de Días */}
      <div className="bg-white dark:bg-[#151b23] border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0d1117]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {t('reports.dailyBreakdown')}
          </h3>
          <button
            className="px-2 py-1 text-[10px] font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
            onClick={() => {
              console.log('Exportar reporte')
            }}
          >
            <FiDownload className="w-3 h-3" />
            {t('reports.export')}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#0d1117]">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('reports.dateCol')}
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('reports.statusCol')}
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('reports.cashCol')}
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('reports.totalCol')}
                </th>
                <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('reports.validCol')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {report.daily_breakdown.map((day: ParsedDay) => {
                const date = new Date(day.date)
                const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' })
                const dayNumber = date.getDate()

                return (
                  <tr
                    key={day.date}
                    className="hover:bg-gray-50 dark:hover:bg-[#0d1117] transition-colors"
                  >
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 dark:text-gray-400 capitalize text-[10px]">
                          {dayName}
                        </span>
                        <span className="font-medium text-[11px]">{dayNumber}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {day.status === 'closed' ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[9px] font-medium rounded">
                          <FiCheckCircle className="w-2.5 h-2.5" />
                          {t('summary.closed')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[9px] font-medium rounded">
                          <FiClock className="w-2.5 h-2.5" />
                          {t('summary.open')}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-right font-medium text-gray-900 dark:text-white">
                      {day.total_cash.toFixed(2)}€
                    </td>
                    <td className="px-3 py-2 text-[11px] text-right font-bold text-gray-900 dark:text-white">
                      {day.grand_total.toFixed(2)}€
                    </td>
                    <td className="px-3 py-2 text-center">
                      {day.has_discrepancy ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                          <FiAlertCircle className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                          <FiCheckCircle className="w-3 h-3" />
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-[#0d1117] font-bold border-t border-gray-200 dark:border-gray-800">
              <tr>
                <td colSpan={2} className="px-3 py-2 text-[11px] text-gray-900 dark:text-white">
                  {t('reports.monthTotal')}
                </td>
                <td className="px-3 py-2 text-[11px] text-right text-gray-900 dark:text-white">
                  {report.totals.total_cash.toFixed(2)}€
                </td>
                <td className="px-3 py-2 text-[11px] text-right text-green-600 dark:text-green-400">
                  {report.totals.grand_total.toFixed(2)}€
                </td>
                <td className="px-3 py-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Validaciones/Alertas */}
      {report.validation_errors && report.validation_errors.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <FiAlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-300 text-xs mb-1">
                {t('reports.periodWarnings')}
              </h4>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-yellow-700 dark:text-yellow-400">
                {report.validation_errors.map((error: string, idx: number) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

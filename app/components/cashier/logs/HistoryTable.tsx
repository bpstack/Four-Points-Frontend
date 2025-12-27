// app/components/cashier/logs/HistoryTable.tsx

'use client'

import { useTranslations } from 'next-intl'
import { FiChevronLeft, FiChevronRight, FiAlertCircle } from 'react-icons/fi'
import type { HistoryWithDetails } from '@/app/lib/cashier/types'

interface HistoryTableProps {
  logs: HistoryWithDetails[]
  isLoading: boolean
  offset: number
  limit: number
  onNextPage: () => void
  onPreviousPage: () => void
}

export default function HistoryTable({
  logs,
  isLoading,
  offset,
  limit,
  onNextPage,
  onPreviousPage,
}: HistoryTableProps) {
  const t = useTranslations('cashier')

  const getActionBadge = (action: string) => {
    const badges: Record<string, { bg: string; text: string; labelKey: string }> = {
      created: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-400',
        labelKey: 'actions.created',
      },
      updated: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-400',
        labelKey: 'actions.updated',
      },
      deleted: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
        labelKey: 'actions.deleted',
      },
      status_changed: {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-700 dark:text-purple-400',
        labelKey: 'actions.estado',
      },
      adjustment: {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-700 dark:text-orange-400',
        labelKey: 'actions.adjustment',
      },
      voucher_created: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-400',
        labelKey: 'voucher.newVoucher',
      },
      voucher_repaid: {
        bg: 'bg-teal-100 dark:bg-teal-900/30',
        text: 'text-teal-700 dark:text-teal-400',
        labelKey: 'voucher.justified',
      },
      daily_closed: {
        bg: 'bg-indigo-100 dark:bg-indigo-900/30',
        text: 'text-indigo-700 dark:text-indigo-400',
        labelKey: 'summary.closed',
      },
      daily_reopened: {
        bg: 'bg-pink-100 dark:bg-pink-900/30',
        text: 'text-pink-700 dark:text-pink-400',
        labelKey: 'reopenDay.title',
      },
    }

    const badge = badges[action] || {
      bg: 'bg-gray-100 dark:bg-gray-900/30',
      text: 'text-gray-700 dark:text-gray-400',
      labelKey: '',
    }

    const label = badge.labelKey ? t(badge.labelKey) : action

    return (
      <span
        className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded ${badge.bg} ${badge.text}`}
      >
        {label}
      </span>
    )
  }

  const formatShiftType = (type?: string) => {
    if (!type) return '-'
    const types: Record<string, string> = {
      night: t('shifts.night'),
      morning: t('shifts.morning'),
      afternoon: t('shifts.afternoon'),
      closing: t('shifts.closing'),
    }
    return types[type] || type
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#151b23] border border-gray-200 dark:border-gray-800 rounded-md p-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-solid border-blue-600 dark:border-blue-500 border-r-transparent"></div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {t('page.loadingHistory')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-white dark:bg-[#151b23] border border-gray-200 dark:border-gray-800 rounded-md p-8">
        <div className="text-center">
          <FiAlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-600 dark:text-gray-400">{t('page.noRecords')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#151b23] border border-gray-200 dark:border-gray-800 rounded-md shadow-sm overflow-hidden">
      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-[#0d1117] border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('logs.dateTime')}
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('logs.action')}
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('logs.shift')}
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('logs.user')}
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('logs.field')}
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('logs.change')}
              </th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('logs.notes')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {logs.map((log) => (
              <tr
                key={log.id}
                className="hover:bg-gray-50 dark:hover:bg-[#0d1117] transition-colors"
              >
                {/* Fecha/Hora */}
                <td className="px-3 py-2 text-xs text-gray-900 dark:text-white whitespace-nowrap">
                  <div>
                    <div className="font-medium text-[11px]">
                      {new Date(log.changed_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {new Date(log.changed_at).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </td>

                {/* Acción */}
                <td className="px-3 py-2">{getActionBadge(log.action)}</td>

                {/* Turno */}
                <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                  {log.shift_date && log.shift_type ? (
                    <div>
                      <div className="text-[11px] font-medium">
                        {new Date(log.shift_date).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">
                        {formatShiftType(log.shift_type)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-[10px]">-</span>
                  )}
                </td>

                {/* Usuario */}
                <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                  {log.username || (
                    <span className="text-gray-400 italic text-[10px]">{t('logs.system')}</span>
                  )}
                </td>

                {/* Campo */}
                <td className="px-3 py-2 text-[10px] text-gray-600 dark:text-gray-400">
                  {log.field_changed || <span className="text-gray-400">-</span>}
                </td>

                {/* Cambio */}
                <td className="px-3 py-2">
                  {log.old_value || log.new_value ? (
                    <div className="max-w-[120px]">
                      {log.old_value && (
                        <div className="text-red-600 dark:text-red-400 text-[10px] truncate">
                          <span className="font-medium">-</span> {log.old_value}
                        </div>
                      )}
                      {log.new_value && (
                        <div className="text-green-600 dark:text-green-400 text-[10px] truncate">
                          <span className="font-medium">+</span> {log.new_value}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-[10px]">-</span>
                  )}
                </td>

                {/* Notas */}
                <td className="px-3 py-2 text-[10px] text-gray-600 dark:text-gray-400 max-w-[100px]">
                  {log.notes ? (
                    <span className="truncate block" title={log.notes}>
                      {log.notes}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-[#0d1117]">
        <div className="text-[10px] text-gray-600 dark:text-gray-400">
          {offset + 1} - {offset + logs.length}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPreviousPage}
            disabled={offset === 0}
            className="px-2 py-1 text-[10px] border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-0.5"
          >
            <FiChevronLeft className="w-3 h-3" />
            {t('logs.previous')}
          </button>
          <button
            onClick={onNextPage}
            disabled={logs.length < limit}
            className="px-2 py-1 text-[10px] border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-0.5"
          >
            {t('logs.next')}
            <FiChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

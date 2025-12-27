// app/components/blacklist/layout/BlacklistDetailSummaryPanel.tsx

'use client'

import { useTranslations } from 'next-intl'
import { FiLogIn, FiLogOut, FiClock, FiAlertTriangle, FiUser } from 'react-icons/fi'
import { BlacklistEntry } from '@/app/lib/blacklist/types'
import { SEVERITY_LEVELS } from '@/app/lib/blacklist/types'
import { formatDate, formatDateTime, calculateStayDays } from '@/app/lib/blacklist/blacklistUtils'

interface BlacklistDetailSummaryPanelProps {
  entry: BlacklistEntry
}

export function BlacklistDetailSummaryPanel({ entry }: BlacklistDetailSummaryPanelProps) {
  const t = useTranslations('blacklist')
  const stayDays = calculateStayDays(entry.check_in_date, entry.check_out_date)

  const getSeverityConfig = (severity: BlacklistEntry['severity']) => {
    const configs = {
      LOW: {
        bg: 'bg-gray-100 dark:bg-gray-900/20',
        text: 'text-gray-600 dark:text-gray-400',
        icon: 'text-gray-500',
      },
      MEDIUM: {
        bg: 'bg-blue-100 dark:bg-blue-900/20',
        text: 'text-blue-600 dark:text-blue-400',
        icon: 'text-blue-500',
      },
      HIGH: {
        bg: 'bg-orange-100 dark:bg-orange-900/20',
        text: 'text-orange-600 dark:text-orange-400',
        icon: 'text-orange-500',
      },
      CRITICAL: {
        bg: 'bg-red-100 dark:bg-red-900/20',
        text: 'text-red-600 dark:text-red-400',
        icon: 'text-red-500',
      },
    }
    return configs[severity]
  }

  const severityConfig = getSeverityConfig(entry.severity)

  return (
    <div className="sticky top-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        {t('detail.summaryTitle')}
      </h3>

      {/* Gravedad */}
      <div
        className={`bg-white dark:bg-[#0D1117] border rounded-xl shadow-sm p-4 ${
          entry.severity === 'CRITICAL'
            ? 'border-red-200 dark:border-red-800/30'
            : 'border-[#d0d7de] dark:border-[#30363d]'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {t('detail.severityLevel')}
            </p>
            <p className={`text-lg font-bold mt-0.5 ${severityConfig.text}`}>
              {SEVERITY_LEVELS[entry.severity]}
            </p>
          </div>
          <div className={`p-2 ${severityConfig.bg} rounded-lg`}>
            <FiAlertTriangle className={`w-5 h-5 ${severityConfig.icon}`} />
          </div>
        </div>
      </div>

      {/* Entrada */}
      <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {t('detail.checkInDate')}
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">
              {formatDate(entry.check_in_date)}
            </p>
          </div>
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <FiLogIn className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      {/* Salida */}
      <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {t('detail.checkOutDate')}
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">
              {formatDate(entry.check_out_date)}
            </p>
          </div>
          <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
            <FiLogOut className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>

      {/* Estancia */}
      <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {t('detail.stay')}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
              {stayDays}{' '}
              <span className="text-sm font-normal text-gray-500">
                {stayDays === 1 ? t('detail.day') : t('detail.days')}
              </span>
            </p>
          </div>
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <FiClock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Registrado por */}
      <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {t('detail.registeredBy')}
            </p>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <FiUser className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {entry.created_by_username || t('detail.unknown')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatDateTime(entry.created_at)}
          </p>
          {entry.updated_at && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {t('detail.lastModification')}:
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {formatDateTime(entry.updated_at)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Estado */}
      <div
        className={`bg-white dark:bg-[#0D1117] border rounded-xl shadow-sm p-4 ${
          entry.status === 'ACTIVE'
            ? 'border-green-200 dark:border-green-800/30'
            : 'border-gray-200 dark:border-gray-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {t('detail.recordStatus')}
          </p>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              entry.status === 'ACTIVE'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
            }`}
          >
            {entry.status === 'ACTIVE' ? t('status.active') : t('status.deleted')}
          </span>
        </div>
      </div>
    </div>
  )
}

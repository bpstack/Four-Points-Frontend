// app/components/maintenance/tabs/HistoryTab.tsx

'use client'

import { useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useMaintenanceStore } from '@/app/stores/useMaintenanceStore'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { EmptyState } from '../shared/EmptyState'
import { FiClock, FiUser, FiEdit, FiAlertCircle } from 'react-icons/fi'

export function HistoryTab() {
  const t = useTranslations('maintenance')
  const locale = useLocale()
  const { currentReport, history, isLoadingHistory, refreshHistory } = useMaintenanceStore()

  useEffect(() => {
    if (currentReport) {
      refreshHistory(currentReport.id)
    }
  }, [currentReport, refreshHistory])

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" message={t('history.loading')} />
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <EmptyState
        icon={<FiClock className="w-12 h-12" />}
        title={t('history.empty')}
        description={t('history.emptyDescription')}
      />
    )
  }

  const getActionConfig = (action: (typeof history)[0]['action']) => {
    const configs = {
      created: {
        icon: <FiEdit className="w-4 h-4" />,
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        label: t('history.actions.created'),
      },
      status_changed: {
        icon: <FiAlertCircle className="w-4 h-4" />,
        color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        label: t('history.actions.statusChanged'),
      },
      priority_changed: {
        icon: <FiAlertCircle className="w-4 h-4" />,
        color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        label: t('history.actions.priorityChanged'),
      },
      updated: {
        icon: <FiEdit className="w-4 h-4" />,
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
        label: t('history.actions.updated'),
      },
      assigned: {
        icon: <FiUser className="w-4 h-4" />,
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        label: t('history.actions.assigned'),
      },
      resolved: {
        icon: <FiAlertCircle className="w-4 h-4" />,
        color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        label: t('history.actions.resolved'),
      },
      closed: {
        icon: <FiAlertCircle className="w-4 h-4" />,
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
        label: t('history.actions.closed'),
      },
      deleted: {
        icon: <FiAlertCircle className="w-4 h-4" />,
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        label: t('history.actions.deleted'),
      },
    }
    return configs[action]
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
          <FiClock className="w-4 h-4" />
          {t('history.title')}
        </h3>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800" />

          {/* History entries */}
          <div className="space-y-4">
            {history.map((entry) => {
              const actionConfig = getActionConfig(entry.action)
              return (
                <div key={entry.id} className="relative pl-10">
                  {/* Icon */}
                  <div
                    className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${actionConfig.color}`}
                  >
                    {actionConfig.icon}
                  </div>

                  {/* Content */}
                  <div className="bg-gray-50 dark:bg-[#0d1117] rounded-md p-3 border border-gray-200 dark:border-gray-800">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                          {actionConfig.label}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                          {entry.user_name || t('history.system')} •{' '}
                          {formatDateTime(entry.changed_at)}
                        </p>
                      </div>
                    </div>

                    {entry.notes && (
                      <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">{entry.notes}</p>
                    )}

                    {entry.field_changed && (
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 space-y-0.5">
                        {entry.old_value && (
                          <p>
                            <span className="font-medium">{t('history.previous')}</span>{' '}
                            {entry.old_value}
                          </p>
                        )}
                        {entry.new_value && (
                          <p>
                            <span className="font-medium">{t('history.new')}</span>{' '}
                            {entry.new_value}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

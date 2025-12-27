// app/components/cashier/layout/LogsSummarySidebar.tsx
'use client'

import { useTranslations } from 'next-intl'
import { FiActivity, FiUsers, FiList } from 'react-icons/fi'
import type { HistoryStats } from '@/app/lib/cashier/types'

interface LogsSummarySidebarProps {
  stats: HistoryStats | null
  isLoading: boolean
}

export default function LogsSummarySidebar({ stats, isLoading }: LogsSummarySidebarProps) {
  const t = useTranslations('cashier')

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      created: t('actions.created'),
      updated: t('actions.updated'),
      deleted: t('actions.deleted'),
      status_changed: t('actions.status_changed'),
      adjustment: t('actions.adjustment'),
      voucher_created: t('actions.voucher_created'),
      voucher_repaid: t('actions.voucher_repaid'),
      daily_closed: t('actions.daily_closed'),
      daily_reopened: t('actions.daily_reopened'),
    }
    return labels[action] || action
  }

  if (isLoading) {
    return (
      <div className="sticky top-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {t('logs.statistics')}
        </h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl p-4 h-24"
            />
          ))}
        </div>
      </div>
    )
  }

  if (!stats || !stats.most_active_users || !stats.actions_breakdown || !stats.recent_activity) {
    return null
  }

  const topUsers = stats.most_active_users.slice(0, 3)
  const topActions = stats.actions_breakdown.sort((a, b) => b.count - a.count).slice(0, 3)

  return (
    <div className="sticky top-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        {t('logs.statistics')}
      </h3>

      {/* Total Registros */}
      <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {t('logs.totalRecords')}
          </p>
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <FiActivity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {stats.total_entries}
        </p>
        <div className="space-y-1.5">
          {topActions.map((action) => (
            <div key={action.action} className="flex items-center justify-between text-[11px]">
              <span className="text-gray-600 dark:text-gray-400">
                {getActionLabel(action.action)}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">{action.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Usuarios Más Activos */}
      <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {t('logs.activeUsers')}
          </p>
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <FiUsers className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="space-y-2.5">
          {topUsers.length > 0 ? (
            topUsers.map((user, index) => (
              <div key={user.user_id} className="flex items-center gap-2.5">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-[10px]">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {user.username}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {user.actions_count} {t('logs.action').toLowerCase()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
              {t('logs.noActivity')}
            </p>
          )}
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {t('logs.recentActivity')}
          </p>
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <FiList className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <div className="space-y-2.5">
          {stats.recent_activity.slice(0, 3).map((activity) => (
            <div key={activity.id} className="border-l-2 border-blue-500 pl-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-900 dark:text-white">
                  {getActionLabel(activity.action)}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  {new Date(activity.changed_at).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">
                {activity.username || t('logs.system')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

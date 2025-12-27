// app/components/profile/NotificationsPanel.tsx

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { FiBell, FiCheck } from 'react-icons/fi'
import { useNotifications } from '@/app/lib/notifications/useNotifications'
import NotificationItem from '@/app/components/notifications/items/NotificationItem'

type FilterType = 'all' | 'unread'

export function NotificationsPanel() {
  const t = useTranslations('notifications')
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications()
  const [filter, setFilter] = useState<FilterType>('all')

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-[#30363d]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {t('panel.title')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {unreadCount > 0
                ? t('panel.unreadCount', { count: unreadCount })
                : t('panel.allRead')}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-1.5"
            >
              <FiCheck className="w-3 h-3" />
              {t('panel.markAll')}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#21262d] dark:text-gray-300 dark:hover:bg-[#30363d]'
            }`}
          >
            {t('list.all', { count: notifications.length })}
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#21262d] dark:text-gray-300 dark:hover:bg-[#30363d]'
            }`}
          >
            {t('list.unread', { count: unreadCount })}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <FiBell className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filter === 'unread' ? t('list.noUnread') : t('list.noNotifications')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-[#30363d]">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

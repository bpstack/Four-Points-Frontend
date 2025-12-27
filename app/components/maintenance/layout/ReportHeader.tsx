// app/components/maintenance/layout/ReportHeader.tsx

'use client'

import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import type { ReportWithDetails } from '@/app/lib/maintenance/maintenance'
import { FiArrowLeft, FiEdit, FiTrash2 } from 'react-icons/fi'

interface ReportHeaderProps {
  report: ReportWithDetails
  onEdit: () => void
  onDelete: () => void
}

export function ReportHeader({ report, onEdit, onDelete }: ReportHeaderProps) {
  const router = useRouter()
  const t = useTranslations('maintenance')
  const locale = useLocale()

  const getStatusConfig = (status: typeof report.status) => {
    const configs = {
      reported: {
        color:
          'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
        label: t('status.reported'),
      },
      assigned: {
        color:
          'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        label: t('status.assigned'),
      },
      in_progress: {
        color:
          'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
        label: t('status.inProgress'),
      },
      waiting: {
        color:
          'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
        label: t('status.waiting'),
      },
      completed: {
        color:
          'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
        label: t('status.completed'),
      },
      closed: {
        color:
          'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
        label: t('status.closed'),
      },
      canceled: {
        color:
          'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        label: t('status.canceled'),
      },
    }
    return configs[status]
  }

  const statusConfig = getStatusConfig(report.status)

  return (
    <div className="bg-white dark:bg-[#010409] border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-[1400px] px-4 md:px-6 py-6">
        {/* Back button */}
        <button
          onClick={() => router.push('/dashboard/maintenance')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          {t('detail.backToList')}
        </button>

        {/* Header content */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {report.title}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color} flex-shrink-0`}
              >
                {statusConfig.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-mono">ID: {report.id}</span>
              <span>•</span>
              <span>
                {t('detail.reported')}{' '}
                {new Date(report.report_date).toLocaleDateString(locale, {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              {report.room_number && (
                <>
                  <span>•</span>
                  <span>
                    {t('detail.room')} {report.room_number}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <FiEdit className="w-3.5 h-3.5" />
              {t('detail.edit')}
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-800 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
              {t('detail.delete')}
            </button>
          </div>
        </div>

        {/* Room out of service warning */}
        {report.room_out_of_service && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-400 font-medium">
              ⚠️ {t('detail.roomOutOfServiceWarning')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

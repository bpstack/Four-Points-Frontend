// app/components/dashboard/ImportantLogbooksCard.tsx
'use client'

import React from 'react'
import { useTranslations, useLocale } from 'next-intl'
import {
  FiAlertTriangle,
  FiAlertCircle,
  FiRefreshCw,
  FiArrowRight,
  FiClock,
  FiCheckCircle,
} from 'react-icons/fi'

export interface LogbookEntryDisplay {
  id: number
  timestamp: string
  author_name: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'pending' | 'resolved'
  department_id: number
}

interface ImportantLogbooksCardProps {
  entries: LogbookEntryDisplay[]
  loading: boolean
  selectedPeriod: 'today' | 'week' | 'month'
  onRefresh: () => void
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical':
      return 'border-l-4 border-l-red-500 dark:border-l-red-400 bg-red-50 dark:bg-red-900/10'
    case 'high':
      return 'border-l-4 border-l-yellow-500 dark:border-l-yellow-400 bg-yellow-50 dark:bg-yellow-900/10'
    default:
      return 'border-l-4 border-l-[#d0d7de] dark:border-l-[#30363d]'
  }
}

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
    case 'high':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
    default:
      return 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#57606a] dark:text-[#8b949e]'
  }
}

export function ImportantLogbooksCard({
  entries,
  loading,
  selectedPeriod,
  onRefresh,
}: ImportantLogbooksCardProps) {
  const t = useTranslations('dashboard.importantLogbooks')
  const locale = useLocale()
  const localeCode = locale === 'es' ? 'es-ES' : 'en-US'

  const periodLabel = t(`emptyMessage.${selectedPeriod}`)

  const getPeriodTitle = () => {
    const labels: Record<string, string> = {
      today: locale === 'es' ? 'Hoy' : 'Today',
      week: locale === 'es' ? 'Esta Semana' : 'This Week',
      month: locale === 'es' ? 'Este Mes' : 'This Month',
    }
    return labels[selectedPeriod]
  }

  return (
    <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <FiAlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-sm font-bold text-[#24292f] dark:text-[#f0f6fc]">
            {t('title', { period: getPeriodTitle() })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors disabled:opacity-50"
            title={t('refresh')}
          >
            <FiRefreshCw
              className={`w-4 h-4 text-[#57606a] dark:text-[#8b949e] ${loading ? 'animate-spin' : ''}`}
            />
          </button>
          <a href="/dashboard/logbooks">
            <button className="text-xs font-semibold text-[#0969da] dark:text-[#58a6ff] hover:text-[#0550ae] dark:hover:text-[#79c0ff] flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors">
              {t('viewAll')} <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          </a>
        </div>
      </div>

      {/* Entry Counter */}
      {!loading && entries.length > 0 && (
        <div className="mb-3 flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
          <FiAlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-blue-700 dark:text-blue-300">
            <strong className="font-bold">{entries.length}</strong>{' '}
            {entries.length !== 1
              ? t('entriesCountPlural', { count: '' }).trim()
              : t('entriesCount', { count: '' }).trim()}{' '}
            {periodLabel}
          </span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse p-4 bg-gradient-to-br from-[#f6f8fa] to-white dark:from-[#0d1117] dark:to-[#161b22] rounded-lg border border-[#d0d7de] dark:border-[#21262d] h-28"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-3">
            <FiCheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm font-medium text-[#57606a] dark:text-[#8b949e]">
            {t('noItems', { period: periodLabel })}
          </p>
        </div>
      ) : (
        <div
          className={`space-y-3 ${entries.length > 5 ? 'max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#d0d7de] dark:scrollbar-thumb-[#30363d] scrollbar-track-transparent' : ''}`}
        >
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`p-4 rounded-lg ${getPriorityColor(entry.priority)} border border-[#d0d7de] dark:border-[#30363d] hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FiClock className="w-3.5 h-3.5 text-[#57606a] dark:text-[#8b949e]" />
                  <span className="text-xs font-bold text-[#24292f] dark:text-[#f0f6fc]">
                    {new Date(entry.timestamp).toLocaleDateString(localeCode, {
                      day: '2-digit',
                      month: '2-digit',
                    })}{' '}
                    {new Date(entry.timestamp).toLocaleTimeString(localeCode, {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {entry.status === 'resolved' ? (
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 font-bold border border-green-200 dark:border-green-800">
                      {t('status.resolved')}
                    </span>
                  ) : (
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-800">
                      {t('status.pending')}
                    </span>
                  )}
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border ${getPriorityBadge(entry.priority)}`}
                  >
                    {entry.priority === 'critical' && <FiAlertTriangle className="w-3 h-3" />}
                    {entry.priority === 'high' && <FiAlertCircle className="w-3 h-3" />}
                    {t(`priority.${entry.priority}`)}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-[#57606a] dark:text-[#8b949e] mb-2 font-medium">
                {t('by', { author: entry.author_name })}
              </p>
              <p className="text-xs text-[#24292f] dark:text-[#c9d1d9] leading-relaxed">
                {entry.description.length > 400
                  ? `${entry.description.substring(0, 400)}...`
                  : entry.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

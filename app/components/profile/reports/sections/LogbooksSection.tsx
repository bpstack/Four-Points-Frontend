// app/components/profile/reports/sections/LogbooksSection.tsx

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { apiClient } from '@/app/lib/apiClient'
import { cn } from '@/app/lib/helpers/utils'
import { API_BASE_URL } from '@/app/lib/env'
import {
  FiBook,
  FiLoader,
  FiAlertCircle,
  FiRefreshCw,
  FiFilter,
  FiUser,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiTrash2,
  FiChevronDown,
  FiChevronRight,
} from 'react-icons/fi'
import type { LogbookEntry, LogbookHistoryEntry } from '../types'
import DateFilter from '../DateFilter'

const API_URL = API_BASE_URL

// Límite de registros por defecto
const DEFAULT_LIMIT = 50

// ═══════════════════════════════════════════════════════
// PRIORITY CONFIG (colors only - labels use translations)
// ═══════════════════════════════════════════════════════

const PRIORITY_COLORS: Record<string, string> = {
  baja: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  media: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  alta: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  urgente: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

type ViewMode = 'all' | 'trashed'

// ═══════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════

export default function LogbooksSection() {
  const t = useTranslations('profile.reports.logbooks')
  const locale = useLocale()
  const [logbooks, setLogbooks] = useState<LogbookEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string | null>(null)

  // History expansion
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [history, setHistory] = useState<LogbookHistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Priority labels with translations
  const PRIORITY_LABELS = useMemo(
    () => ({
      baja: t('priority.low'),
      media: t('priority.medium'),
      alta: t('priority.high'),
      urgente: t('priority.urgent'),
    }),
    [t]
  )

  const fetchLogbooks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let endpoint: string

      // Use specific endpoint based on filters
      if (dateFilter) {
        // Use the day-specific endpoint
        endpoint = `${API_URL}/api/logbooks/day/${dateFilter}`
      } else if (viewMode === 'trashed') {
        endpoint = `${API_URL}/api/logbooks/trashed`
      } else if (priorityFilter !== 'all') {
        endpoint = `${API_URL}/api/logbooks/priority/${priorityFilter}`
      } else {
        endpoint = `${API_URL}/api/logbooks/all`
      }

      const response = await apiClient.get<{ data?: LogbookEntry[] } | LogbookEntry[]>(endpoint)
      const data = (response as { data?: LogbookEntry[] }).data || response || []
      // Limit to DEFAULT_LIMIT (backend doesn't support limit param)
      setLogbooks(Array.isArray(data) ? data.slice(0, DEFAULT_LIMIT) : [])
      setLoaded(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('noData'))
    } finally {
      setLoading(false)
    }
  }, [viewMode, priorityFilter, dateFilter, t])

  const fetchHistory = useCallback(
    async (logbookId: number) => {
      if (expandedId === logbookId) {
        setExpandedId(null)
        return
      }

      setHistoryLoading(true)
      setExpandedId(logbookId)
      try {
        const response = await apiClient.get<{
          history?: LogbookHistoryEntry[]
          data?: { history?: LogbookHistoryEntry[] }
        }>(`${API_URL}/api/logbooks/${logbookId}/history`)
        // Backend returns { logbookId, history: [...] }
        setHistory(response.history || response.data?.history || [])
      } catch (err: unknown) {
        console.error('Error fetching history:', err)
        setHistory([])
      } finally {
        setHistoryLoading(false)
      }
    },
    [expandedId]
  )

  const handleDateChange = (date: string | null) => {
    setDateFilter(date)
    setLoaded(false) // Reset to trigger new fetch
  }

  const formatDate = (dateStr: string) => {
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
          <FiBook className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{t('title')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">{t('description')}</p>
        </div>
        <button
          onClick={fetchLogbooks}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <FiRefreshCw className="w-4 h-4" />
          {t('loadHistory')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-[#30363d]">
        <div className="flex items-center gap-2 flex-wrap">
          <FiFilter className="w-4 h-4 text-gray-400" />

          {/* Date Filter */}
          <DateFilter selectedDate={dateFilter} onDateChange={handleDateChange} />

          {/* View Mode */}
          <select
            value={viewMode}
            onChange={(e) => {
              setViewMode(e.target.value as ViewMode)
              setLoaded(false)
            }}
            className="text-sm border border-gray-300 dark:border-[#30363d] rounded-lg px-3 py-1.5 bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white"
          >
            <option value="all">{t('status.all')}</option>
            <option value="trashed">{t('filters.deleted')}</option>
          </select>

          {/* Priority Filter (solo en modo 'all') */}
          {viewMode === 'all' && (
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value)
                setLoaded(false)
              }}
              className="text-sm border border-gray-300 dark:border-[#30363d] rounded-lg px-3 py-1.5 bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white"
            >
              <option value="all">{t('priority.all')}</option>
              <option value="baja">{t('priority.low')}</option>
              <option value="media">{t('priority.medium')}</option>
              <option value="alta">{t('priority.high')}</option>
              <option value="urgente">{t('priority.urgent')}</option>
            </select>
          )}
        </div>
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

      {/* Logbooks List */}
      {!loading && !error && logbooks.length > 0 && (
        <div className="space-y-2">
          {logbooks.map((logbook) => {
            const priorityColor = PRIORITY_COLORS[logbook.importance_level] || PRIORITY_COLORS.baja
            const priorityLabel =
              PRIORITY_LABELS[logbook.importance_level as keyof typeof PRIORITY_LABELS] ||
              PRIORITY_LABELS.baja
            const isExpanded = expandedId === logbook.id

            return (
              <div
                key={logbook.id}
                className="border border-gray-200 dark:border-[#30363d] rounded-lg overflow-hidden"
              >
                {/* Logbook Row */}
                <div className="bg-white dark:bg-[#0d1117] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            priorityColor
                          )}
                        >
                          {priorityLabel}
                        </span>
                        {!!logbook.is_solved && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <FiCheckCircle className="w-3 h-3" />
                            {t('status.resolved')}
                          </span>
                        )}
                        {logbook.deleted_at && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <FiTrash2 className="w-3 h-3" />
                            {t('status.deleted')}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 font-mono">#{logbook.id}</span>
                      </div>

                      <p className="text-sm text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {logbook.message}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <FiUser className="w-3.5 h-3.5" />
                          {logbook.author_name || logbook.author_id}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FiCalendar className="w-3.5 h-3.5" />
                          {formatDate(logbook.created_at)}
                        </span>
                        {logbook.department_name && (
                          <span className="text-gray-400">{logbook.department_name}</span>
                        )}
                      </div>
                    </div>

                    {/* Expand History Button */}
                    <button
                      onClick={() => fetchHistory(logbook.id)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-[#21262d] rounded transition-colors"
                    >
                      <FiClock className="w-3.5 h-3.5" />
                      {t('table.date')}
                      {isExpanded ? (
                        <FiChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <FiChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* History Panel */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-[#30363d] bg-gray-50 dark:bg-[#161b22] p-4">
                    {historyLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <FiLoader className="w-5 h-5 animate-spin text-gray-400" />
                      </div>
                    ) : history.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                          {t('table.date')}
                        </h4>
                        {history.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-start gap-3 text-xs bg-white dark:bg-[#0d1117] p-2 rounded border border-gray-200 dark:border-[#30363d]"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {entry.action}
                                </span>
                                <span className="text-gray-400">-</span>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {entry.editor?.username || '-'}
                                </span>
                              </div>
                              {entry.previousContent != null && (
                                <p className="text-gray-500 line-through truncate">
                                  {typeof entry.previousContent === 'string'
                                    ? entry.previousContent
                                    : JSON.stringify(entry.previousContent)}
                                </p>
                              )}
                              {entry.newContent != null && (
                                <p className="text-gray-700 dark:text-gray-300 truncate">
                                  {typeof entry.newContent === 'string'
                                    ? entry.newContent
                                    : JSON.stringify(entry.newContent)}
                                </p>
                              )}
                            </div>
                            <span className="text-gray-400 flex-shrink-0">
                              {formatDate(entry.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">{t('noData')}</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && logbooks.length === 0 && loaded && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <FiBook className="w-10 h-10 mb-2" />
          <p>{t('noData')}</p>
        </div>
      )}

      {/* Count */}
      {!loading && logbooks.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {t('showing', { count: logbooks.length })}
        </div>
      )}
    </div>
  )
}

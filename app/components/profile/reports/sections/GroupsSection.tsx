// app/components/profile/reports/sections/GroupsSection.tsx

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { apiClient } from '@/app/lib/apiClient'
import { cn } from '@/app/lib/helpers/utils'
import { API_BASE_URL } from '@/app/lib/env'
import {
  FiUsers,
  FiLoader,
  FiAlertCircle,
  FiRefreshCw,
  FiFilter,
  FiCalendar,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiDollarSign,
  FiSearch,
} from 'react-icons/fi'
import type { GroupHistoryEntry } from '../types'
import DateFilter from '../DateFilter'

const API_URL = API_BASE_URL

// Límite de registros por defecto
const DEFAULT_LIMIT = 50

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface Group {
  id: number
  name: string
  agency: string | null
  arrival_date: string
  departure_date: string
  status: string
  total_amount: string
  currency: string
  notes: string | null
  created_by_username?: string
  created_at: string
}

interface DashboardOverview {
  groups: {
    total_groups: number
    confirmed_groups: string
    active_groups: string
    pending_groups: string
    total_revenue: string
  }
  payments: {
    total_payments: number
    total_paid: number
    total_pending: number
  }
}

// ═══════════════════════════════════════════════════════
// CONFIG (colors only - labels moved inside component for i18n)
// ═══════════════════════════════════════════════════════

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  tentative: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  completed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

// ═══════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════

export default function GroupsSection() {
  const t = useTranslations('profile.reports.groups')
  const locale = useLocale()

  // Status labels with translations
  const STATUS_LABELS = useMemo(
    () => ({
      confirmed: t('status.confirmed'),
      pending: t('status.pending'),
      tentative: t('status.tentative'),
      cancelled: t('status.cancelled'),
      completed: t('status.completed'),
    }),
    [t]
  )

  const [groups, setGroups] = useState<Group[]>([])
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Filters
  const [searchId, setSearchId] = useState('')
  const [dateFilter, setDateFilter] = useState<string | null>(null)

  // History expansion
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [history, setHistory] = useState<GroupHistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch dashboard overview
      const overviewResponse = (await apiClient.get(`${API_URL}/api/groups/dashboard/overview`)) as
        | { data?: DashboardOverview }
        | DashboardOverview
      setOverview(
        (overviewResponse as { data?: DashboardOverview }).data ||
          (overviewResponse as DashboardOverview)
      )

      // Build params for groups
      const params = new URLSearchParams()
      params.set('limit', DEFAULT_LIMIT.toString())
      if (dateFilter) {
        // Filter by arrival_date or created_at
        params.set('arrival_date', dateFilter)
      }

      // Fetch groups - backend returns { success, data: [...], count }
      const groupsResponse = (await apiClient.get(`${API_URL}/api/groups?${params.toString()}`)) as
        | { data?: Group[] }
        | Group[]
      const data = (groupsResponse as { data?: Group[] }).data || []
      setGroups(Array.isArray(data) ? data.slice(0, DEFAULT_LIMIT) : [])
      setLoaded(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('errorLoading'))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter])

  const fetchHistory = useCallback(
    async (groupId: number) => {
      if (expandedId === groupId) {
        setExpandedId(null)
        return
      }

      setHistoryLoading(true)
      setExpandedId(groupId)
      try {
        const response = (await apiClient.get(`${API_URL}/api/groups/${groupId}/history`)) as
          | { data?: GroupHistoryEntry[] }
          | GroupHistoryEntry[]
        const data = (response as { data?: GroupHistoryEntry[] }).data || response
        setHistory(Array.isArray(data) ? data : [])
      } catch (_err: unknown) {
        console.error('Error fetching history:', _err)
        setHistory([])
      } finally {
        setHistoryLoading(false)
      }
    },
    [expandedId]
  )

  const searchGroupById = useCallback(async () => {
    if (!searchId.trim()) return

    setLoading(true)
    setError(null)
    try {
      const response = (await apiClient.get(`${API_URL}/api/groups/${searchId}`)) as
        | { data?: Group }
        | Group
      const group = (response as { data?: Group }).data || (response as Group)
      if (group) {
        setGroups([group])
      }
    } catch (_err: unknown) {
      setError(t('notFound', { id: searchId }))
      setGroups([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchId])

  const handleDateChange = (date: string | null) => {
    setDateFilter(date)
    setLoaded(false)
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
          <FiUsers className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{t('title')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            {t('description', { count: DEFAULT_LIMIT })}
          </p>
        </div>
        <button
          onClick={fetchGroups}
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
      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-4 gap-4 pb-4 border-b border-gray-200 dark:border-[#30363d]">
          <div className="bg-gray-50 dark:bg-[#161b22] rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {overview.groups.total_groups}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('stats.total')}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {overview.groups.confirmed_groups}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('stats.confirmed')}</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {overview.groups.pending_groups}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('stats.pending')}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {groups.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('stats.shown')}</p>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-[#30363d]">
        <div className="flex items-center gap-2 flex-wrap">
          <FiFilter className="w-4 h-4 text-gray-400" />

          {/* Date Filter */}
          <DateFilter
            selectedDate={dateFilter}
            onDateChange={handleDateChange}
            label={t('arrivalDate')}
          />

          {/* Search by ID */}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchGroupById()}
              placeholder={t('searchId')}
              className="text-sm border border-gray-300 dark:border-[#30363d] rounded-lg px-3 py-1.5 bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white w-24"
            />
            <button
              onClick={searchGroupById}
              disabled={!searchId.trim()}
              className="p-1.5 text-gray-500 hover:text-blue-600 disabled:opacity-50"
            >
              <FiSearch className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setDateFilter(null)
              setSearchId('')
              setLoaded(false)
            }}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {t('viewAll')}
          </button>
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

      {/* Groups List */}
      {!loading && !error && groups.length > 0 && (
        <div className="space-y-2">
          {groups.map((group) => {
            const statusLabel =
              STATUS_LABELS[group.status as keyof typeof STATUS_LABELS] || STATUS_LABELS.confirmed
            const statusColor = STATUS_COLORS[group.status] || STATUS_COLORS.confirmed
            const isExpanded = expandedId === group.id

            return (
              <div
                key={group.id}
                className="border border-gray-200 dark:border-[#30363d] rounded-lg overflow-hidden"
              >
                {/* Group Row */}
                <div className="bg-white dark:bg-[#0d1117] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            statusColor
                          )}
                        >
                          {statusLabel}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">#{group.id}</span>
                      </div>

                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {group.name}
                      </h4>
                      {group.agency && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {group.agency}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <FiCalendar className="w-3.5 h-3.5" />
                          {formatDate(group.arrival_date)} - {formatDate(group.departure_date)}
                        </span>
                        {group.total_amount && (
                          <span className="inline-flex items-center gap-1">
                            <FiDollarSign className="w-3.5 h-3.5" />
                            {group.currency} {parseFloat(group.total_amount).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expand History Button */}
                    <button
                      onClick={() => fetchHistory(group.id)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-[#21262d] rounded transition-colors"
                    >
                      <FiClock className="w-3.5 h-3.5" />
                      {t('history.title')}
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
                          {t('history.changes')}
                        </h4>
                        {history.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-start gap-3 text-xs bg-white dark:bg-[#0d1117] p-2 rounded border border-gray-200 dark:border-[#30363d]"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {entry.action}
                                </span>
                                {entry.table_affected && (
                                  <span className="text-gray-400">({entry.table_affected})</span>
                                )}
                                {entry.field_changed && (
                                  <span className="text-blue-500">{entry.field_changed}</span>
                                )}
                                <span className="text-gray-400">{t('history.by')}</span>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {entry.changed_by_username || entry.changed_by}
                                </span>
                              </div>
                              {entry.old_value && (
                                <p className="text-gray-500 line-through truncate">
                                  {entry.old_value}
                                </p>
                              )}
                              {entry.new_value && (
                                <p className="text-gray-700 dark:text-gray-300 truncate">
                                  {entry.new_value}
                                </p>
                              )}
                            </div>
                            <span className="text-gray-400 flex-shrink-0">
                              {formatDateTime(entry.changed_at)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        {t('history.noHistory')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && groups.length === 0 && loaded && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <FiUsers className="w-10 h-10 mb-2" />
          <p>
            {t('noData')} {dateFilter ? `(${dateFilter})` : ''}
          </p>
        </div>
      )}

      {/* Count */}
      {!loading && groups.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {t('showing', { count: groups.length })}
          {dateFilter ? ` (${dateFilter})` : ` (max. ${DEFAULT_LIMIT})`}
        </div>
      )}
    </div>
  )
}

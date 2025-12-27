// app/dashboard/blacklist/page.tsx
'use client'

/**
 * Página principal del módulo Blacklist
 * - Client Component para panel lateral
 * - Layout 2 columnas (tabla + stats sidebar)
 * - Tabla con paginación
 * - Búsqueda y filtros
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  FiPlus,
  FiSearch,
  FiAlertTriangle,
  FiEye,
  FiShield,
  FiAlertCircle,
  FiCheckCircle,
} from 'react-icons/fi'
import { IoWarning } from 'react-icons/io5'
import { Badge } from '@/app/components/blacklist/ui/Badge'
import { CreateBlacklistPanel } from '@/app/components/blacklist/panels/CreateBlacklistPanel'
import type { BlacklistEntry, BlacklistFilters } from '@/app/lib/blacklist/types'
import { formatDate, highlightMatches, truncateText } from '@/app/lib/blacklist/blacklistUtils'
import { blacklistApi } from '@/app/lib/blacklist/blacklistApi'

type SeverityFilter = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'all'
type StatusFilter = 'ACTIVE' | 'DELETED' | 'all'

export default function BlacklistPage() {
  const t = useTranslations('blacklist')
  const router = useRouter()
  const searchParams = useSearchParams()
  const panel = searchParams.get('panel')

  const [entries, setEntries] = useState<BlacklistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE')
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_entries: 0,
    per_page: 50,
    has_next: false,
    has_prev: false,
  })

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true)
      const filters: BlacklistFilters = {
        page: 1,
        limit: 50,
        q: searchTerm || undefined,
        severity: severityFilter !== 'all' ? severityFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }
      const response = await blacklistApi.getAll(filters)
      setEntries(response.entries)
      setPagination(response.pagination)
    } catch (error) {
      console.error('Error loading blacklist entries:', error)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, severityFilter, statusFilter])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const handleCreateEntry = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('panel', 'create-blacklist')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleClosePanel = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('panel')
    router.push(`?${params.toString()}`, { scroll: false })
    loadEntries()
  }

  const handleViewEntry = (id: string) => {
    router.push(`/dashboard/blacklist/${id}`)
  }

  // Stats calculations
  const _totalEntries = entries.length
  const criticalCount = entries.filter((e) => e.severity === 'CRITICAL').length
  const highCount = entries.filter((e) => e.severity === 'HIGH').length
  const activeCount = entries.filter((e) => e.status === 'ACTIVE').length

  const getSeverityConfig = (severity: BlacklistEntry['severity']) => {
    const configs = {
      LOW: {
        color:
          'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
        label: t('severity.low'),
      },
      MEDIUM: {
        color:
          'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        label: t('severity.medium'),
      },
      HIGH: {
        color:
          'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
        label: t('severity.high'),
      },
      CRITICAL: {
        color:
          'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        label: t('severity.critical'),
      },
    }
    return configs[severity]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#010409] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-solid border-blue-600 dark:border-blue-500 border-r-transparent"></div>
          <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">{t('page.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-white dark:bg-[#010409] p-4 md:p-6">
        <div className="max-w-[1400px] space-y-5">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {t('page.title')}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {t('page.subtitle')}
                </p>
              </div>
              <button
                onClick={handleCreateEntry}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 dark:bg-green-700 text-white text-xs font-medium rounded-md hover:bg-green-700 dark:hover:bg-green-800 transition-colors"
              >
                <FiPlus className="w-3.5 h-3.5" />
                {t('page.newEntry')}
              </button>
            </div>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 min-[1400px]:grid-cols-4 gap-5">
            {/* Left Column - Main Content */}
            <div className="min-[1400px]:col-span-3 space-y-4">
              {/* Stats - Mobile/Tablet (hidden on >= 1400px) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 min-[1400px]:hidden">
                <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {t('stats.totalEntries')}
                      </p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                        {pagination.total_entries}
                      </p>
                    </div>
                    <FiShield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 dark:text-blue-400" />
                  </div>
                </div>

                <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {t('stats.critical')}
                      </p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                        {criticalCount}
                      </p>
                    </div>
                    <FiAlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 dark:text-red-400" />
                  </div>
                </div>

                <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {t('stats.highRisk')}
                      </p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                        {highCount}
                      </p>
                    </div>
                    <FiAlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 dark:text-orange-400" />
                  </div>
                </div>

                <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {t('stats.active')}
                      </p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                        {activeCount}
                      </p>
                    </div>
                    <FiCheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 dark:text-green-400" />
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="mb-4 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder={t('filters.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 dark:bg-[#151b23] dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
                  className="w-full sm:w-auto sm:min-w-[140px] px-3 py-1.5 pr-8 text-xs border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent bg-white dark:bg-[#151b23] dark:text-gray-200"
                >
                  <option value="all">{t('filters.severity')}</option>
                  <option value="CRITICAL">{t('severity.critical')}</option>
                  <option value="HIGH">{t('severity.high')}</option>
                  <option value="MEDIUM">{t('severity.medium')}</option>
                  <option value="LOW">{t('severity.low')}</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="w-full sm:w-auto sm:min-w-[120px] px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent bg-white dark:bg-[#151b23] dark:text-gray-200"
                >
                  <option value="ACTIVE">{t('filters.active')}</option>
                  <option value="DELETED">{t('filters.deleted')}</option>
                  <option value="all">{t('filters.allStatuses')}</option>
                </select>
              </div>

              {/* Table - Desktop */}
              <div className="hidden md:block bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-[#0d1117] border-b border-gray-200 dark:border-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          {t('table.guest')}
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          {t('table.document')}
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          {t('table.dates')}
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          {t('table.severity')}
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          {t('table.status')}
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          {t('table.registeredBy')}
                        </th>
                        <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          {t('table.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {entries.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400"
                          >
                            {searchTerm ? t('table.noResultsSearch') : t('table.noEntries')}
                          </td>
                        </tr>
                      ) : (
                        entries.map((entry) => {
                          const severityConfig = getSeverityConfig(entry.severity)
                          return (
                            <tr
                              key={entry.id}
                              onClick={() => handleViewEntry(entry.id)}
                              className="hover:bg-gray-50 dark:hover:bg-[#0d1117] transition-colors cursor-pointer"
                            >
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  {entry.severity === 'CRITICAL' && (
                                    <IoWarning className="text-red-500 flex-shrink-0" size={14} />
                                  )}
                                  <div>
                                    <div
                                      className="text-xs font-medium text-gray-900 dark:text-gray-100"
                                      dangerouslySetInnerHTML={{
                                        __html: searchTerm
                                          ? highlightMatches(entry.guest_name, searchTerm)
                                          : entry.guest_name,
                                      }}
                                    />
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                      {truncateText(entry.reason, 40)}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div>
                                  <div
                                    className="text-xs text-gray-900 dark:text-gray-100 font-mono"
                                    dangerouslySetInnerHTML={{
                                      __html: searchTerm
                                        ? highlightMatches(entry.document_number, searchTerm)
                                        : entry.document_number,
                                    }}
                                  />
                                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    {entry.document_type}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                <div className="text-xs">{formatDate(entry.check_in_date)}</div>
                                <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                  → {formatDate(entry.check_out_date)}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${severityConfig.color}`}
                                >
                                  {severityConfig.label}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <Badge
                                  variant={entry.status === 'ACTIVE' ? 'success' : 'default'}
                                  size="sm"
                                >
                                  {entry.status === 'ACTIVE'
                                    ? t('status.active')
                                    : t('status.deleted')}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                                <div className="text-xs">
                                  {entry.created_by_username || t('detail.unknown')}
                                </div>
                                <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                  {formatDate(entry.created_at)}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewEntry(entry.id)
                                  }}
                                  className="inline-flex items-center justify-center w-7 h-7 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                                >
                                  <FiEye className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cards - Mobile */}
              <div className="md:hidden space-y-2">
                {entries.length === 0 ? (
                  <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-6 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {searchTerm ? t('table.noResultsSearch') : t('table.noEntries')}
                    </p>
                  </div>
                ) : (
                  entries.map((entry) => {
                    const severityConfig = getSeverityConfig(entry.severity)
                    return (
                      <div
                        key={entry.id}
                        onClick={() => handleViewEntry(entry.id)}
                        className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {entry.severity === 'CRITICAL' && (
                                <IoWarning className="text-red-500 flex-shrink-0" size={14} />
                              )}
                              <h3
                                className="font-semibold text-xs text-gray-900 dark:text-gray-100 truncate"
                                dangerouslySetInnerHTML={{
                                  __html: searchTerm
                                    ? highlightMatches(entry.guest_name, searchTerm)
                                    : entry.guest_name,
                                }}
                              />
                            </div>
                            <p
                              className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5 font-mono"
                              dangerouslySetInnerHTML={{
                                __html: searchTerm
                                  ? highlightMatches(entry.document_number, searchTerm)
                                  : entry.document_number,
                              }}
                            />
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewEntry(entry.id)
                            }}
                            className="ml-2 flex-shrink-0 inline-flex items-center justify-center w-6 h-6 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-[10px] text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">
                          {entry.reason}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${severityConfig.color}`}
                            >
                              {severityConfig.label}
                            </span>
                            <Badge
                              variant={entry.status === 'ACTIVE' ? 'success' : 'default'}
                              size="sm"
                            >
                              {entry.status === 'ACTIVE' ? t('status.active') : t('status.deleted')}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            {formatDate(entry.created_at)}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
            {/* End Main Content */}

            {/* Right Column - Stats Sidebar (visible on >= 1400px) */}
            <div className="hidden min-[1400px]:block space-y-4">
              <div className="sticky top-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {t('stats.summary')}
                </h3>

                <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {t('stats.totalEntries')}
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                        {pagination.total_entries}
                      </p>
                    </div>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <FiShield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {t('stats.critical')}
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                        {criticalCount}
                      </p>
                    </div>
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                      <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {t('stats.highRisk')}
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                        {highCount}
                      </p>
                    </div>
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                      <FiAlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {t('stats.active')}
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                        {activeCount}
                      </p>
                    </div>
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CreateBlacklistPanel */}
      <CreateBlacklistPanel isOpen={panel === 'create-blacklist'} onClose={handleClosePanel} />
    </>
  )
}

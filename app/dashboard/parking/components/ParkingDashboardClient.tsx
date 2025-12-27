// app/dashboard/parking/components/ParkingDashboardClient.tsx

'use client'

import React, { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FaCar } from 'react-icons/fa'
import {
  FiCalendar,
  FiTrendingUp,
  FiFileText,
  FiAlertCircle,
  FiMapPin,
  FiLogIn,
  FiLogOut,
  FiGrid,
  FiZap,
  FiArrowDown,
  FiArrowUp,
  FiActivity,
  FiRefreshCw,
  FiSearch,
} from 'react-icons/fi'
import Link from 'next/link'
import {
  formatMadridDateLong,
  getCurrentWeekRange,
  getCurrentMonthRange,
} from '@/app/lib/helpers/date'
import { VehicleSearchModal } from '@/app/components/parking/VehicleSearchModal'
import { parkingApi, type FullStatsResponse } from '@/app/lib/parking'
import type { ParkingStats, ParkingDashboardResponse } from '../actions/getParkingDashboardStats'
import { useTranslations } from 'next-intl'

// Query keys
const dashboardKeys = {
  stats: (period: string, range?: { start: string; end: string }) =>
    ['parking', 'dashboard', period, range] as const,
}

interface ParkingDashboardClientProps {
  initialStats?: ParkingStats
  initialOccupancy?: ParkingDashboardResponse['dashboard']['occupancy']
}

export default function ParkingDashboardClient({
  initialStats,
  initialOccupancy: _initialOccupancy,
}: ParkingDashboardClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [showVehicleSearch, setShowVehicleSearch] = useState(false)
  const t = useTranslations('parking')

  // Calcular rango de fechas según período
  const getDateRange = useCallback(() => {
    if (selectedPeriod === 'week') {
      return getCurrentWeekRange()
    }
    if (selectedPeriod === 'month') {
      return getCurrentMonthRange()
    }
    return undefined
  }, [selectedPeriod])

  const dateRange = getDateRange()

  // Query con React Query
  const {
    data: dashboardData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: dashboardKeys.stats(selectedPeriod, dateRange),
    queryFn: async () => {
      if (selectedPeriod === 'today') {
        return parkingApi.getFullStats()
      } else if (dateRange) {
        return parkingApi.getStatsByRange(dateRange.start, dateRange.end)
      }
      return parkingApi.getFullStats()
    },
    initialData:
      selectedPeriod === 'today' && initialStats
        ? ({
            success: true,
            period: { type: 'today' },
            dashboard: {
              stats: initialStats,
              occupancy: {
                levels: [],
                summary: {
                  level: '',
                  total_spots: 0,
                  occupied_spots: 0,
                  available_spots: 0,
                  occupancy_rate: 0,
                },
              },
              pending_checkins: null,
              pending_checkouts: null,
              availability: null,
            },
          } as FullStatsResponse)
        : undefined,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const stats: ParkingStats = dashboardData?.dashboard?.stats || {
    total_spots: 0,
    occupied_spots: 0,
    available_spots: 0,
    total_bookings: 0,
    pending_checkins: 0,
    pending_checkouts: 0,
    active_bookings: 0,
    completed_today: 0,
    canceled_today: 0,
    no_shows_today: 0,
    occupancy_rate: 0,
  }

  const loading = isLoading && !initialStats

  /**
   * Get human-readable label for current period
   */
  const getPeriodLabel = () => {
    if (selectedPeriod === 'today') {
      return formatMadridDateLong(new Date())
    }

    if (selectedPeriod === 'week') {
      const { start, end } = getCurrentWeekRange()
      const startParts = start.split('-')
      const endParts = end.split('-')
      const startFormatted = `${startParts[2]}/${startParts[1]}/${startParts[0].slice(2)}`
      const endFormatted = `${endParts[2]}/${endParts[1]}/${endParts[0].slice(2)}`
      return `${startFormatted} - ${endFormatted}`
    }

    if (selectedPeriod === 'month') {
      const { start, end } = getCurrentMonthRange()
      const startParts = start.split('-')
      const endParts = end.split('-')
      const startFormatted = `${startParts[2]}/${startParts[1]}/${startParts[0].slice(2)}`
      const endFormatted = `${endParts[2]}/${endParts[1]}/${endParts[0].slice(2)}`
      return `${startFormatted} - ${endFormatted}`
    }

    return 'Unknown period'
  }

  // Calculate totals
  const arrivalsTotal = stats.pending_checkins + stats.active_bookings
  const departuresTotal = stats.pending_checkouts + stats.completed_today

  const _formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#010409] px-4 md:px-5 lg:px-6 pt-4 md:-mt-2 md:pt-0 pb-4">
        <div className="max-w-[1600px] space-y-5">
          {/* Skeleton Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 bg-gray-200 dark:bg-[#21262d] rounded-lg animate-pulse"></div>
                <div className="h-6 w-40 bg-gray-200 dark:bg-[#21262d] rounded animate-pulse"></div>
              </div>
              <div className="h-8 w-36 bg-gray-200 dark:bg-[#21262d] rounded-lg animate-pulse"></div>
            </div>
            <div className="h-3 w-48 bg-gray-200 dark:bg-[#21262d] rounded animate-pulse mt-2 sm:hidden"></div>
          </div>

          {/* Skeleton Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="space-y-5">
              <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl p-5 h-64 animate-pulse"></div>
              <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl p-5 h-48 animate-pulse"></div>
            </div>
            <div className="space-y-5">
              <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl p-5 h-48 animate-pulse"></div>
              <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl p-5 h-48 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#010409] px-4 md:px-5 lg:px-6 pt-4 md:-mt-2 md:pt-0 pb-4">
      <div className="max-w-[1600px] space-y-5">
        {/* Header */}
        <div className="mb-4">
          {/* Row: Title + Buttons (always same line) */}
          <div className="flex items-center justify-between gap-3">
            {/* Left: Icon + Title + Date (date only on desktop) */}
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg shadow-purple-500/20">
                <FaCar className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#24292f] to-[#57606a] dark:from-[#f0f6fc] dark:to-[#c9d1d9] bg-clip-text text-transparent">
                {t('title')}
              </h1>
              <span className="text-xs text-[#57606a] dark:text-[#8b949e] font-medium hidden sm:inline">
                {selectedPeriod === 'today' ? `${t('periods.today')}, ` : ''}
                {getPeriodLabel()}
              </span>
            </div>

            {/* Right: Period Selector */}
            <div className="flex items-center gap-0.5 bg-white dark:bg-[#161b22] p-1 rounded-lg border border-[#d0d7de] dark:border-[#30363d] shadow-sm">
              {(['today', 'week', 'month'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 capitalize ${
                    selectedPeriod === period
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
                      : 'text-[#24292f] dark:text-[#c9d1d9] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'
                  }`}
                >
                  {period === 'today'
                    ? t('periods.today')
                    : period === 'week'
                      ? t('periods.week')
                      : t('periods.month')}
                </button>
              ))}
            </div>
          </div>

          {/* Date on mobile (below title row) */}
          <p className="text-xs text-[#57606a] dark:text-[#8b949e] font-medium mt-2 sm:hidden">
            {selectedPeriod === 'today' ? `${t('periods.today')}, ` : ''}
            {getPeriodLabel()}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2 shadow-sm">
            <FiAlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-300 font-medium">
              {error instanceof Error ? error.message : t('dashboard.errorLoading')}
            </p>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Left Column - Reservas + Control de Parking */}
          <div className="space-y-5">
            {/* Reservations Section */}
            <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <FiCalendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-sm font-bold text-[#24292f] dark:text-[#f0f6fc]">
                      {t('reservations.title')}
                    </h2>
                  </div>
                  <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="p-1.5 rounded-lg hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition-colors disabled:opacity-50"
                    title="Refresh"
                  >
                    <FiRefreshCw
                      className={`w-3.5 h-3.5 text-[#57606a] dark:text-[#8b949e] ${isFetching ? 'animate-spin' : ''}`}
                    />
                  </button>
                </div>
                <p className="text-[10px] text-[#57606a] dark:text-[#8b949e] leading-relaxed">
                  {t('reservations.description')}
                </p>
              </div>

              <div className="space-y-3">
                {/* Arrivals */}
                <div>
                  <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#d0d7de] dark:border-[#21262d]">
                    <div className="p-0.5 bg-green-100 dark:bg-green-900/20 rounded">
                      <FiArrowDown className="w-3 h-3 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xs font-bold text-[#24292f] dark:text-[#f0f6fc]">
                      {t('reservations.arrivals')}
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <StatLink
                      label={t('reservations.waiting')}
                      value={stats.pending_checkins}
                      loading={isFetching}
                      href="/dashboard/parking/bookings?filter=arrivals_pending"
                    />
                    <StatLink
                      label={t('reservations.inside')}
                      value={stats.active_bookings}
                      loading={isFetching}
                      href="/dashboard/parking/bookings?filter=arrivals_inside"
                    />
                    <StatLink
                      label={t('reservations.total')}
                      value={arrivalsTotal}
                      loading={isFetching}
                      href="/dashboard/parking/bookings?filter=arrivals_total"
                    />
                  </div>
                </div>

                {/* Departures */}
                <div>
                  <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#d0d7de] dark:border-[#21262d]">
                    <div className="p-0.5 bg-red-100 dark:bg-red-900/20 rounded">
                      <FiArrowUp className="w-3 h-3 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-xs font-bold text-[#24292f] dark:text-[#f0f6fc]">
                      {t('reservations.departures')}
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <StatLink
                      label={t('reservations.waiting')}
                      value={stats.pending_checkouts}
                      loading={isFetching}
                      href="/dashboard/parking/bookings?filter=departures_pending"
                    />
                    <StatLink
                      label={t('reservations.completed')}
                      value={stats.completed_today}
                      loading={isFetching}
                      href="/dashboard/parking/bookings?filter=departures_completed"
                    />
                    <StatLink
                      label={t('reservations.total')}
                      value={departuresTotal}
                      loading={isFetching}
                      href="/dashboard/parking/bookings?filter=departures_total"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas - Mobile only (after Reservas) */}
            <div className="xl:hidden bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <FiZap className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-sm font-bold text-[#24292f] dark:text-[#f0f6fc]">
                  {t('quickActions.title')}
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <QuickActionCard
                  label={t('quickActions.newBooking')}
                  icon={FiCalendar}
                  href="/dashboard/parking/bookings/new"
                  color="blue"
                />
                <QuickActionCard
                  label={t('quickActions.allBookings')}
                  icon={FiGrid}
                  href="/dashboard/parking/bookings"
                  color="purple"
                />
                <QuickActionCard
                  label={t('quickActions.parkingControl')}
                  icon={FiMapPin}
                  href="/dashboard/parking/status"
                  color="green"
                />
                <QuickActionCard
                  label={t('quickActions.searchVehicle')}
                  icon={FiSearch}
                  onClick={() => setShowVehicleSearch(true)}
                  color="orange"
                />
                <QuickActionCard
                  label={t('quickActions.checkIns')}
                  icon={FiLogIn}
                  href="/dashboard/parking/bookings?status=reserved"
                  color="teal"
                />
                <QuickActionCard
                  label={t('quickActions.checkOuts')}
                  icon={FiLogOut}
                  href="/dashboard/parking/bookings?status=checked_in"
                  color="red"
                />
              </div>
            </div>

            {/* Control de Parking */}
            <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <FiActivity className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-base font-bold text-[#24292f] dark:text-[#f0f6fc]">
                  {t('control.title')}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Occupancy */}
                <Link
                  href="/dashboard/parking/status"
                  className="group p-4 bg-white dark:bg-[#161B22] border border-[#d0d7de] dark:border-[#21262d] rounded-xl hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-[10px] font-bold text-[#57606a] dark:text-[#8b949e] mb-1.5 uppercase tracking-wide">
                        {selectedPeriod === 'today'
                          ? t('control.currentOccupancy')
                          : selectedPeriod === 'week'
                            ? t('control.weeklyOccupancy')
                            : t('control.monthlyOccupancy')}
                      </div>
                      {isFetching ? (
                        <div className="h-7 w-24 bg-[#d0d7de] dark:bg-[#30363d] rounded-lg animate-pulse"></div>
                      ) : (
                        <div className="text-2xl font-bold text-[#24292f] dark:text-[#f0f6fc]">
                          {selectedPeriod === 'today' ? (
                            <>
                              {stats.occupied_spots}
                              <span className="text-base text-[#57606a] dark:text-[#8b949e] font-semibold">
                                /{stats.total_spots}
                              </span>
                            </>
                          ) : (
                            <>
                              {stats.total_bookings}
                              <span className="text-xs text-[#57606a] dark:text-[#8b949e] ml-1 font-medium">
                                total
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <FaCar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="text-[10px] text-[#57606a] dark:text-[#8b949e] font-medium">
                    {selectedPeriod === 'today'
                      ? t('control.spotsAvailable', { count: stats.available_spots })
                      : t('control.dailyAvg', {
                          count: Math.round(
                            stats.total_bookings / (selectedPeriod === 'week' ? 7 : 30)
                          ),
                        })}
                  </div>
                </Link>

                {/* Occupancy Rate */}
                <Link
                  href="/dashboard/parking/status"
                  className={`group p-4 bg-white dark:bg-[#161B22] border rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 ${
                    stats.occupancy_rate >= 100
                      ? 'border-green-500 animate-pulse-green'
                      : 'border-[#d0d7de] dark:border-[#21262d] hover:border-blue-500 dark:hover:border-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-[10px] font-bold text-[#57606a] dark:text-[#8b949e] mb-1.5 uppercase tracking-wide">
                        {selectedPeriod === 'today'
                          ? t('control.occupancyRate')
                          : selectedPeriod === 'week'
                            ? t('control.weeklyAvgRate')
                            : t('control.monthlyAvgRate')}
                      </div>
                      {isFetching ? (
                        <div className="h-7 w-16 bg-[#d0d7de] dark:bg-[#30363d] rounded-lg animate-pulse"></div>
                      ) : (
                        <div className="text-2xl font-bold text-[#24292f] dark:text-[#f0f6fc]">
                          {stats.occupancy_rate}%
                          {selectedPeriod !== 'today' && (
                            <span className="text-xs text-[#57606a] dark:text-[#8b949e] ml-1 font-medium">
                              {t('control.average')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <FiTrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="w-full h-2 bg-[#d0d7de] dark:bg-[#21262d] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-600 transition-all duration-500"
                      style={{ width: `${Math.min(stats.occupancy_rate, 100)}%` }}
                    ></div>
                  </div>
                  {selectedPeriod !== 'today' && (
                    <div className="text-[9px] text-[#57606a] dark:text-[#8b949e] mt-1.5 font-medium">
                      {t('control.maxCapacity', {
                        period:
                          selectedPeriod === 'week' ? t('control.weekly') : t('control.monthly'),
                        count: stats.total_spots * (selectedPeriod === 'week' ? 7 : 30),
                      })}
                    </div>
                  )}
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Acciones Rápidas (Desktop) + Resumen Diario */}
          <div className="space-y-5">
            {/* Acciones Rápidas - Desktop only */}
            <div className="hidden xl:block bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <FiZap className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-base font-bold text-[#24292f] dark:text-[#f0f6fc]">
                  {t('quickActions.title')}
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <QuickActionCard
                  label={t('quickActions.newBooking')}
                  icon={FiCalendar}
                  href="/dashboard/parking/bookings/new"
                  color="blue"
                />
                <QuickActionCard
                  label={t('quickActions.allBookings')}
                  icon={FiGrid}
                  href="/dashboard/parking/bookings"
                  color="purple"
                />
                <QuickActionCard
                  label={t('quickActions.parkingControl')}
                  icon={FiMapPin}
                  href="/dashboard/parking/status"
                  color="green"
                />
                <QuickActionCard
                  label={t('quickActions.searchVehicle')}
                  icon={FiSearch}
                  onClick={() => setShowVehicleSearch(true)}
                  color="orange"
                />
                <QuickActionCard
                  label={t('quickActions.checkIns')}
                  icon={FiLogIn}
                  href="/dashboard/parking/bookings?status=reserved"
                  color="teal"
                />
                <QuickActionCard
                  label={t('quickActions.checkOuts')}
                  icon={FiLogOut}
                  href="/dashboard/parking/bookings?status=checked_in"
                  color="red"
                />
              </div>
            </div>

            {/* Resumen del Período */}
            <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1 bg-gray-100 dark:bg-gray-900/20 rounded-lg">
                  <FiFileText className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                </div>
                <h2 className="text-base font-bold text-[#24292f] dark:text-[#f0f6fc]">
                  {selectedPeriod === 'today' ? t('summary.title') : t('summary.periodTitle')}
                </h2>
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
                <SummaryCard
                  label={t('summary.completed')}
                  value={stats.completed_today}
                  loading={isFetching}
                  icon="✓"
                  color="green"
                />
                <SummaryCard
                  label={t('summary.canceled')}
                  value={stats.canceled_today}
                  loading={isFetching}
                  icon="✕"
                  color="red"
                />
                <SummaryCard
                  label={t('summary.noShows')}
                  value={stats.no_shows_today}
                  loading={isFetching}
                  icon="?"
                  color="yellow"
                />
                <SummaryCard
                  label={t('summary.totalBookings')}
                  value={stats.total_bookings}
                  loading={isFetching}
                  icon="#"
                  color="blue"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ayuda Contextual - Full width at bottom */}
        <div className="bg-gradient-to-br from-[#ddf4ff] to-[#b6e3ff] dark:from-[#051d30] dark:to-[#0a2540] border border-[#9cd7ff] dark:border-[#1f6feb] rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-2 mb-3">
            <div className="p-1.5 bg-blue-600 dark:bg-blue-500 rounded-lg shadow-lg">
              <FiAlertCircle className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-sm font-bold text-[#24292f] dark:text-[#f0f6fc]">
              {t('help.title')}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 text-xs text-[#24292f] dark:text-[#c9d1d9] leading-relaxed">
            <div className="space-y-1.5 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="font-bold text-blue-600 dark:text-blue-400 text-[11px]">
                📊 {t('help.reservations.title')}
              </div>
              <p>{t('help.reservations.description')}</p>
            </div>

            <div className="space-y-1.5 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="font-bold text-green-600 dark:text-green-400 text-[11px]">
                📥 {t('help.arrivalsWaiting.title')}
              </div>
              <p>{t('help.arrivalsWaiting.description')}</p>
            </div>

            <div className="space-y-1.5 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="font-bold text-green-600 dark:text-green-400 text-[11px]">
                ✅ {t('help.arrivalsInside.title')}
              </div>
              <p>{t('help.arrivalsInside.description')}</p>
            </div>

            <div className="space-y-1.5 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="font-bold text-red-600 dark:text-red-400 text-[11px]">
                📤 {t('help.departuresWaiting.title')}
              </div>
              <p>{t('help.departuresWaiting.description')}</p>
            </div>

            <div className="space-y-1.5 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <div className="font-bold text-purple-600 dark:text-purple-400 text-[11px]">
                🚗 {t('help.parkingControl.title')}
              </div>
              <p>{t('help.parkingControl.description')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Search Modal */}
      <VehicleSearchModal isOpen={showVehicleSearch} onClose={() => setShowVehicleSearch(false)} />
    </div>
  )
}

// ============================================
// HELPER COMPONENTS
// ============================================

function StatLink({
  label,
  value,
  loading,
  href,
}: {
  label: string
  value: number
  loading: boolean
  href: string
}) {
  return (
    <Link
      href={href}
      className="group text-center py-2 px-2 rounded-lg hover:bg-[#f6f8fa] dark:hover:bg-[#0d1117] border border-transparent hover:border-[#d0d7de] dark:hover:border-[#30363d] transition-all duration-200"
    >
      {loading ? (
        <div className="h-6 bg-[#d0d7de] dark:bg-[#30363d] rounded-lg animate-pulse mb-1"></div>
      ) : (
        <div className="text-xl font-bold text-[#24292f] dark:text-[#f0f6fc] mb-0.5">{value}</div>
      )}
      <div className="text-[9px] font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wide">
        {label}
      </div>
    </Link>
  )
}

function QuickActionCard({
  label,
  icon: Icon,
  href,
  color,
  onClick,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  color: string
  onClick?: () => void
}) {
  const colorConfig = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      border: 'hover:border-blue-400 dark:hover:border-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      border: 'hover:border-purple-400 dark:hover:border-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    green: {
      gradient: 'from-green-500 to-green-600',
      border: 'hover:border-green-400 dark:hover:border-green-500',
      bg: 'bg-green-50 dark:bg-green-950/30',
      iconBg: 'bg-green-100 dark:bg-green-900/40',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    orange: {
      gradient: 'from-orange-500 to-orange-600',
      border: 'hover:border-orange-400 dark:hover:border-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      iconBg: 'bg-orange-100 dark:bg-orange-900/40',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    teal: {
      gradient: 'from-teal-500 to-teal-600',
      border: 'hover:border-teal-400 dark:hover:border-teal-500',
      bg: 'bg-teal-50 dark:bg-teal-950/30',
      iconBg: 'bg-teal-100 dark:bg-teal-900/40',
      iconColor: 'text-teal-600 dark:text-teal-400',
    },
    red: {
      gradient: 'from-red-500 to-red-600',
      border: 'hover:border-red-400 dark:hover:border-red-500',
      bg: 'bg-red-50 dark:bg-red-950/30',
      iconBg: 'bg-red-100 dark:bg-red-900/40',
      iconColor: 'text-red-600 dark:text-red-400',
    },
  }

  const config = colorConfig[color as keyof typeof colorConfig]

  const className = `group flex flex-col items-center justify-center gap-2 p-3 min-h-[80px] bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#21262d] rounded-xl ${config.border} hover:shadow-md transition-all duration-200`

  const content = (
    <>
      <div
        className={`flex-shrink-0 p-2 ${config.iconBg} rounded-lg group-hover:scale-105 transition-transform duration-200`}
      >
        <Icon className={`w-4 h-4 ${config.iconColor}`} />
      </div>
      <span className="text-[11px] font-semibold text-[#24292f] dark:text-[#c9d1d9] text-center leading-tight">
        {label}
      </span>
    </>
  )

  if (onClick) {
    return (
      <button onClick={onClick} className={className}>
        {content}
      </button>
    )
  }

  return (
    <Link href={href || '#'} className={className}>
      {content}
    </Link>
  )
}

function SummaryCard({
  label,
  value,
  loading,
  icon,
  color,
}: {
  label: string
  value: number
  loading: boolean
  icon: string
  color: string
}) {
  const colorConfig = {
    green: {
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    red: {
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    yellow: {
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    blue: {
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  }

  const config = colorConfig[color as keyof typeof colorConfig]

  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#21262d] rounded-xl hover:shadow-md transition-shadow duration-200">
      <div
        className={`flex-shrink-0 w-10 h-10 ${config.iconBg} rounded-xl flex items-center justify-center`}
      >
        <span className={`text-base font-bold ${config.iconColor}`}>{icon}</span>
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wide mb-0.5">
          {label}
        </div>
        {loading ? (
          <div className="h-5 w-8 bg-[#d0d7de] dark:bg-[#30363d] rounded animate-pulse"></div>
        ) : (
          <div className="text-lg font-bold text-[#24292f] dark:text-[#f0f6fc]">{value}</div>
        )}
      </div>
    </div>
  )
}

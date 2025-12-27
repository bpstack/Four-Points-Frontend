// app/dashboard/maintenance/page.tsx

import { getTranslations } from 'next-intl/server'
import { getMaintenance } from './actions'
import { MaintenanceListClient } from '@/app/components/maintenance/MaintenanceListClient'
import type { ReportFilters } from '@/app/lib/maintenance/maintenance'

interface PageProps {
  searchParams: Promise<{
    status?: string
    priority?: string
    location_type?: string
    search?: string
    page?: string
  }>
}

export default async function MaintenancePage({ searchParams }: PageProps) {
  const params = await searchParams
  const t = await getTranslations('maintenance')

  // Construir filtros desde URL
  const filters = {
    status: params.status as ReportFilters['status'],
    priority: params.priority as ReportFilters['priority'],
    location_type: params.location_type as ReportFilters['location_type'],
    search: params.search,
    page: params.page ? parseInt(params.page) : 1,
    limit: 20,
  }

  let data
  let error: string | null = null

  try {
    data = await getMaintenance(filters)
  } catch (err) {
    const message = err instanceof Error ? err.message : t('error.unknown')
    console.error('[MaintenancePage] Error:', message)
    error = message
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#010409] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('error.title')}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <MaintenanceListClient
      initialReports={data?.reports || []}
      initialPagination={data?.pagination}
    />
  )
}

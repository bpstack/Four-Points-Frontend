// app/dashboard/maintenance/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { maintenanceApi } from '@/app/lib/maintenance/maintenanceApi'
import { ReportDetailClient } from '@/app/components/maintenance/ReportDetailClient'
import { LoadingSpinner } from '@/app/components/maintenance/shared/LoadingSpinner'
import type { ReportWithDetails } from '@/app/lib/maintenance/maintenance'

export default function MaintenanceDetailPage() {
  const t = useTranslations('maintenance')
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string
  const [report, setReport] = useState<ReportWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true)
        const response = await maintenanceApi.getById(reportId)
        setReport(response.report)
      } catch (err) {
        console.error('Error loading report:', err)
        const message = err instanceof Error ? err.message : t('error.loadingReport')
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadReport()
  }, [reportId, t])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#010409] flex items-center justify-center">
        <LoadingSpinner size="lg" message={t('loadingReport')} />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#010409] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('error.title')}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{error || t('reportNotFound')}</p>
          <button
            onClick={() => router.push('/dashboard/maintenance')}
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            {t('backToList')}
          </button>
        </div>
      </div>
    )
  }

  return <ReportDetailClient initialReport={report} />
}

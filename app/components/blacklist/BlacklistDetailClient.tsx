// app/components/blacklist/BlacklistDetailClient.tsx

'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { IoChevronBack, IoCreateOutline } from 'react-icons/io5'
import { Card } from '@/app/components/blacklist/ui/Card'
import { Button } from '@/app/components/blacklist/ui/Button'
import { Badge } from '@/app/components/blacklist/ui/Badge'
import { ImageGallery } from '@/app/components/blacklist/mains/ImageGallery'
import { AuditTrail } from '@/app/components/blacklist/mains/AuditTrail'
import { BlacklistDetailSummaryPanel } from '@/app/components/blacklist/layout/BlacklistDetailSummaryPanel'
import { EditBlacklistPanel } from '@/app/components/blacklist/panels/EditBlacklistPanel'
import { DeleteButton } from '@/app/components/blacklist/mains/DeleteButton'
import {
  DOCUMENT_TYPES,
  SEVERITY_LEVELS,
  BlacklistEntry,
  AuditEntry,
} from '@/app/lib/blacklist/types'
import { formatDate, formatDateTime, calculateStayDays } from '@/app/lib/blacklist/blacklistUtils'
import {
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoWarningOutline,
  IoPersonOutline,
} from 'react-icons/io5'
import { FiAlertTriangle, FiLogIn, FiLogOut, FiClock } from 'react-icons/fi'

interface BlacklistDetailClientProps {
  entry: BlacklistEntry
  audit_trail: AuditEntry[]
}

export function BlacklistDetailClient({
  entry: initialEntry,
  audit_trail,
}: BlacklistDetailClientProps) {
  const t = useTranslations('blacklist')
  const router = useRouter()
  const searchParams = useSearchParams()
  const panel = searchParams.get('panel')

  const [entry] = useState(initialEntry)
  const stayDays = calculateStayDays(entry.check_in_date, entry.check_out_date)

  const handleOpenEditPanel = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('panel', 'edit-blacklist')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleClosePanel = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('panel')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleEditSuccess = () => {
    // Refresh the page to get updated data
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#010409]">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#010409]">
        <div className="max-w-[1400px] px-4 md:px-6 py-4">
          <Link
            href="/dashboard/blacklist"
            className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
          >
            <IoChevronBack size={14} />
            {t('detail.backToList')}
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {entry.guest_name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <Badge
                  variant={
                    entry.severity === 'CRITICAL'
                      ? 'danger'
                      : entry.severity === 'HIGH'
                        ? 'warning'
                        : entry.severity === 'MEDIUM'
                          ? 'info'
                          : 'default'
                  }
                >
                  {SEVERITY_LEVELS[entry.severity]}
                </Badge>
                <Badge variant={entry.status === 'ACTIVE' ? 'success' : 'default'}>
                  {entry.status === 'ACTIVE' ? t('status.active') : t('status.deleted')}
                </Badge>
              </div>
            </div>

            {entry.status === 'ACTIVE' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  leftIcon={<IoCreateOutline size={16} />}
                  onClick={handleOpenEditPanel}
                >
                  {t('detail.edit')}
                </Button>
                <DeleteButton entryId={entry.id} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] px-4 md:px-6 py-6">
        {/* Stats - Mobile/Tablet (hidden on >= 1400px) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6 min-[1400px]:hidden">
          <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {t('detail.severityLevel')}
                </p>
                <p
                  className={`text-sm sm:text-base font-bold mt-0.5 ${
                    entry.severity === 'CRITICAL'
                      ? 'text-red-600 dark:text-red-400'
                      : entry.severity === 'HIGH'
                        ? 'text-orange-600 dark:text-orange-400'
                        : entry.severity === 'MEDIUM'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {SEVERITY_LEVELS[entry.severity]}
                </p>
              </div>
              <FiAlertTriangle
                className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  entry.severity === 'CRITICAL'
                    ? 'text-red-500'
                    : entry.severity === 'HIGH'
                      ? 'text-orange-500'
                      : entry.severity === 'MEDIUM'
                        ? 'text-blue-500'
                        : 'text-gray-500'
                }`}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {t('detail.entry')}
                </p>
                <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                  {formatDate(entry.check_in_date)}
                </p>
              </div>
              <FiLogIn className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {t('detail.exit')}
                </p>
                <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                  {formatDate(entry.check_out_date)}
                </p>
              </div>
              <FiLogOut className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 dark:text-orange-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {t('detail.stay')}
                </p>
                <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                  {stayDays} {stayDays === 1 ? t('detail.day') : t('detail.days')}
                </p>
              </div>
              <FiClock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 min-[1400px]:grid-cols-4 gap-6">
          {/* Left Column - Main Content */}
          <div className="min-[1400px]:col-span-3 space-y-5">
            {/* Documento */}
            <Card className="bg-gray-50 dark:bg-[#0D1117] border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <IoDocumentTextOutline size={18} />
                {t('detail.documentInfo')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {t('detail.documentType')}
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {DOCUMENT_TYPES[entry.document_type]}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {t('detail.documentNumber')}
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono">
                    {entry.document_number}
                  </div>
                </div>
              </div>
            </Card>

            {/* Fechas - Only visible on mobile/tablet */}
            <Card className="dark:bg-[#0D1117] border-gray-200 dark:border-gray-800 min-[1400px]:hidden">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <IoCalendarOutline size={18} />
                {t('detail.stayDates')}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {t('detail.entry')}
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(entry.check_in_date)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {t('detail.exit')}
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(entry.check_out_date)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {t('detail.stay')}
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {stayDays} {stayDays === 1 ? t('detail.day') : t('detail.days')}
                  </div>
                </div>
              </div>
            </Card>

            {/* Motivo */}
            <Card className="dark:bg-[#0D1117] border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <IoWarningOutline size={18} />
                {t('detail.incidentReason')}
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {entry.reason}
              </p>
            </Card>

            {/* Comentarios */}
            <Card className="dark:bg-[#0D1117] border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {t('detail.additionalComments')}
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {entry.comments}
              </p>
            </Card>

            {/* Imagenes */}
            <Card className="dark:bg-[#0D1117] border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {t('detail.photoEvidence')} ({entry.images.length})
              </h3>
              <ImageGallery images={entry.images} alt={`Evidencia de ${entry.guest_name}`} />
            </Card>

            {/* Informacion - Only visible on mobile/tablet */}
            <Card className="dark:bg-[#0D1117] border-gray-200 dark:border-gray-800 min-[1400px]:hidden">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <IoPersonOutline size={18} />
                {t('detail.recordInfo')}
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {t('detail.registeredBy')}
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {entry.created_by_username || t('detail.unknown')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {t('detail.registrationDate')}
                  </div>
                  <div className="text-xs text-gray-900 dark:text-gray-100">
                    {formatDateTime(entry.created_at)}
                  </div>
                </div>
                {entry.updated_at && (
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {t('detail.lastModification')}
                    </div>
                    <div className="text-xs text-gray-900 dark:text-gray-100">
                      {formatDateTime(entry.updated_at)}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Historial */}
            <Card className="dark:bg-[#0D1117] border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {t('detail.changeHistory')}
              </h3>
              <AuditTrail entries={audit_trail} />
            </Card>
          </div>

          {/* Right Column - Summary Panel (visible on >= 1400px) */}
          <div className="hidden min-[1400px]:block">
            <BlacklistDetailSummaryPanel entry={entry} />
          </div>
        </div>
      </div>

      {/* Edit Panel */}
      <EditBlacklistPanel
        isOpen={panel === 'edit-blacklist'}
        onClose={handleClosePanel}
        entry={entry}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}

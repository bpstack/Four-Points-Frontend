// app/components/maintenance/tabs/DetailTab.tsx
'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useMaintenanceStore } from '@/app/stores/useMaintenanceStore'
import { maintenanceApi } from '@/app/lib/maintenance/maintenanceApi'
import type { ReportStatus, ReportPriority } from '@/app/lib/maintenance/maintenance'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { EmptyState } from '../shared/EmptyState'
import {
  FiFileText,
  FiMapPin,
  FiAlertCircle,
  FiUser,
  FiClock,
  FiImage,
  FiEdit2,
  FiCheck,
  FiX,
  FiMaximize2,
} from 'react-icons/fi'
import toast from 'react-hot-toast'

export function DetailTab() {
  const t = useTranslations('maintenance')
  const locale = useLocale()
  const { currentReport, images, isLoadingReport, refreshReport } = useMaintenanceStore()
  const [isEditingStatus, setIsEditingStatus] = useState(false)
  const [isEditingPriority, setIsEditingPriority] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | null>(null)
  const [selectedPriority, setSelectedPriority] = useState<ReportPriority | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showNotesInput, setShowNotesInput] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  if (isLoadingReport) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" message={t('detail.loadingDetails')} />
      </div>
    )
  }

  if (!currentReport) {
    return (
      <EmptyState
        icon={<FiFileText className="w-12 h-12" />}
        title={t('detail.loadError')}
        description={t('detail.loadErrorDescription')}
      />
    )
  }

  const handleStatusChange = async () => {
    if (!selectedStatus) return

    try {
      setIsSaving(true)
      await maintenanceApi.updateStatus(currentReport.id, selectedStatus)
      await refreshReport(currentReport.id)
      setIsEditingStatus(false)
      setSelectedStatus(null)
      toast.success(t('detail.toast.statusUpdated'))
    } catch (error) {
      const message = error instanceof Error ? error.message : t('detail.toast.statusError')
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePriorityChange = async () => {
    if (!selectedPriority) return

    try {
      setIsSaving(true)
      await maintenanceApi.updatePriority(currentReport.id, selectedPriority)
      await refreshReport(currentReport.id)
      setIsEditingPriority(false)
      setSelectedPriority(null)
      toast.success(t('detail.toast.priorityUpdated'))
    } catch (error) {
      const message = error instanceof Error ? error.message : t('detail.toast.priorityError')
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!resolutionNotes.trim()) {
      toast.error(t('detail.resolutionNotes.emptyError'))
      return
    }

    try {
      setIsSaving(true)
      await maintenanceApi.addResolutionNotes(currentReport.id, resolutionNotes)
      await refreshReport(currentReport.id)
      setShowNotesInput(false)
      setResolutionNotes('')
      toast.success(t('detail.toast.notesSaved'))
    } catch (error) {
      const message = error instanceof Error ? error.message : t('detail.toast.notesError')
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusConfig = (status: typeof currentReport.status) => {
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

  const getPriorityConfig = (priority: typeof currentReport.priority) => {
    const configs = {
      low: { color: 'text-gray-600 dark:text-gray-400', label: t('priority.low') },
      medium: { color: 'text-blue-600 dark:text-blue-400', label: t('priority.medium') },
      high: { color: 'text-orange-600 dark:text-orange-400', label: t('priority.high') },
      urgent: { color: 'text-red-600 dark:text-red-400', label: t('priority.urgent') },
    }
    return configs[priority]
  }

  const getLocationTypeLabel = (type: typeof currentReport.location_type) => {
    const labels = {
      room: t('locationType.room'),
      common_area: t('locationType.commonArea'),
      exterior: t('locationType.exterior'),
      facilities: t('locationType.facilities'),
      other: t('locationType.other'),
    }
    return labels[type]
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const statusConfig = getStatusConfig(currentReport.status)
  const priorityConfig = getPriorityConfig(currentReport.priority)

  const statusOptions: { value: ReportStatus; label: string }[] = [
    { value: 'reported', label: t('status.reported') },
    { value: 'assigned', label: t('status.assigned') },
    { value: 'in_progress', label: t('status.inProgress') },
    { value: 'waiting', label: t('status.waiting') },
    { value: 'completed', label: t('status.completed') },
    { value: 'closed', label: t('status.closed') },
    { value: 'canceled', label: t('status.canceled') },
  ]

  const priorityOptions: { value: ReportPriority; label: string }[] = [
    { value: 'low', label: t('priority.low') },
    { value: 'medium', label: t('priority.medium') },
    { value: 'high', label: t('priority.high') },
    { value: 'urgent', label: t('priority.urgent') },
  ]

  return (
    <>
      {/* Desktop: 2 columns layout (info left 2/3, images right 1/3) */}
      {/* Mobile: single column vertical */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Priority */}
          <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between gap-4">
              {/* Estado */}
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {t('detail.sections.status')}
                </p>
                {isEditingStatus ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedStatus || currentReport.status}
                      onChange={(e) => setSelectedStatus(e.target.value as ReportStatus)}
                      disabled={isSaving}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleStatusChange}
                      disabled={isSaving}
                      className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded disabled:opacity-50"
                    >
                      <FiCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingStatus(false)
                        setSelectedStatus(null)
                      }}
                      disabled={isSaving}
                      className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>
                    <button
                      onClick={() => setIsEditingStatus(true)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Prioridad */}
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 text-right">
                  {t('detail.sections.priority')}
                </p>
                {isEditingPriority ? (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setIsEditingPriority(false)
                        setSelectedPriority(null)
                      }}
                      disabled={isSaving}
                      className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handlePriorityChange}
                      disabled={isSaving}
                      className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded disabled:opacity-50"
                    >
                      <FiCheck className="w-4 h-4" />
                    </button>
                    <select
                      value={selectedPriority || currentReport.priority}
                      onChange={(e) => setSelectedPriority(e.target.value as ReportPriority)}
                      disabled={isSaving}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {priorityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setIsEditingPriority(true)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    <span className={`text-sm font-semibold ${priorityConfig.color}`}>
                      {priorityConfig.label}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Info */}
          <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
              <FiFileText className="w-4 h-4" />
              {t('detail.sections.reportInfo')}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">
                  {t('detail.labels.title')}
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {currentReport.title}
                </p>
              </div>

              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">
                  {t('detail.labels.description')}
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 whitespace-pre-wrap">
                  {currentReport.description}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
              <FiMapPin className="w-4 h-4" />
              {t('detail.sections.location')}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">
                  {t('detail.labels.type')}
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {getLocationTypeLabel(currentReport.location_type)}
                </p>
              </div>

              {currentReport.room_number && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">
                    {t('detail.labels.room')}
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                    {currentReport.room_number}
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">
                  {t('detail.labels.description')}
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {currentReport.location_description}
                </p>
              </div>

              {currentReport.room_out_of_service && (
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                    <FiAlertCircle className="w-3.5 h-3.5" />
                    {t('detail.labels.roomOutOfService')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Assignment */}
          <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
              <FiUser className="w-4 h-4" />
              {t('detail.sections.assignment')}
            </h3>

            <div className="space-y-3">
              {currentReport.assigned_type === 'internal' && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">
                    {t('detail.labels.internalStaff')}
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                    {currentReport.assigned_to_name || t('detail.labels.assignedUser')}
                  </p>
                </div>
              )}

              {currentReport.assigned_type === 'external' && (
                <>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">
                      {t('detail.labels.externalCompany')}
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                      {currentReport.external_company_name || '-'}
                    </p>
                  </div>
                  {currentReport.external_contact && (
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">
                        {t('detail.labels.contact')}
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                        {currentReport.external_contact}
                      </p>
                    </div>
                  )}
                </>
              )}

              {!currentReport.assigned_type && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('detail.labels.notAssigned')}
                </p>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
              <FiClock className="w-4 h-4" />
              {t('detail.sections.dates')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">
                  {t('detail.labels.reported')}
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {formatDateTime(currentReport.report_date)}
                </p>
              </div>

              {currentReport.started_at && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">
                    {t('detail.labels.started')}
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                    {formatDateTime(currentReport.started_at)}
                  </p>
                </div>
              )}

              {currentReport.resolved_at && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">
                    {t('detail.labels.resolved')}
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                    {formatDateTime(currentReport.resolved_at)}
                  </p>
                </div>
              )}

              {currentReport.closed_at && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">
                    {t('detail.labels.closed')}
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                    {formatDateTime(currentReport.closed_at)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Resolution Notes */}
          <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {t('detail.sections.resolutionNotes')}
            </h3>
            {currentReport.resolution_notes ? (
              <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                {currentReport.resolution_notes}
              </p>
            ) : showNotesInput ? (
              <div className="space-y-2">
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder={t('detail.resolutionNotes.placeholder')}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSaving || !resolutionNotes.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiCheck className="w-3.5 h-3.5" />
                    {t('detail.resolutionNotes.save')}
                  </button>
                  <button
                    onClick={() => {
                      setShowNotesInput(false)
                      setResolutionNotes('')
                    }}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <FiX className="w-3.5 h-3.5" />
                    {t('detail.resolutionNotes.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNotesInput(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FiEdit2 className="w-3.5 h-3.5" />
                {t('detail.resolutionNotes.add')}
              </button>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {t('detail.sections.systemInfo')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-gray-500 dark:text-gray-400">
                  {t('detail.labels.createdBy')}
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">
                  {currentReport.created_by_name || currentReport.created_by}
                </p>
              </div>
              <div>
                <label className="text-gray-500 dark:text-gray-400">
                  {t('detail.labels.createdAt')}
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">
                  {formatDateTime(currentReport.created_at)}
                </p>
              </div>
              <div>
                <label className="text-gray-500 dark:text-gray-400">
                  {t('detail.labels.reportId')}
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1 font-mono text-[10px]">
                  {currentReport.id}
                </p>
              </div>
              <div>
                <label className="text-gray-500 dark:text-gray-400">
                  {t('detail.labels.lastUpdate')}
                </label>
                <p className="text-gray-900 dark:text-gray-100 mt-1">
                  {formatDateTime(currentReport.updated_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Only: Images Section */}
          {images.length > 0 && (
            <div className="lg:hidden bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                <FiImage className="w-4 h-4" />
                {t('detail.images.title', { count: images.length })}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="relative group cursor-pointer"
                    onClick={() => setExpandedImage(image.file_path)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.file_path}
                      alt={image.file_name}
                      className="w-full h-32 object-contain bg-gray-100 dark:bg-gray-900 rounded-md border border-gray-300 dark:border-gray-700"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-md flex items-center justify-center">
                      <FiMaximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Images (Desktop only) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            {images.length > 0 ? (
              <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                  <FiImage className="w-4 h-4" />
                  {t('detail.images.title', { count: images.length })}
                </h3>
                <div className="space-y-3">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="relative group cursor-pointer"
                      onClick={() => setExpandedImage(image.file_path)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.file_path}
                        alt={image.file_name}
                        className="w-full h-48 object-contain bg-gray-100 dark:bg-gray-900 rounded-md border border-gray-300 dark:border-gray-700"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-md flex items-center justify-center">
                        <FiMaximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                  <FiImage className="w-4 h-4" />
                  {t('detail.images.titleNoCount')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  {t('detail.images.noImages')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <button
            onClick={() => setExpandedImage(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={expandedImage}
            alt={t('detail.images.expanded')}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

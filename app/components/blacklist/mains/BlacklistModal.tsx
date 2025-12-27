// app/dashboard/blacklist/components/mains/BlacklistModal.tsx
// app/dashboard/blacklist/components/BlacklistModal.tsx
'use client'

/**
 * Modal de detalles de registro Blacklist
 * - Muestra toda la información completa
 * - Galería de imágenes con lightbox
 * - Historial de cambios (audit trail)
 * - Acciones: editar, eliminar, restaurar
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Modal } from '@/app/components/blacklist/ui/Modal'
import { Button } from '@/app/components/blacklist/ui/Button'
import { Badge } from '@/app/components/blacklist/ui/Badge'
import { ImageGallery } from './ImageGallery'
import { AuditTrail } from './AuditTrail'
import { deleteBlacklist, restoreBlacklist } from '@/app/dashboard/blacklist/actions'
import type { BlacklistEntry, AuditEntry } from '@/app/lib/blacklist/types'
import { DOCUMENT_TYPES, SEVERITY_LEVELS } from '@/app/lib/blacklist/types'
import { formatDate, formatDateTime, calculateStayDays } from '@/app/lib/blacklist/blacklistUtils'
import {
  IoCreateOutline,
  IoTrashOutline,
  IoRefreshOutline,
  IoPersonOutline,
  IoCalendarOutline,
  IoDocumentTextOutline,
  IoWarningOutline,
} from 'react-icons/io5'
import toast from 'react-hot-toast'

interface BlacklistModalProps {
  isOpen: boolean
  onClose: () => void
  entry: BlacklistEntry
  auditTrail: AuditEntry[]
}

export function BlacklistModal({ isOpen, onClose, entry, auditTrail }: BlacklistModalProps) {
  const router = useRouter()
  const t = useTranslations('blacklist')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'images' | 'history'>('details')

  // ========================================
  // EDITAR
  // ========================================
  const handleEdit = () => {
    router.push(`/dashboard/blacklist/${entry.id}/edit`)
    onClose()
  }

  // ========================================
  // ELIMINAR (SOFT DELETE)
  // ========================================
  const handleDelete = async () => {
    if (!confirm(t('delete.confirmMessage'))) {
      return
    }

    setIsDeleting(true)
    toast.loading(t('delete.deleting'))

    try {
      const result = await deleteBlacklist(entry.id)

      toast.dismiss()

      if (result.success) {
        toast.success(t('delete.success'))
        onClose()
        router.refresh()
      } else {
        toast.error(result.error || t('delete.error'))
      }
    } catch (error: unknown) {
      toast.dismiss()
      toast.error(error instanceof Error ? error.message : t('delete.genericError'))
    } finally {
      setIsDeleting(false)
    }
  }

  // ========================================
  // RESTAURAR
  // ========================================
  const handleRestore = async () => {
    if (!confirm(t('restore.confirm'))) {
      return
    }

    setIsRestoring(true)
    toast.loading(t('restore.restoring'))

    try {
      const result = await restoreBlacklist(entry.id)

      toast.dismiss()

      if (result.success) {
        toast.success(t('restore.success'))
        onClose()
        router.refresh()
      } else {
        toast.error(result.error || t('restore.error'))
      }
    } catch (error: unknown) {
      toast.dismiss()
      toast.error(error instanceof Error ? error.message : t('restore.genericError'))
    } finally {
      setIsRestoring(false)
    }
  }

  // Calcular días de estancia
  const stayDays = calculateStayDays(entry.check_in_date, entry.check_out_date)

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title={t('modal.title')}>
      <div className="space-y-6">
        {/* Header con badges */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {entry.guest_name}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
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
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {t('modal.tabs.details')}
            </button>
            <button
              onClick={() => setActiveTab('images')}
              className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'images'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {t('modal.tabs.images')} ({entry.images.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {t('modal.tabs.history')} ({auditTrail.length})
            </button>
          </div>
        </div>

        {/* Content según tab activo */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* TAB: Detalles */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Información del documento */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <IoDocumentTextOutline size={18} />
                  {t('detail.documentInfo')}
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
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
              </div>

              {/* Fechas de hospedaje */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <IoCalendarOutline size={18} />
                  {t('detail.stayDates')}
                </h3>
                <div className="grid grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
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
              </div>

              {/* Motivo del incidente */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <IoWarningOutline size={18} />
                  {t('detail.incidentReason')}
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {entry.reason}
                  </p>
                </div>
              </div>

              {/* Comentarios adicionales */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {t('detail.additionalComments')}
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {entry.comments}
                  </p>
                </div>
              </div>

              {/* Información de registro */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <IoPersonOutline size={18} />
                  {t('detail.recordInfo')}
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
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
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatDateTime(entry.created_at)}
                    </div>
                  </div>
                  {entry.updated_at && (
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {t('detail.lastModification')}
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatDateTime(entry.updated_at)}
                      </div>
                    </div>
                  )}
                  {entry.deleted_at && (
                    <div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {t('detail.deletionDate')}
                      </div>
                      <div className="text-sm font-medium text-red-600 dark:text-red-400">
                        {formatDateTime(entry.deleted_at)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Imágenes */}
          {activeTab === 'images' && (
            <div>
              <ImageGallery images={entry.images} alt={`Evidencia de ${entry.guest_name}`} />
            </div>
          )}

          {/* TAB: Historial */}
          {activeTab === 'history' && (
            <div>
              <AuditTrail entries={auditTrail} />
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button variant="ghost" onClick={onClose}>
            {t('modal.close')}
          </Button>

          <div className="flex items-center gap-2">
            {entry.status === 'DELETED' ? (
              // Si está eliminado: mostrar botón restaurar
              <Button
                variant="primary"
                onClick={handleRestore}
                isLoading={isRestoring}
                leftIcon={<IoRefreshOutline size={18} />}
              >
                {t('modal.restore')}
              </Button>
            ) : (
              // Si está activo: mostrar editar y eliminar
              <>
                <Button
                  variant="secondary"
                  onClick={handleEdit}
                  leftIcon={<IoCreateOutline size={18} />}
                >
                  {t('modal.edit')}
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                  leftIcon={<IoTrashOutline size={18} />}
                >
                  {t('delete.button')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ✅ Features del BlacklistModal:

// ✅ 3 tabs organizados:

// 📋 Detalles - Información completa del registro
// 🖼️ Imágenes - Galería con lightbox
// 📜 Historial - Audit trail completo

// ✅ Información completa:

// Datos del huésped
// Documento
// Fechas + cálculo de días de estancia
// Motivo y comentarios
// Metadata (quién creó, cuándo)

// ✅ Acciones contextuales:

// Si activo: Editar + Eliminar
// Si eliminado: Restaurar

// ✅ Integración de componentes:

// ImageGallery para las fotos
// AuditTrail para el historial
// Modal base reutilizable

// ✅ Estados de loading - En eliminar y restaurar
// ✅ Confirmaciones - Antes de eliminar/restaurar
// ✅ Toast notifications - Feedback visual
// ✅ Router refresh - Actualiza la lista al cerrar
// ✅ Responsive - Grid adaptable
// ✅ Dark mode completo

// 🎯 Resumen de componentes completados:
// ✅ Tipos y schemas
// ✅ Componentes UI base (Input, Button, Modal, etc.)
// ✅ ImageUploader
// ✅ Servicios API
// ✅ Server Actions
// ✅ Pagination
// ✅ SearchBar
// ✅ BlacklistTable
// ✅ AuditTrail
// ✅ ImageGallery
// ✅ BlacklistForm
// ✅ BlacklistModal ← Acabamos de terminar

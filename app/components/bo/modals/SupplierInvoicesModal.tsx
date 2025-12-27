// app/components/bo/modals/SupplierInvoicesModal.tsx
/**
 * Modal para ver las facturas de un proveedor agrupadas por mes
 * Muestra todas las facturas (pending, validated, paid) organizadas por mes
 * Permite eliminar facturas con doble confirmación
 */

'use client'

import { useState, useEffect } from 'react'
import {
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiFileText,
  FiCheck,
  FiClock,
  FiDollarSign,
  FiTrash2,
  FiAlertTriangle,
  FiCheckCircle,
} from 'react-icons/fi'
import { useTranslations } from 'next-intl'
import type {
  InvoiceWithDetails,
  SupplierWithStats,
  InvoiceStatus,
} from '@/app/lib/backoffice/types'
import { formatCurrency, INVOICE_STATUS_COLORS } from '@/app/lib/backoffice/types'
import { backofficeApi } from '@/app/lib/backoffice/backofficeApi'
import toast from 'react-hot-toast'

interface SupplierInvoicesModalProps {
  isOpen: boolean
  onClose: () => void
  supplier: SupplierWithStats
  onInvoiceDeleted?: () => void
}

interface MonthGroup {
  year: number
  month: number
  monthName: string
  invoices: InvoiceWithDetails[]
  totalAmount: number
  paidCount: number
  pendingCount: number
  validatedCount: number
}

// Month keys for translation lookup
const MONTH_KEYS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const

// ============================================
// MOCK DATA - Eliminar cuando conectes con API
// ============================================
const _generateMockInvoices = (supplierName: string): InvoiceWithDetails[] => {
  const mockInvoices: InvoiceWithDetails[] = []
  const statuses: InvoiceStatus[] = ['paid', 'paid', 'paid', 'validated', 'pending']

  // Generar facturas para los últimos 6 meses
  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const date = new Date()
    date.setMonth(date.getMonth() - monthOffset)

    // 1-3 facturas por mes
    const invoicesThisMonth = Math.floor(Math.random() * 3) + 1

    for (let i = 0; i < invoicesThisMonth; i++) {
      const day = Math.floor(Math.random() * 28) + 1
      const invoiceDate = new Date(date.getFullYear(), date.getMonth(), day)
      const amount = Math.floor(Math.random() * 1500) + 100
      const status =
        monthOffset === 0 ? statuses[Math.floor(Math.random() * statuses.length)] : 'paid' // Meses anteriores están pagados

      mockInvoices.push({
        id: mockInvoices.length + 1,
        invoice_number: `FV${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(i + 1).padStart(3, '0')}`,
        supplier_id: 1,
        supplier_name: supplierName,
        category_id: 1,
        cost_center: 'GASTOS GENERALES',
        department: 'ADMINISTRACIÓN',
        category_full: 'GASTOS GENERALES - ADMINISTRACIÓN',
        amount_without_vat: amount,
        amount_with_vat: amount * 1.21,
        vat_percentage: 21,
        invoice_date: invoiceDate.toISOString(),
        received_date: invoiceDate.toISOString(),
        billing_period_start: null,
        billing_period_end: null,
        due_date: null,
        paid_date: status === 'paid' ? invoiceDate.toISOString() : null,
        status,
        payment_method: 'transfer',
        original_pdf_url: null,
        original_pdf_public_id: null,
        validated_pdf_url: status !== 'pending' ? 'https://example.com/pdf' : null,
        validated_pdf_public_id: null,
        validated_by: status !== 'pending' ? 'user-1' : null,
        validated_by_name: status !== 'pending' ? 'Admin' : null,
        validated_at: status !== 'pending' ? invoiceDate.toISOString() : null,
        validation_notes: null,
        notes: null,
        created_by: 'user-1',
        created_by_name: 'Admin',
        created_at: invoiceDate.toISOString(),
        updated_by: null,
        updated_at: invoiceDate.toISOString(),
        is_deleted: false,
      })
    }
  }

  return mockInvoices
}
// ============================================

export function SupplierInvoicesModal({
  isOpen,
  onClose,
  supplier,
  onInvoiceDeleted,
}: SupplierInvoicesModalProps) {
  const t = useTranslations('backoffice')
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())

  // Delete confirmation states (two-step)
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1)
  const [deletingInvoice, setDeletingInvoice] = useState<InvoiceWithDetails | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Helper functions for translations
  const getMonthName = (month: number): string => {
    return t(`months.${MONTH_KEYS[month - 1]}`)
  }

  const getStatusLabel = (status: InvoiceStatus): string => {
    return t(`status.${status}`)
  }

  // Fetch invoices when modal opens
  useEffect(() => {
    if (isOpen && supplier) {
      fetchInvoices()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, supplier])

  // Download PDF using proxy endpoint (ensures correct filename with .pdf extension)
  const handleDownloadPdf = async (
    invoiceId: number,
    type: 'original' | 'validated',
    invoiceNumber: string
  ) => {
    try {
      const url = backofficeApi.getInvoicePdfDownloadUrl(invoiceId, type)

      // Fetch the PDF blob (cookies-only)
      const response = await fetch(url, {
        credentials: 'include', // Siempre incluir cookies (HttpOnly)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: t('toast.unknownError') }))
        throw new Error(errorData.error || `Error ${response.status}`)
      }

      // Create blob and trigger download
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      // Create temporary link to trigger download with correct filename
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `factura_${invoiceNumber.replace(/[/\\?%*:|"<>]/g, '-')}_${type}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Cleanup blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('toast.downloadPdfError'))
    }
  }

  const fetchInvoices = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await backofficeApi.getSupplierById(supplier.id)
      setInvoices(response.invoices || [])

      // Auto-expand current month
      const now = new Date()
      const currentKey = `${now.getFullYear()}-${now.getMonth() + 1}`
      setExpandedMonths(new Set([currentKey]))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('toast.loadError'))
    } finally {
      setLoading(false)
    }
  }

  // Group invoices by month
  const groupedByMonth = (): MonthGroup[] => {
    const groups: Map<string, MonthGroup> = new Map()

    invoices.forEach((invoice) => {
      const date = new Date(invoice.invoice_date)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const key = `${year}-${month}`

      if (!groups.has(key)) {
        groups.set(key, {
          year,
          month,
          monthName: getMonthName(month),
          invoices: [],
          totalAmount: 0,
          paidCount: 0,
          pendingCount: 0,
          validatedCount: 0,
        })
      }

      const group = groups.get(key)!
      group.invoices.push(invoice)
      group.totalAmount += invoice.amount_with_vat

      if (invoice.status === 'paid') group.paidCount++
      else if (invoice.status === 'validated') group.validatedCount++
      else if (invoice.status === 'pending') group.pendingCount++
    })

    // Sort by date descending (most recent first)
    return Array.from(groups.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.month - a.month
    })
  }

  const toggleMonth = (year: number, month: number) => {
    const key = `${year}-${month}`
    const newExpanded = new Set(expandedMonths)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedMonths(newExpanded)
  }

  const isExpanded = (year: number, month: number) => {
    return expandedMonths.has(`${year}-${month}`)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    })
  }

  // Delete handlers
  const handleDeleteClick = (invoice: InvoiceWithDetails) => {
    setDeletingInvoice(invoice)
    setDeleteStep(1)
  }

  const handleDeleteCancel = () => {
    setDeletingInvoice(null)
    setDeleteStep(1)
  }

  const handleDeleteStep1Confirm = () => {
    setDeleteStep(2)
  }

  const handleDeleteFinalConfirm = async () => {
    if (!deletingInvoice) return

    setIsDeleting(true)
    try {
      await backofficeApi.deleteInvoice(deletingInvoice.id)
      setInvoices((prev) => prev.filter((i) => i.id !== deletingInvoice.id))

      toast.success(t('toast.invoiceDeleted'))
      setDeletingInvoice(null)
      setDeleteStep(1)
      onInvoiceDeleted?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('toast.invoiceDeleteError'))
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  const monthGroups = groupedByMonth()

  // Calculate totals
  const totalPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount_with_vat, 0)
  const totalPending = invoices
    .filter((i) => i.status === 'pending' || i.status === 'validated')
    .reduce((sum, i) => sum + i.amount_with_vat, 0)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl bg-white dark:bg-[#151b23] rounded-lg shadow-xl max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('modals.supplierInvoices.title', { name: supplier.name })}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {t('modals.supplierInvoices.totalInvoices', { count: invoices.length })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Summary Stats */}
          <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0d1117]">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('modals.supplierInvoices.stats.totalPaid')}
                </p>
                <p className="text-sm font-bold text-green-600 dark:text-green-400 mt-0.5">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('modals.supplierInvoices.stats.pending')}
                </p>
                <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400 mt-0.5">
                  {formatCurrency(totalPending)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('modals.supplierInvoices.stats.totalYtd')}
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                  {formatCurrency(supplier.ytd_total || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={fetchInvoices}
                  className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {t('actions.retry')}
                </button>
              </div>
            ) : monthGroups.length === 0 ? (
              <div className="text-center py-12">
                <FiFileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('empty.noInvoicesForSupplier')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {monthGroups.map((group) => {
                  const expanded = isExpanded(group.year, group.month)
                  return (
                    <div
                      key={`${group.year}-${group.month}`}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      {/* Month Header */}
                      <button
                        onClick={() => toggleMonth(group.year, group.month)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#0d1117] hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {expanded ? (
                            <FiChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <FiChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {group.monthName} {group.year}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({group.invoices.length}{' '}
                            {group.invoices.length !== 1
                              ? t('modals.supplierInvoices.invoices')
                              : t('modals.supplierInvoices.invoice')}
                            )
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          {/* Status badges */}
                          <div className="flex items-center gap-2">
                            {group.paidCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                <FiDollarSign className="w-3 h-3" />
                                {group.paidCount}
                              </span>
                            )}
                            {group.validatedCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                <FiCheck className="w-3 h-3" />
                                {group.validatedCount}
                              </span>
                            )}
                            {group.pendingCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                <FiClock className="w-3 h-3" />
                                {group.pendingCount}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(group.totalAmount)}
                          </span>
                        </div>
                      </button>

                      {/* Invoices List */}
                      {expanded && (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                          {group.invoices.map((invoice) => (
                            <div
                              key={invoice.id}
                              className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                            >
                              <div className="flex items-center gap-3">
                                <FiFileText className="w-4 h-4 text-gray-400" />
                                <div>
                                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                    {invoice.invoice_number}
                                  </p>
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                    {formatDate(invoice.invoice_date)}
                                    {invoice.paid_date && (
                                      <span className="ml-2">
                                        {t('modals.supplierInvoices.paidDate')}{' '}
                                        {formatDate(invoice.paid_date)}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                    INVOICE_STATUS_COLORS[invoice.status]
                                  }`}
                                >
                                  {getStatusLabel(invoice.status)}
                                </span>
                                <span className="text-xs font-medium text-gray-900 dark:text-gray-100 min-w-[80px] text-right">
                                  {formatCurrency(invoice.amount_with_vat)}
                                </span>
                                {/* PDF Download Links */}
                                <div className="flex items-center gap-1">
                                  {invoice.original_pdf_url ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDownloadPdf(
                                          invoice.id,
                                          'original',
                                          invoice.invoice_number
                                        )
                                      }}
                                      className="p-1.5 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                      title={t('modals.supplierInvoices.downloadOriginal')}
                                    >
                                      <FiFileText className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <span
                                      className="p-1.5 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                      title={t('modals.supplierInvoices.noOriginalPdf')}
                                    >
                                      <FiFileText className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                  {invoice.validated_pdf_url ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDownloadPdf(
                                          invoice.id,
                                          'validated',
                                          invoice.invoice_number
                                        )
                                      }}
                                      className="p-1.5 text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                      title={t('modals.supplierInvoices.downloadValidated')}
                                    >
                                      <FiCheckCircle className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <span
                                      className="p-1.5 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                      title={t('modals.supplierInvoices.noValidatedPdf')}
                                    >
                                      <FiCheckCircle className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteClick(invoice)
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  title={t('modals.supplierInvoices.deleteInvoice')}
                                >
                                  <FiTrash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('actions.close')}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog - Two Steps */}
      {deletingInvoice && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={handleDeleteCancel}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white dark:bg-[#151b23] rounded-lg shadow-xl">
              <div className="p-6">
                {/* Icon */}
                <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                  <FiAlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>

                {deleteStep === 1 ? (
                  <>
                    {/* Step 1: First confirmation */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
                      {t('modals.supplierInvoices.deleteConfirm.step1.title')}
                    </h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4 space-y-2">
                      <p>
                        <strong>{t('modals.supplierInvoices.deleteConfirm.step1.invoice')}</strong>{' '}
                        {deletingInvoice.invoice_number}
                      </p>
                      <p>
                        <strong>{t('modals.supplierInvoices.deleteConfirm.step1.amount')}</strong>{' '}
                        {formatCurrency(deletingInvoice.amount_with_vat)}
                      </p>
                      <p>
                        <strong>{t('modals.supplierInvoices.deleteConfirm.step1.status')}</strong>{' '}
                        {getStatusLabel(deletingInvoice.status)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                      {t('modals.supplierInvoices.deleteConfirm.step1.question')}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDeleteCancel}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {t('actions.cancel')}
                      </button>
                      <button
                        onClick={handleDeleteStep1Confirm}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                      >
                        {t('modals.supplierInvoices.deleteConfirm.step1.confirm')}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Step 2: Final confirmation */}
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 text-center mb-2">
                      {t('modals.supplierInvoices.deleteConfirm.step2.title')}
                    </h3>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4">
                      <p className="text-xs text-red-800 dark:text-red-300 text-center">
                        {t('modals.supplierInvoices.deleteConfirm.step2.warning', {
                          number: deletingInvoice.invoice_number,
                        })}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                      {t('modals.supplierInvoices.deleteConfirm.step2.instruction')}
                    </p>
                    <input
                      type="text"
                      id="delete-confirm-input"
                      placeholder={t('modals.supplierInvoices.deleteConfirm.step2.placeholder')}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-gray-100"
                      onChange={(e) => {
                        const btn = document.getElementById('final-delete-btn') as HTMLButtonElement
                        if (btn) {
                          btn.disabled =
                            e.target.value !== 'DELETE' && e.target.value !== 'ELIMINAR'
                        }
                      }}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleDeleteCancel}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        {t('actions.cancel')}
                      </button>
                      <button
                        id="final-delete-btn"
                        onClick={handleDeleteFinalConfirm}
                        disabled={true}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting
                          ? t('modals.supplierInvoices.deleteConfirm.step2.deleting')
                          : t('modals.supplierInvoices.deleteConfirm.step2.confirm')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

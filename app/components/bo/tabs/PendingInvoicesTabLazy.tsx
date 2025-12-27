// app/components/bo/tabs/PendingInvoicesTabLazy.tsx
/**
 * Client Component - Pending Invoices Tab
 *
 * Interactive table with filtering, selection, and actions.
 * Receives initial data from server, handles client-side filtering.
 * Uses backofficeApi for mutations (client-side auth).
 */

'use client'

import React, { useMemo, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import {
  FiSearch,
  FiPlus,
  FiCheck,
  FiEdit2,
  FiUpload,
  FiDownload,
  FiFileText,
  FiX,
  FiRotateCcw,
  FiDollarSign,
  FiFile,
  FiGrid,
} from 'react-icons/fi'
import type { InvoiceWithDetails, Category, SupplierWithStats } from '@/app/lib/backoffice/types'
import {
  formatCurrency,
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
} from '@/app/lib/backoffice/types'
import {
  InvoiceFormModal,
  PdfUploadModal,
  PdfViewerModal,
  PdfEditorModal,
  ConfirmDialog,
} from '@/app/components/bo/modals'
import { backofficeApi } from '@/app/lib/backoffice/backofficeApi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { exportToExcel, exportToPdf } from '@/app/lib/backoffice/export-utils'
import toast from 'react-hot-toast'

interface PendingInvoicesTabLazyProps {
  initialInvoices: InvoiceWithDetails[]
  categories: Category[]
  suppliers: SupplierWithStats[]
  pagination: { page: number; total: number; totalPages: number; limit: number }
}

const pendingKey = (page: number) => ['backoffice', 'invoices', 'pending', page] as const
const pendingListKey = () => ['backoffice', 'invoices', 'pending'] as const

export function PendingInvoicesTabLazy({
  initialInvoices,
  categories,
  suppliers,
  pagination,
}: PendingInvoicesTabLazyProps): React.JSX.Element {
  const t = useTranslations('backoffice')
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<
    'all' | 'transfer' | 'direct_debit'
  >('all')
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([])
  const [isSubmitting, startTransition] = useTransition()
  const [isExporting, setIsExporting] = useState(false)

  // Batch payment states
  const [batchPayDialogOpen, setBatchPayDialogOpen] = useState(false)
  const [batchPayPreview, setBatchPayPreview] = useState<{
    year: number
    month: number
    count: number
    total_amount: number
  } | null>(null)
  const [isBatchPaying, setIsBatchPaying] = useState(false)

  // Modal states
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<InvoiceWithDetails | null>(null)
  const [pdfUploadModalOpen, setPdfUploadModalOpen] = useState(false)
  const [uploadingInvoice, setUploadingInvoice] = useState<InvoiceWithDetails | null>(null)
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const [viewingPdfInvoice, setViewingPdfInvoice] = useState<InvoiceWithDetails | null>(null)
  const [deletingInvoice, setDeletingInvoice] = useState<InvoiceWithDetails | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // PDF Editor state
  const [pdfEditorOpen, setPdfEditorOpen] = useState(false)
  const [editingPdfInvoice, setEditingPdfInvoice] = useState<InvoiceWithDetails | null>(null)

  // Validation confirmation dialog (for invoices without PDF)
  const [validateDialogOpen, setValidateDialogOpen] = useState(false)
  const [validatingInvoice, setValidatingInvoice] = useState<InvoiceWithDetails | null>(null)

  const { data } = useQuery({
    queryKey: pendingKey(pagination.page),
    queryFn: async () => {
      const response = await backofficeApi.getInvoices({
        status: 'pending,validated',
        page: pagination.page,
        limit: pagination.limit ?? 50,
      })
      return response
    },
    initialData: {
      invoices: initialInvoices,
      pagination: {
        page: pagination.page,
        limit: pagination.limit ?? 50,
        total: pagination.total,
        totalPages: pagination.totalPages,
      },
      filters_applied: {},
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    structuralSharing: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: false,
  })

  const invoices = data?.invoices ?? initialInvoices

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || invoice.category_id === categoryFilter
      const matchesPaymentMethod =
        paymentMethodFilter === 'all' || invoice.payment_method === paymentMethodFilter
      return matchesSearch && matchesCategory && matchesPaymentMethod
    })
  }, [invoices, searchTerm, categoryFilter, paymentMethodFilter])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const toggleSelectInvoice = (id: number) => {
    setSelectedInvoices((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedInvoices.length === filteredInvoices.length) {
      setSelectedInvoices([])
    } else {
      setSelectedInvoices(filteredInvoices.map((i) => i.id))
    }
  }

  const invalidatePending = () => {
    queryClient.invalidateQueries({ queryKey: pendingListKey(), refetchType: 'active' })
  }

  // Modal handlers
  const handleOpenNewInvoice = () => {
    setEditingInvoice(null)
    setInvoiceModalOpen(true)
  }

  const handleOpenEditInvoice = (invoice: InvoiceWithDetails) => {
    setEditingInvoice(invoice)
    setInvoiceModalOpen(true)
  }

  const handleOpenPdfUpload = (invoice: InvoiceWithDetails) => {
    setUploadingInvoice(invoice)
    setPdfUploadModalOpen(true)
  }

  const handleOpenPdfViewer = (invoice: InvoiceWithDetails) => {
    const hasValidated = !!invoice.validated_pdf_url
    const hasOriginal = !!invoice.original_pdf_url

    console.log('[handleOpenPdfViewer] Invoice data:', {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      status: invoice.status,
      original_pdf_url: invoice.original_pdf_url,
      validated_pdf_url: invoice.validated_pdf_url,
      hasOriginal,
      hasValidated,
    })

    if (!hasValidated && !hasOriginal) {
      toast.error(t('toast.noPdfAttached'))
      return
    }

    setViewingPdfInvoice(invoice)
    setPdfViewerOpen(true)
  }

  // Action handlers
  const handleValidate = async (invoice: InvoiceWithDetails) => {
    // Si tiene PDF original, abrir el editor para añadir sello/firma
    if (invoice.original_pdf_url) {
      setEditingPdfInvoice(invoice)
      setPdfEditorOpen(true)
      return
    }

    // Si no tiene PDF, abrir diálogo de confirmación
    setValidatingInvoice(invoice)
    setValidateDialogOpen(true)
  }

  const handleOpenDeleteDialog = (invoice: InvoiceWithDetails) => {
    setDeletingInvoice(invoice)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingInvoice) return

    startTransition(async () => {
      try {
        await backofficeApi.deleteInvoice(deletingInvoice.id)
        toast.success(t('toast.invoiceDeleted'))
        setDeletingInvoice(null)
        setDeleteDialogOpen(false)
        invalidatePending()
      } catch (error) {
        const message = error instanceof Error ? error.message : t('toast.invoiceDeleteError')
        toast.error(message)
      }
    })
  }

  // Handle validation confirmation (for invoices without PDF)
  const handleConfirmValidate = async () => {
    if (!validatingInvoice) return

    startTransition(async () => {
      try {
        await backofficeApi.validateInvoice(validatingInvoice.id)
        toast.success(t('toast.invoiceValidated'))
        setValidateDialogOpen(false)
        setValidatingInvoice(null)
        invalidatePending()
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : t('toast.invoiceValidateError')
        toast.error(message)
      }
    })
  }

  // Handle unvalidate (revert validation)
  const handleUnvalidate = async (invoice: InvoiceWithDetails) => {
    console.log('[handleUnvalidate] Invoice:', {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      status: invoice.status,
    })

    startTransition(async () => {
      try {
        const result = await backofficeApi.unvalidateInvoice(invoice.id)
        console.log('[handleUnvalidate] Result:', result)
        toast.success(t('toast.validationReverted'))
        invalidatePending()
      } catch (error: unknown) {
        console.error('[handleUnvalidate] Error:', error)
        const message = error instanceof Error ? error.message : t('toast.validationRevertError')
        toast.error(message)
      }
    })
  }

  // Handle PDF editor save - upload validated PDF and mark as validated
  const handlePdfEditorSave = async (pdfBlob: Blob) => {
    if (!editingPdfInvoice) return

    try {
      // Create File from Blob
      const fileName = `${editingPdfInvoice.invoice_number.replace(/[/\\?%*:|"<>]/g, '-')}_validado.pdf`
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' })

      console.log('[handlePdfEditorSave] Uploading validated PDF:', {
        invoiceId: editingPdfInvoice.id,
        fileName,
        fileSize: file.size,
        fileType: file.type,
      })

      // Upload as validated PDF
      const uploadResult = await backofficeApi.uploadInvoicePdf(
        editingPdfInvoice.id,
        file,
        'validated'
      )
      console.log('[handlePdfEditorSave] Upload result:', uploadResult)

      // Mark invoice as validated using client-side API (not server action)
      // Uses cookie-based auth handled by apiClient
      console.log('[handlePdfEditorSave] Validating invoice:', editingPdfInvoice.id)
      const validateResult = await backofficeApi.validateInvoice(editingPdfInvoice.id)
      console.log('[handlePdfEditorSave] Validate result:', validateResult)

      toast.success(t('toast.pdfValidatedWithStamp'))

      // Close modal first, then refresh data
      setPdfEditorOpen(false)
      setEditingPdfInvoice(null)

      // Refetch after modal is closed (use pendingListKey as prefix matcher)
      await queryClient.refetchQueries({ queryKey: pendingListKey(), exact: false })
    } catch (error: unknown) {
      console.error('[handlePdfEditorSave] Error:', error)
      const message = error instanceof Error ? error.message : t('toast.pdfValidatedSaveError')
      toast.error(message)
      setPdfEditorOpen(false)
      setEditingPdfInvoice(null)
    }
  }

  const handleBulkValidate = async () => {
    if (selectedInvoices.length === 0) return

    startTransition(async () => {
      let successCount = 0
      let errorCount = 0

      for (const id of selectedInvoices) {
        try {
          await backofficeApi.validateInvoice(id)
          successCount++
        } catch (_err) {
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(t('toast.invoicesValidated', { count: successCount }))
      }
      if (errorCount > 0) {
        toast.error(t('toast.invoicesValidatedError', { count: errorCount }))
      }

      setSelectedInvoices([])
      invalidatePending()
    })
  }

  // Handle export validated invoices as ZIP
  const handleExportZip = async () => {
    if (selectedInvoices.length === 0) {
      toast.error(t('toast.selectAtLeastOne'))
      return
    }

    if (selectedInvoices.length > 100) {
      toast.error(t('toast.maxInvoicesDownload'))
      return
    }

    // Get selected invoices data
    const selectedInvoicesData = filteredInvoices.filter((inv) => selectedInvoices.includes(inv.id))

    // Check all are validated with validated_pdf_url
    const invalidInvoices = selectedInvoicesData.filter(
      (inv) => inv.status !== 'validated' || !inv.validated_pdf_url
    )

    if (invalidInvoices.length > 0) {
      const invalidNames = invalidInvoices
        .slice(0, 3)
        .map((inv) => inv.invoice_number)
        .join(', ')
      const moreText = invalidInvoices.length > 3 ? ` (+${invalidInvoices.length - 3})` : ''
      toast.error(t('toast.invoicesNotValidated', { names: `${invalidNames}${moreText}` }))
      return
    }

    setIsExporting(true)
    try {
      const blob = await backofficeApi.downloadValidatedInvoicesZip(selectedInvoices)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      a.download = `facturas_validadas_${timestamp}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(t('toast.invoicesDownloaded', { count: selectedInvoices.length }))
      setSelectedInvoices([])
    } catch (error: unknown) {
      console.error('[handleExportZip] Error:', error)
      const message = error instanceof Error ? error.message : t('toast.downloadError')
      toast.error(message)
    } finally {
      setIsExporting(false)
    }
  }

  // Handle batch payment preview
  const handleOpenBatchPayDialog = async () => {
    try {
      const preview = await backofficeApi.previewBatchPayment()
      setBatchPayPreview(preview)
      setBatchPayDialogOpen(true)
    } catch (error: unknown) {
      console.error('[handleOpenBatchPayDialog] Error:', error)
      const message = error instanceof Error ? error.message : t('toast.exportError')
      toast.error(message)
    }
  }

  // Execute batch payment
  const handleExecuteBatchPayment = async () => {
    if (!batchPayPreview) return

    setIsBatchPaying(true)
    try {
      const result = await backofficeApi.executeBatchPayment(
        batchPayPreview.year,
        batchPayPreview.month
      )

      toast.success(result.message)
      setBatchPayDialogOpen(false)
      setBatchPayPreview(null)
      invalidatePending()
    } catch (error: unknown) {
      console.error('[handleExecuteBatchPayment] Error:', error)
      const message = error instanceof Error ? error.message : t('toast.batchPaymentError')
      toast.error(message)
    } finally {
      setIsBatchPaying(false)
    }
  }

  // Get month name from translations
  const getMonthName = (month: number): string => {
    const monthKeys = [
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
    ]
    return t(`months.${monthKeys[month - 1]}`)
  }

  const totalSelected = filteredInvoices
    .filter((i) => selectedInvoices.includes(i.id))
    .reduce((sum, i) => sum + i.amount_with_vat, 0)

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="relative w-full lg:w-64">
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={t('filters.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 dark:bg-[#151b23] dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
          }
          className="flex-1 min-w-[280px] px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent bg-white dark:bg-[#151b23] dark:text-gray-200"
        >
          <option value="all">{t('filters.allCategories')}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.cost_center} - {cat.department}
            </option>
          ))}
        </select>

        {/* Payment Method Filter */}
        <select
          value={paymentMethodFilter}
          onChange={(e) =>
            setPaymentMethodFilter(e.target.value as 'all' | 'transfer' | 'direct_debit')
          }
          className="w-full lg:w-40 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent bg-white dark:bg-[#151b23] dark:text-gray-200"
        >
          <option value="all">{t('filters.allPayments')}</option>
          <option value="transfer">{t('filters.transfer')}</option>
          <option value="direct_debit">{t('filters.directDebit')}</option>
        </select>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleOpenNewInvoice}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 dark:bg-green-700 text-white text-xs font-medium rounded-md hover:bg-green-700 dark:hover:bg-green-800 transition-colors"
          >
            <FiPlus className="w-3.5 h-3.5" />
            {t('actions.newInvoice')}
          </button>
          <button
            onClick={handleOpenBatchPayDialog}
            title={t('modals.batchPayment.title')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-purple-600 dark:bg-purple-700 text-white text-xs font-medium rounded-md hover:bg-purple-700 dark:hover:bg-purple-800 transition-colors"
          >
            <FiDollarSign className="w-3.5 h-3.5" />
            {t('actions.closeMonth')}
          </button>
        </div>
      </div>

      {/* Selected Actions */}
      {selectedInvoices.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-2">
          <span className="text-xs text-blue-700 dark:text-blue-400">
            {t('selection.selected', {
              count: selectedInvoices.length,
              amount: formatCurrency(totalSelected),
            })}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkValidate}
              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
            >
              <FiCheck className="w-3 h-3" /> {t('actions.validate')}
            </button>
            <button
              onClick={handleExportZip}
              disabled={isExporting}
              title={t('actions.exportZip')}
              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50"
            >
              <FiDownload className="w-3 h-3" />
              {isExporting ? t('actions.downloading') : t('actions.exportZip')}
            </button>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#0d1117] border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedInvoices.length === filteredInvoices.length &&
                      filteredInvoices.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('table.supplier')}
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('table.invoiceNumber')}
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('table.date')}
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('table.withoutVat')}
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('table.withVat')}
                </th>
                <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('table.status')}
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('table.category')}
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400"
                  >
                    {t('empty.noInvoices')}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const isSelected = selectedInvoices.includes(invoice.id)
                  const hasPdf = invoice.original_pdf_url || invoice.validated_pdf_url
                  return (
                    <tr
                      key={invoice.id}
                      className={`hover:bg-gray-50 dark:hover:bg-[#0d1117] transition-colors ${
                        isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectInvoice(invoice.id)}
                          className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-xs font-medium text-gray-900 dark:text-gray-100">
                        {invoice.supplier_name}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 font-mono">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(invoice.invoice_date)}
                      </td>
                      <td className="px-3 py-2 text-xs text-right text-gray-600 dark:text-gray-400">
                        {formatCurrency(invoice.amount_without_vat)}
                      </td>
                      <td className="px-3 py-2 text-xs text-right font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(invoice.amount_with_vat)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            INVOICE_STATUS_COLORS[invoice.status]
                          }`}
                        >
                          {invoice.status === 'validated' && <FiCheck className="w-3 h-3" />}
                          {INVOICE_STATUS_LABELS[invoice.status]}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs text-gray-900 dark:text-gray-100">
                          {invoice.cost_center}
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-500">
                          {invoice.department}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {invoice.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleValidate(invoice)}
                                disabled={isSubmitting}
                                title={
                                  invoice.original_pdf_url
                                    ? t('pending.validateWithStamp')
                                    : t('actions.validate')
                                }
                                className="inline-flex items-center justify-center w-7 h-7 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
                              >
                                <FiCheck className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenDeleteDialog(invoice)}
                                disabled={isSubmitting}
                                title={t('actions.delete')}
                                className="inline-flex items-center justify-center w-7 h-7 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
                              >
                                <FiX className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {invoice.status === 'validated' && (
                            <button
                              onClick={() => handleUnvalidate(invoice)}
                              disabled={isSubmitting}
                              title={t('pending.revertValidation')}
                              className="inline-flex items-center justify-center w-7 h-7 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
                            >
                              <FiRotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditInvoice(invoice)}
                            title={t('actions.edit')}
                            className="inline-flex items-center justify-center w-7 h-7 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenPdfUpload(invoice)}
                            title={t('actions.uploadPdf')}
                            className="inline-flex items-center justify-center w-7 h-7 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                          >
                            <FiUpload className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenPdfViewer(invoice)}
                            title={hasPdf ? t('actions.viewPdf') : t('pending.noPdf')}
                            disabled={!hasPdf}
                            className={`inline-flex items-center justify-center w-7 h-7 rounded transition-colors ${
                              hasPdf
                                ? 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                            }`}
                          >
                            <FiFileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination info and Export buttons */}
        {pagination.total > 0 && (
          <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('pagination.showing', { count: filteredInvoices.length, total: pagination.total })}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    await exportToExcel(filteredInvoices)
                    toast.success(t('toast.excelExported'))
                  } catch (error) {
                    console.error('[exportToExcel] Error:', error)
                    toast.error(t('toast.excelExportError'))
                  }
                }}
                disabled={filteredInvoices.length === 0}
                title="Excel"
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 border border-green-300 dark:border-green-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiGrid className="w-3 h-3" />
                Excel
              </button>
              <button
                onClick={async () => {
                  try {
                    await exportToPdf(filteredInvoices)
                    toast.success(t('toast.pdfExported'))
                  } catch (error) {
                    console.error('[exportToPdf] Error:', error)
                    toast.error(t('toast.pdfExportError'))
                  }
                }}
                disabled={filteredInvoices.length === 0}
                title="PDF"
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-300 dark:border-red-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiFile className="w-3 h-3" />
                PDF
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-2">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('empty.noInvoices')}</p>
          </div>
        ) : (
          filteredInvoices.map((invoice) => {
            const isSelected = selectedInvoices.includes(invoice.id)
            const hasPdf = invoice.original_pdf_url || invoice.validated_pdf_url
            return (
              <div
                key={invoice.id}
                className={`bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectInvoice(invoice.id)}
                      className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <h3 className="font-semibold text-xs text-gray-900 dark:text-gray-100">
                        {invoice.supplier_name}
                      </h3>
                      <p className="text-[10px] text-gray-500 dark:text-gray-500 font-mono">
                        {invoice.invoice_number}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      INVOICE_STATUS_COLORS[invoice.status]
                    }`}
                  >
                    {invoice.status === 'validated' && <FiCheck className="w-3 h-3" />}
                    {INVOICE_STATUS_LABELS[invoice.status]}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                  <div>
                    <span className="text-gray-500 dark:text-gray-500">{t('table.date')}:</span>
                    <span className="ml-1 text-gray-900 dark:text-gray-100">
                      {formatDate(invoice.invoice_date)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 dark:text-gray-500">{t('table.withVat')}:</span>
                    <span className="ml-1 font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(invoice.amount_with_vat)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] text-gray-600 dark:text-gray-400">
                    {invoice.cost_center}
                  </span>
                  <div className="flex items-center gap-1">
                    {invoice.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleValidate(invoice)}
                          disabled={isSubmitting}
                          title={
                            invoice.original_pdf_url
                              ? t('pending.validateWithStamp')
                              : t('actions.validate')
                          }
                          className="inline-flex items-center justify-center w-7 h-7 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
                        >
                          <FiCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteDialog(invoice)}
                          disabled={isSubmitting}
                          title={t('actions.delete')}
                          className="inline-flex items-center justify-center w-7 h-7 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
                        >
                          <FiX className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {invoice.status === 'validated' && (
                      <button
                        onClick={() => handleUnvalidate(invoice)}
                        disabled={isSubmitting}
                        title={t('pending.revertValidation')}
                        className="inline-flex items-center justify-center w-6 h-6 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                      >
                        <FiRotateCcw className="w-3 h-3" />
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEditInvoice(invoice)}
                      className="inline-flex items-center justify-center w-6 h-6 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                      <FiEdit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleOpenPdfUpload(invoice)}
                      className="inline-flex items-center justify-center w-6 h-6 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                      <FiUpload className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleOpenPdfViewer(invoice)}
                      disabled={!hasPdf}
                      className={`inline-flex items-center justify-center w-6 h-6 rounded transition-colors ${
                        hasPdf
                          ? 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                          : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <FiFileText className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Invoice Form Modal */}
      <InvoiceFormModal
        isOpen={invoiceModalOpen}
        onClose={() => {
          setInvoiceModalOpen(false)
          setEditingInvoice(null)
        }}
        onSuccess={invalidatePending}
        invoice={editingInvoice}
        categories={categories}
        suppliers={suppliers}
      />

      {/* PDF Upload Modal */}
      {uploadingInvoice && (
        <PdfUploadModal
          isOpen={pdfUploadModalOpen}
          onClose={() => {
            setPdfUploadModalOpen(false)
            setUploadingInvoice(null)
          }}
          onSuccess={invalidatePending}
          invoiceId={uploadingInvoice.id}
          invoiceNumber={uploadingInvoice.invoice_number}
          type="original"
          existingPdfUrl={uploadingInvoice.original_pdf_url}
        />
      )}

      {/* PDF Viewer Modal */}
      {viewingPdfInvoice && (
        <PdfViewerModal
          isOpen={pdfViewerOpen}
          onClose={() => {
            setPdfViewerOpen(false)
            setViewingPdfInvoice(null)
          }}
          invoiceId={viewingPdfInvoice.id}
          invoiceNumber={viewingPdfInvoice.invoice_number}
          hasOriginalPdf={!!viewingPdfInvoice.original_pdf_url}
          hasValidatedPdf={!!viewingPdfInvoice.validated_pdf_url}
          invoiceStatus={viewingPdfInvoice.status}
        />
      )}

      {/* PDF Editor Modal */}
      {editingPdfInvoice && (
        <PdfEditorModal
          isOpen={pdfEditorOpen}
          onClose={() => {
            setPdfEditorOpen(false)
            setEditingPdfInvoice(null)
          }}
          onSave={handlePdfEditorSave}
          invoiceId={editingPdfInvoice.id}
          invoiceNumber={editingPdfInvoice.invoice_number}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen && !!deletingInvoice}
        onClose={() => {
          setDeleteDialogOpen(false)
          setDeletingInvoice(null)
        }}
        onConfirm={handleDelete}
        title={t('modals.deleteInvoice.title')}
        message={t('modals.deleteInvoice.message', {
          number: deletingInvoice?.invoice_number ?? '',
        })}
        confirmText={t('modals.deleteInvoice.confirmButton')}
        variant="danger"
      />

      {/* Validate Confirmation Dialog (for invoices without PDF) */}
      {validatingInvoice && validateDialogOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => {
              setValidateDialogOpen(false)
              setValidatingInvoice(null)
            }}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white dark:bg-[#151b23] rounded-lg shadow-xl">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t('modals.validateInvoice.title')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <strong>{t('modals.validateInvoice.invoice')}</strong>{' '}
                  {validatingInvoice.invoice_number}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <strong>{t('modals.validateInvoice.supplier')}</strong>{' '}
                  {validatingInvoice.supplier_name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <strong>{t('modals.validateInvoice.amount')}</strong>{' '}
                  {formatCurrency(validatingInvoice.amount_with_vat)}
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-4">
                  <p className="text-xs text-yellow-800 dark:text-yellow-300">
                    {t('modals.validateInvoice.noPdfWarning')}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setValidateDialogOpen(false)
                      setValidatingInvoice(null)
                    }}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {t('actions.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmValidate}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting
                      ? t('actions.processing')
                      : t('modals.validateInvoice.confirmButton')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Payment Dialog */}
      {batchPayDialogOpen && batchPayPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => {
              if (!isBatchPaying) {
                setBatchPayDialogOpen(false)
                setBatchPayPreview(null)
              }
            }}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white dark:bg-[#151b23] rounded-lg shadow-xl">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {t('modals.batchPayment.title')}
                </h3>

                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md p-4 mb-4">
                  <p className="text-sm text-purple-800 dark:text-purple-300 mb-2">
                    <strong>{t('modals.batchPayment.month')}</strong>{' '}
                    {getMonthName(batchPayPreview.month)} {batchPayPreview.year}
                  </p>
                  <p className="text-sm text-purple-800 dark:text-purple-300 mb-2">
                    <strong>{t('modals.batchPayment.validatedInvoices')}</strong>{' '}
                    {batchPayPreview.count}
                  </p>
                  <p className="text-sm text-purple-800 dark:text-purple-300">
                    <strong>{t('modals.batchPayment.totalAmount')}</strong>{' '}
                    {formatCurrency(batchPayPreview.total_amount)}
                  </p>
                </div>

                {batchPayPreview.count === 0 ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-4">
                    <p className="text-xs text-yellow-800 dark:text-yellow-300">
                      {t('modals.batchPayment.noInvoices')}
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-4">
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      {t('modals.batchPayment.description', {
                        month: getMonthName(batchPayPreview.month),
                      })}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setBatchPayDialogOpen(false)
                      setBatchPayPreview(null)
                    }}
                    disabled={isBatchPaying}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {t('actions.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteBatchPayment}
                    disabled={isBatchPaying || batchPayPreview.count === 0}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {isBatchPaying
                      ? t('actions.processing')
                      : t('modals.batchPayment.confirmButton', { count: batchPayPreview.count })}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// app/components/bo/tabs/PaidInvoicesTab.tsx
/**
 * Client Component - Paid Invoices Tab
 *
 * Read-only view with export capabilities.
 * Receives initial data from server.
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  FiSearch,
  FiDownload,
  FiFileText,
  FiCalendar,
  FiRotateCcw,
  FiChevronLeft,
  FiChevronRight,
  FiPackage,
} from 'react-icons/fi'
import type { InvoiceWithDetails, Category } from '@/app/lib/backoffice/types'
import { formatCurrency } from '@/app/lib/backoffice/types'
import { PdfViewerModal } from '@/app/components/bo/modals'
import { backofficeApi } from '@/app/lib/backoffice'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

// ============================================
// MOCK DATA - DELETE BEFORE PRODUCTION
// ============================================
const MOCK_CATEGORIES = [
  { id: 1, cost_center: 'HOTEL', department: 'Mantenimiento', is_active: true },
  { id: 2, cost_center: 'HOTEL', department: 'Limpieza', is_active: true },
  { id: 3, cost_center: 'RESTAURANTE', department: 'Cocina', is_active: true },
  { id: 4, cost_center: 'RESTAURANTE', department: 'Sala', is_active: true },
  { id: 5, cost_center: 'ADMINISTRACIÓN', department: 'Contabilidad', is_active: true },
] as Category[]

const MOCK_INVOICES = [
  // Diciembre 2025
  {
    id: 1,
    supplier_id: 1,
    supplier_name: 'Iberdrola S.A.',
    invoice_number: 'IBE-2025-001',
    invoice_date: '2025-12-05',
    amount_without_vat: 1250.0,
    vat_percentage: 21,
    amount_with_vat: 1512.5,
    payment_method: 'direct_debit',
    status: 'paid',
    paid_date: '2025-12-15',
    category_id: 1,
    cost_center: 'HOTEL',
    department: 'Mantenimiento',
    original_pdf_url: null,
    validated_pdf_url: '/test.pdf',
  },
  {
    id: 2,
    supplier_id: 2,
    supplier_name: 'Endesa Energía',
    invoice_number: 'END-2025-042',
    invoice_date: '2025-12-08',
    amount_without_vat: 890.0,
    vat_percentage: 21,
    amount_with_vat: 1076.9,
    payment_method: 'transfer',
    status: 'paid',
    paid_date: '2025-12-18',
    category_id: 2,
    cost_center: 'HOTEL',
    department: 'Limpieza',
    original_pdf_url: '/orig.pdf',
    validated_pdf_url: '/test.pdf',
  },
  {
    id: 3,
    supplier_id: 3,
    supplier_name: 'Makro Cash & Carry',
    invoice_number: 'MAK-121545',
    invoice_date: '2025-12-10',
    amount_without_vat: 2340.5,
    vat_percentage: 10,
    amount_with_vat: 2574.55,
    payment_method: 'transfer',
    status: 'paid',
    paid_date: '2025-12-20',
    category_id: 3,
    cost_center: 'RESTAURANTE',
    department: 'Cocina',
    original_pdf_url: null,
    validated_pdf_url: '/test.pdf',
  },
  // Noviembre 2025
  {
    id: 4,
    supplier_id: 4,
    supplier_name: 'Telefónica España',
    invoice_number: 'TEL-2025-11-001',
    invoice_date: '2025-11-02',
    amount_without_vat: 456.0,
    vat_percentage: 21,
    amount_with_vat: 551.76,
    payment_method: 'direct_debit',
    status: 'paid',
    paid_date: '2025-11-10',
    category_id: 5,
    cost_center: 'ADMINISTRACIÓN',
    department: 'Contabilidad',
    original_pdf_url: '/orig.pdf',
    validated_pdf_url: '/test.pdf',
  },
  {
    id: 5,
    supplier_id: 5,
    supplier_name: 'Aguas de Barcelona',
    invoice_number: 'AGBAR-2025-8542',
    invoice_date: '2025-11-15',
    amount_without_vat: 320.0,
    vat_percentage: 10,
    amount_with_vat: 352.0,
    payment_method: 'direct_debit',
    status: 'paid',
    paid_date: '2025-11-25',
    category_id: 1,
    cost_center: 'HOTEL',
    department: 'Mantenimiento',
    original_pdf_url: null,
    validated_pdf_url: null,
  },
  {
    id: 6,
    supplier_id: 6,
    supplier_name: 'Distribuciones García S.L.',
    invoice_number: 'DG-2025-0891',
    invoice_date: '2025-11-18',
    amount_without_vat: 1890.0,
    vat_percentage: 21,
    amount_with_vat: 2286.9,
    payment_method: 'transfer',
    status: 'paid',
    paid_date: '2025-11-28',
    category_id: 3,
    cost_center: 'RESTAURANTE',
    department: 'Cocina',
    original_pdf_url: '/orig.pdf',
    validated_pdf_url: '/test.pdf',
  },
  // Octubre 2025
  {
    id: 7,
    supplier_id: 1,
    supplier_name: 'Iberdrola S.A.',
    invoice_number: 'IBE-2025-OCT',
    invoice_date: '2025-10-05',
    amount_without_vat: 1180.0,
    vat_percentage: 21,
    amount_with_vat: 1427.8,
    payment_method: 'direct_debit',
    status: 'paid',
    paid_date: '2025-10-15',
    category_id: 1,
    cost_center: 'HOTEL',
    department: 'Mantenimiento',
    original_pdf_url: null,
    validated_pdf_url: '/test.pdf',
  },
  {
    id: 8,
    supplier_id: 7,
    supplier_name: 'Limpieza Industrial BCN',
    invoice_number: 'LIB-2025-456',
    invoice_date: '2025-10-12',
    amount_without_vat: 750.0,
    vat_percentage: 21,
    amount_with_vat: 907.5,
    payment_method: 'transfer',
    status: 'paid',
    paid_date: '2025-10-22',
    category_id: 2,
    cost_center: 'HOTEL',
    department: 'Limpieza',
    original_pdf_url: '/orig.pdf',
    validated_pdf_url: '/test.pdf',
  },
  // Septiembre 2025
  {
    id: 9,
    supplier_id: 8,
    supplier_name: 'Repsol Butano',
    invoice_number: 'REP-2025-09-123',
    invoice_date: '2025-09-08',
    amount_without_vat: 560.0,
    vat_percentage: 21,
    amount_with_vat: 677.6,
    payment_method: 'transfer',
    status: 'paid',
    paid_date: '2025-09-18',
    category_id: 3,
    cost_center: 'RESTAURANTE',
    department: 'Cocina',
    original_pdf_url: null,
    validated_pdf_url: '/test.pdf',
  },
  {
    id: 10,
    supplier_id: 9,
    supplier_name: 'Seguros Mapfre',
    invoice_number: 'MAP-2025-ANUAL',
    invoice_date: '2025-09-01',
    amount_without_vat: 3200.0,
    vat_percentage: 0,
    amount_with_vat: 3200.0,
    payment_method: 'direct_debit',
    status: 'paid',
    paid_date: '2025-09-05',
    category_id: 5,
    cost_center: 'ADMINISTRACIÓN',
    department: 'Contabilidad',
    original_pdf_url: '/orig.pdf',
    validated_pdf_url: '/test.pdf',
  },
  // Diciembre 2024
  {
    id: 11,
    supplier_id: 1,
    supplier_name: 'Iberdrola S.A.',
    invoice_number: 'IBE-2024-DIC',
    invoice_date: '2024-12-05',
    amount_without_vat: 1100.0,
    vat_percentage: 21,
    amount_with_vat: 1331.0,
    payment_method: 'direct_debit',
    status: 'paid',
    paid_date: '2024-12-15',
    category_id: 1,
    cost_center: 'HOTEL',
    department: 'Mantenimiento',
    original_pdf_url: null,
    validated_pdf_url: '/test.pdf',
  },
  {
    id: 12,
    supplier_id: 3,
    supplier_name: 'Makro Cash & Carry',
    invoice_number: 'MAK-2024-FINAL',
    invoice_date: '2024-12-20',
    amount_without_vat: 4500.0,
    vat_percentage: 10,
    amount_with_vat: 4950.0,
    payment_method: 'transfer',
    status: 'paid',
    paid_date: '2024-12-28',
    category_id: 3,
    cost_center: 'RESTAURANTE',
    department: 'Cocina',
    original_pdf_url: '/orig.pdf',
    validated_pdf_url: '/test.pdf',
  },
  // Noviembre 2024
  {
    id: 13,
    supplier_id: 4,
    supplier_name: 'Telefónica España',
    invoice_number: 'TEL-2024-11',
    invoice_date: '2024-11-02',
    amount_without_vat: 420.0,
    vat_percentage: 21,
    amount_with_vat: 508.2,
    payment_method: 'direct_debit',
    status: 'paid',
    paid_date: '2024-11-12',
    category_id: 5,
    cost_center: 'ADMINISTRACIÓN',
    department: 'Contabilidad',
    original_pdf_url: null,
    validated_pdf_url: '/test.pdf',
  },
] as InvoiceWithDetails[]

const MOCK_PAGINATION = { page: 2, total: 250, totalPages: 3 }

const USE_MOCK_DATA = false // SET TO FALSE FOR PRODUCTION
// ============================================
// END MOCK DATA
// ============================================

interface PaidInvoicesTabProps {
  initialInvoices: InvoiceWithDetails[]
  categories: Category[]
  pagination: { page: number; total: number; totalPages: number }
  onPageChange?: (page: number) => void
}

export function PaidInvoicesTab({
  initialInvoices: realInvoices,
  categories: realCategories,
  pagination: realPagination,
  onPageChange,
}: PaidInvoicesTabProps) {
  const t = useTranslations('backoffice')

  // Helper function to get month name from translations
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
    return t(`months.${monthKeys[month - 1]}`) || ''
  }

  // Use mock data or real data based on flag
  const initialInvoices = USE_MOCK_DATA ? MOCK_INVOICES : realInvoices
  const categories = USE_MOCK_DATA ? MOCK_CATEGORIES : realCategories
  const pagination = USE_MOCK_DATA ? MOCK_PAGINATION : realPagination

  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<
    'all' | 'transfer' | 'direct_debit'
  >('all')
  const [dateFilter, setDateFilter] = useState<'specific_month' | 'quarter' | 'year' | 'all'>(
    'specific_month'
  )
  const [isExportingZip, setIsExportingZip] = useState(false)

  // Calculate available months from invoices (needed for initial selectedMonth)
  const availableMonths = (() => {
    const monthsMap = new Map<string, { year: number; month: number; count: number }>()

    initialInvoices.forEach((invoice) => {
      if (invoice.invoice_date) {
        const date = new Date(invoice.invoice_date)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const key = `${year}-${month}`

        if (!monthsMap.has(key)) {
          monthsMap.set(key, { year, month, count: 0 })
        }
        monthsMap.get(key)!.count++
      }
    })

    return Array.from(monthsMap.values())
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })
      .map((m) => ({
        year: m.year,
        month: m.month,
        count: m.count,
        label: `${getMonthName(m.month)} ${m.year} (${m.count})`,
        monthLabel: `${getMonthName(m.month)} (${m.count})`,
      }))
  })()

  // Initialize selectedMonth with the first available month
  const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number } | null>(() => {
    if (availableMonths.length > 0) {
      return { year: availableMonths[0].year, month: availableMonths[0].month }
    }
    return null
  })

  // Modal states
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const [viewingPdfInvoice, setViewingPdfInvoice] = useState<InvoiceWithDetails | null>(null)

  // Revert batch payment states
  const [revertDialogOpen, setRevertDialogOpen] = useState(false)
  const [revertPreview, setRevertPreview] = useState<{
    year: number
    month: number
    count: number
    total_amount: number
  } | null>(null)
  const [isReverting, setIsReverting] = useState(false)
  const [selectedMonthYear, setSelectedMonthYear] = useState<{
    year: number
    month: number
  } | null>(null)

  // Client-side filtering
  // Use initialInvoices directly - it gets updated on router.refresh()
  const filteredInvoices = initialInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || invoice.category_id === categoryFilter
    const matchesPaymentMethod =
      paymentMethodFilter === 'all' || invoice.payment_method === paymentMethodFilter

    // Date filtering
    if (dateFilter === 'specific_month' && invoice.invoice_date) {
      // Filter by specific month (using invoice_date, not paid_date)
      if (selectedMonth) {
        const invoiceDate = new Date(invoice.invoice_date)
        const invoiceYear = invoiceDate.getFullYear()
        const invoiceMonth = invoiceDate.getMonth() + 1
        if (invoiceYear !== selectedMonth.year || invoiceMonth !== selectedMonth.month) {
          return false
        }
      }
    } else if (dateFilter !== 'all' && invoice.paid_date) {
      const paidDate = new Date(invoice.paid_date)
      const now = new Date()

      if (dateFilter === 'quarter') {
        const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        if (paidDate < quarterAgo) return false
      } else if (dateFilter === 'year') {
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        if (paidDate < yearAgo) return false
      }
    }

    return matchesSearch && matchesCategory && matchesPaymentMethod
  })

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Handle PDF viewer
  const handleOpenPdfViewer = (invoice: InvoiceWithDetails) => {
    const hasValidated = !!invoice.validated_pdf_url
    const hasOriginal = !!invoice.original_pdf_url

    if (!hasValidated && !hasOriginal) {
      toast.error(t('toast.noPdfAttached'))
      return
    }

    setViewingPdfInvoice(invoice)
    setPdfViewerOpen(true)
  }

  // Handle revert batch payment
  const handleOpenRevertDialog = async () => {
    // Get available months from paid invoices
    const months = getAvailableMonths()
    if (months.length === 0) {
      toast.error(t('toast.noPaidInvoicesToRevert'))
      return
    }

    // Default to most recent month
    const latestMonth = months[0]
    setSelectedMonthYear(latestMonth)

    try {
      const preview = await backofficeApi.previewRevertBatchPayment(
        latestMonth.year,
        latestMonth.month
      )
      setRevertPreview(preview)
      setRevertDialogOpen(true)
    } catch (error: unknown) {
      console.error('[handleOpenRevertDialog] Error:', error)
      toast.error(error instanceof Error ? error.message : t('toast.exportError'))
    }
  }

  // Handle month selection change in revert dialog
  const handleRevertMonthChange = async (year: number, month: number) => {
    setSelectedMonthYear({ year, month })
    try {
      const preview = await backofficeApi.previewRevertBatchPayment(year, month)
      setRevertPreview(preview)
    } catch (error: unknown) {
      console.error('[handleRevertMonthChange] Error:', error)
      toast.error(error instanceof Error ? error.message : t('toast.exportError'))
    }
  }

  // Execute revert batch payment
  const handleExecuteRevert = async () => {
    if (!revertPreview) return

    setIsReverting(true)
    try {
      const result = await backofficeApi.revertBatchPayment(revertPreview.year, revertPreview.month)

      toast.success(result.message)
      setRevertDialogOpen(false)
      setRevertPreview(null)
      setSelectedMonthYear(null)
      router.refresh()
    } catch (error: unknown) {
      console.error('[handleExecuteRevert] Error:', error)
      toast.error(error instanceof Error ? error.message : t('toast.revertError'))
    } finally {
      setIsReverting(false)
    }
  }

  // Get available months from paid invoices
  const getAvailableMonths = (): { year: number; month: number; label: string }[] => {
    const monthsMap = new Map<string, { year: number; month: number; count: number }>()

    initialInvoices.forEach((invoice) => {
      if (invoice.invoice_date) {
        const date = new Date(invoice.invoice_date)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const key = `${year}-${month}`

        if (!monthsMap.has(key)) {
          monthsMap.set(key, { year, month, count: 0 })
        }
        monthsMap.get(key)!.count++
      }
    })

    const months = Array.from(monthsMap.values())
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })
      .map((m) => ({
        year: m.year,
        month: m.month,
        label: `${getMonthName(m.month)} ${m.year} (${m.count})`,
      }))

    return months
  }

  // Helper to safely format numbers
  const safeToFixed = (value: number | string | null | undefined, decimals: number = 2): string => {
    if (value === null || value === undefined) return '0.00'
    const num = typeof value === 'string' ? parseFloat(value) : value
    return isNaN(num) ? '0.00' : num.toFixed(decimals)
  }

  // Export to CSV (max 50 entries)
  const handleExport = () => {
    if (filteredInvoices.length === 0) {
      toast.error(t('toast.noInvoicesToExport'))
      return
    }

    // Limit to 50 entries
    const invoicesToExport = filteredInvoices.slice(0, 50)
    if (filteredInvoices.length > 50) {
      toast(t('toast.exportFirst50'), {
        icon: '⚠️',
      })
    }

    // Create CSV content
    const headers = [
      t('table.supplier'),
      t('table.invoiceNumber'),
      t('table.invoiceDate'),
      t('table.paymentDate'),
      t('table.withoutVat'),
      t('table.withVat'),
      '% VAT',
      t('table.method'),
      'Cost Center',
      t('table.department'),
    ]

    const rows = invoicesToExport.map((invoice) => [
      invoice.supplier_name || '',
      invoice.invoice_number || '',
      invoice.invoice_date || '',
      invoice.paid_date || '',
      safeToFixed(invoice.amount_without_vat),
      safeToFixed(invoice.amount_with_vat),
      (invoice.vat_percentage ?? 0).toString(),
      invoice.payment_method === 'transfer' ? t('filters.transfer') : t('filters.directDebit'),
      invoice.cost_center || '',
      invoice.department || '',
    ])

    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
    ].join('\n')

    // Create and download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `facturas_pagadas_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast.success(t('toast.invoicesExported', { count: filteredInvoices.length }))
  }

  // Export to ZIP (validated PDFs only, max 50)
  const handleExportZip = async () => {
    if (filteredInvoices.length === 0) {
      toast.error(t('toast.noInvoicesToExport'))
      return
    }

    // Check all have validated_pdf_url first
    const invoicesWithPdf = filteredInvoices.filter((inv) => inv.validated_pdf_url)
    const invoicesWithoutPdf = filteredInvoices.filter((inv) => !inv.validated_pdf_url)

    if (invoicesWithoutPdf.length > 0) {
      const names = invoicesWithoutPdf
        .slice(0, 3)
        .map((inv) => inv.invoice_number)
        .join(', ')
      const moreText =
        invoicesWithoutPdf.length > 3 ? ` y ${invoicesWithoutPdf.length - 3} más` : ''
      toast.error(t('toast.invoicesWithoutPdf', { names: `${names}${moreText}` }))
      return
    }

    // Limit to 50 entries
    const invoicesToExport = invoicesWithPdf.slice(0, 50)
    if (invoicesWithPdf.length > 50) {
      toast(t('toast.downloadFirst50'), {
        icon: '⚠️',
      })
    }

    setIsExportingZip(true)
    try {
      const invoiceIds = invoicesToExport.map((inv) => inv.id)
      const blob = await backofficeApi.downloadValidatedInvoicesZip(invoiceIds)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      a.download = `facturas_pagadas_${timestamp}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(t('toast.invoicesDownloadedZip', { count: invoicesToExport.length }))
    } catch (error: unknown) {
      console.error('[handleExportZip] Error:', error)
      toast.error(error instanceof Error ? error.message : t('toast.downloadError'))
    } finally {
      setIsExportingZip(false)
    }
  }

  // Initialize selectedMonth if not set and we have available months
  if (!selectedMonth && availableMonths.length > 0 && dateFilter === 'specific_month') {
    setSelectedMonth({ year: availableMonths[0].year, month: availableMonths[0].month })
  }

  // Helper to safely parse amount (handles string, number, null, undefined)
  const safeAmount = (value: number | string | null | undefined): number => {
    if (value === null || value === undefined) return 0
    const num = typeof value === 'string' ? parseFloat(value) : value
    return isNaN(num) ? 0 : num
  }

  // Calculate totals for filtered invoices
  const totalMonthFiltered = filteredInvoices.reduce(
    (sum, i) => sum + safeAmount(i.amount_with_vat),
    0
  )
  const byDirectDebit = filteredInvoices
    .filter((i) => i.payment_method === 'direct_debit')
    .reduce((sum, i) => sum + safeAmount(i.amount_with_vat), 0)
  const byTransfer = filteredInvoices
    .filter((i) => i.payment_method === 'transfer')
    .reduce((sum, i) => sum + safeAmount(i.amount_with_vat), 0)

  // Get month label for display
  const selectedMonthLabel = selectedMonth
    ? `${getMonthName(selectedMonth.month)} ${selectedMonth.year}`
    : t('filters.byMonth')

  return (
    <div className="space-y-4">
      {/* Summary - Only show filtered totals (global stats are in the header) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3">
          <p className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">
            {dateFilter === 'specific_month'
              ? t('paid.summary.totalMonth', { month: selectedMonthLabel })
              : t('paid.summary.totalFiltered')}
          </p>
          <p className="text-sm sm:text-base font-bold text-green-600 dark:text-green-400 mt-0.5">
            {formatCurrency(totalMonthFiltered)}
          </p>
        </div>
        <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3">
          <p className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">
            {t('paid.summary.directDebits')}
          </p>
          <p className="text-sm sm:text-base font-bold text-purple-600 dark:text-purple-400 mt-0.5">
            {formatCurrency(byDirectDebit)}
          </p>
        </div>
        <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3">
          <p className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">
            {t('paid.summary.transfers')}
          </p>
          <p className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">
            {formatCurrency(byTransfer)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Search */}
        <div className="relative w-full sm:w-52">
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={t('filters.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 dark:bg-[#151b23] dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        {/* Date Filter Type - wider to fit "Último trimestre" */}
        <select
          value={dateFilter}
          onChange={(e) => {
            const newFilter = e.target.value as typeof dateFilter
            setDateFilter(newFilter)
            // Reset month selection when changing filter type
            if (newFilter === 'specific_month' && availableMonths.length > 0) {
              setSelectedMonth({ year: availableMonths[0].year, month: availableMonths[0].month })
            }
          }}
          className="w-full sm:w-36 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent bg-white dark:bg-[#151b23] dark:text-gray-200"
        >
          <option value="specific_month">{t('filters.byMonth')}</option>
          <option value="quarter">{t('filters.lastQuarter')}</option>
          <option value="year">{t('filters.lastYear')}</option>
          <option value="all">{t('filters.allHistory')}</option>
        </select>

        {/* Month Selector with year grouping (only when "Por Mes" is selected) */}
        {dateFilter === 'specific_month' && availableMonths.length > 0 && (
          <select
            value={selectedMonth ? `${selectedMonth.year}-${selectedMonth.month}` : ''}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-').map(Number)
              setSelectedMonth({ year, month })
            }}
            className="w-full sm:w-48 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent bg-white dark:bg-[#151b23] dark:text-gray-200"
          >
            {(() => {
              // Group months by year
              const groupedByYear = availableMonths.reduce(
                (acc, m) => {
                  if (!acc[m.year]) acc[m.year] = []
                  acc[m.year].push(m)
                  return acc
                },
                {} as Record<number, typeof availableMonths>
              )

              const years = Object.keys(groupedByYear)
                .map(Number)
                .sort((a, b) => b - a)

              return years.map((year) => (
                <optgroup key={year} label={String(year)}>
                  {groupedByYear[year].map((m) => (
                    <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                      {m.monthLabel}
                    </option>
                  ))}
                </optgroup>
              ))
            })()}
          </select>
        )}

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
          }
          className="flex-1 min-w-[240px] px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent bg-white dark:bg-[#151b23] dark:text-gray-200"
        >
          <option value="all">{t('filters.allCategories')}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.cost_center} - {cat.department}
            </option>
          ))}
        </select>

        {/* Payment Method Filter - slightly wider */}
        <select
          value={paymentMethodFilter}
          onChange={(e) =>
            setPaymentMethodFilter(e.target.value as 'all' | 'transfer' | 'direct_debit')
          }
          className="w-full sm:w-36 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent bg-white dark:bg-[#151b23] dark:text-gray-200"
        >
          <option value="all">{t('filters.allPayments')}</option>
          <option value="transfer">{t('filters.transfer')}</option>
          <option value="direct_debit">{t('filters.directDebit')}</option>
        </select>

        {/* Export Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            title={t('actions.csv')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <FiDownload className="w-3.5 h-3.5" />
            {t('actions.csv')}
          </button>
          <button
            onClick={handleExportZip}
            disabled={isExportingZip}
            title={t('actions.zip')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
          >
            <FiPackage className="w-3.5 h-3.5" />
            {isExportingZip ? t('actions.downloading') : t('actions.zip')}
          </button>
        </div>

        {/* Revert Batch Payment */}
        <button
          onClick={handleOpenRevertDialog}
          title={t('actions.reopenMonth')}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium rounded-md hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
        >
          <FiRotateCcw className="w-3.5 h-3.5" />
          {t('actions.reopenMonth')}
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#0d1117] border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('table.supplier')}
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('table.invoiceNumber')}
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('table.invoiceDate')}
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('table.paymentDate')}
                </th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('table.amount')}
                </th>
                <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('table.method')}
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
                    colSpan={8}
                    className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400"
                  >
                    {t('empty.noPaidInvoices')}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const hasPdf = invoice.original_pdf_url || invoice.validated_pdf_url
                  return (
                    <tr
                      key={invoice.id}
                      className="hover:bg-gray-50 dark:hover:bg-[#0d1117] transition-colors"
                    >
                      <td className="px-3 py-2 text-xs font-medium text-gray-900 dark:text-gray-100">
                        {invoice.supplier_name}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 font-mono">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(invoice.invoice_date)}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <FiCalendar className="w-3 h-3 text-green-500" />
                          {formatDate(invoice.paid_date)}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-right font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(invoice.amount_with_vat)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                          {invoice.payment_method === 'transfer'
                            ? t('filters.transfer')
                            : t('filters.directDebit')}
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
                        <button
                          onClick={() => handleOpenPdfViewer(invoice)}
                          disabled={!hasPdf}
                          title={hasPdf ? t('actions.viewPdf') : t('pending.noPdf')}
                          className={`inline-flex items-center justify-center w-7 h-7 rounded transition-colors ${
                            hasPdf
                              ? 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          <FiFileText className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination info and controls */}
        {pagination.total > 0 && (
          <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('pagination.showing', { count: filteredInvoices.length, total: pagination.total })}
              {pagination.totalPages > 1 &&
                ` (${t('pagination.page', { current: pagination.page, total: pagination.totalPages })})`}
            </span>
            {pagination.totalPages > 1 && onPageChange && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft className="w-3.5 h-3.5" />
                  {t('actions.previous')}
                </button>
                <button
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t('actions.next')}
                  <FiChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-2">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('empty.noPaidInvoices')}</p>
          </div>
        ) : (
          filteredInvoices.map((invoice) => {
            const hasPdf = invoice.original_pdf_url || invoice.validated_pdf_url
            return (
              <div
                key={invoice.id}
                className="bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-xs text-gray-900 dark:text-gray-100">
                      {invoice.supplier_name}
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-500 font-mono">
                      {invoice.invoice_number}
                    </p>
                  </div>
                  <span className="font-bold text-xs text-green-600 dark:text-green-400">
                    {formatCurrency(invoice.amount_with_vat)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                  <div>
                    <span className="text-gray-500 dark:text-gray-500">
                      {t('table.invoiceDate')}:
                    </span>
                    <span className="ml-1 text-gray-900 dark:text-gray-100">
                      {formatDate(invoice.invoice_date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-500">
                      {t('table.paymentDate')}:
                    </span>
                    <span className="ml-1 text-gray-900 dark:text-gray-100">
                      {formatDate(invoice.paid_date)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] text-gray-600 dark:text-gray-400">
                    {invoice.cost_center}
                  </span>
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
            )
          })
        )}

        {/* Mobile Pagination */}
        {pagination.total > 0 && pagination.totalPages > 1 && onPageChange && (
          <div className="mt-3 flex items-center justify-between bg-white dark:bg-[#151b23] rounded-md border border-gray-200 dark:border-gray-800 p-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('pagination.page', { current: pagination.page, total: pagination.totalPages })}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FiChevronLeft className="w-3.5 h-3.5" />
                {t('actions.previous')}
              </button>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('actions.next')}
                <FiChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

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

      {/* Revert Batch Payment Dialog */}
      {revertDialogOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => {
              if (!isReverting) {
                setRevertDialogOpen(false)
                setRevertPreview(null)
                setSelectedMonthYear(null)
              }
            }}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white dark:bg-[#151b23] rounded-lg shadow-xl">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {t('modals.revertBatchPayment.title')}
                </h3>

                {/* Month selector */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('modals.revertBatchPayment.selectMonth')}
                  </label>
                  <select
                    value={
                      selectedMonthYear
                        ? `${selectedMonthYear.year}-${selectedMonthYear.month}`
                        : ''
                    }
                    onChange={(e) => {
                      const [year, month] = e.target.value.split('-').map(Number)
                      handleRevertMonthChange(year, month)
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-600 focus:border-transparent bg-white dark:bg-[#0d1117] dark:text-gray-200"
                  >
                    {getAvailableMonths().map((m) => (
                      <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {revertPreview && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md p-4 mb-4">
                    <p className="text-sm text-orange-800 dark:text-orange-300 mb-2">
                      <strong>{t('modals.revertBatchPayment.month')}</strong>{' '}
                      {getMonthName(revertPreview.month)} {revertPreview.year}
                    </p>
                    <p className="text-sm text-orange-800 dark:text-orange-300 mb-2">
                      <strong>{t('modals.revertBatchPayment.paidInvoices')}</strong>{' '}
                      {revertPreview.count}
                    </p>
                    <p className="text-sm text-orange-800 dark:text-orange-300">
                      <strong>{t('modals.revertBatchPayment.totalAmount')}</strong>{' '}
                      {formatCurrency(revertPreview.total_amount)}
                    </p>
                  </div>
                )}

                {revertPreview && revertPreview.count === 0 ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-4">
                    <p className="text-xs text-yellow-800 dark:text-yellow-300">
                      {t('modals.revertBatchPayment.noInvoices')}
                    </p>
                  </div>
                ) : (
                  revertPreview && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-4">
                      <p className="text-xs text-blue-800 dark:text-blue-300">
                        {t('modals.revertBatchPayment.description', {
                          month: getMonthName(revertPreview.month),
                        })}
                      </p>
                    </div>
                  )
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRevertDialogOpen(false)
                      setRevertPreview(null)
                      setSelectedMonthYear(null)
                    }}
                    disabled={isReverting}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {t('actions.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteRevert}
                    disabled={isReverting || !revertPreview || revertPreview.count === 0}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    {isReverting
                      ? t('actions.processing')
                      : t('modals.revertBatchPayment.confirmButton', {
                          count: revertPreview?.count || 0,
                        })}
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

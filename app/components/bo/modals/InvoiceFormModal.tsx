// app/components/bo/modals/InvoiceFormModal.tsx
/**
 * Modal para crear/editar facturas
 * Reutilizable para ambas operaciones
 */

'use client'

import { useState, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { FiX, FiSave, FiLoader } from 'react-icons/fi'
import type {
  InvoiceWithDetails,
  InvoiceFormData,
  Category,
  SupplierWithStats,
  PaymentMethod,
} from '@/app/lib/backoffice/types'
import { applyVat } from '@/app/lib/backoffice/types'
import { backofficeApi } from '@/app/lib/backoffice/backofficeApi'
import DatePickerInput from '@/app/ui/calendar/DatePickerInput'
import toast from 'react-hot-toast'

interface InvoiceFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  invoice?: InvoiceWithDetails | null // Si existe, es edición
  categories: Category[]
  suppliers: SupplierWithStats[]
}

export function InvoiceFormModal({
  isOpen,
  onClose,
  onSuccess,
  invoice,
  categories,
  suppliers,
}: InvoiceFormModalProps) {
  const t = useTranslations('backoffice')
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  // VAT options with translations
  const VAT_OPTIONS = [
    { value: 21, label: t('modals.invoice.vat.general') },
    { value: 10, label: t('modals.invoice.vat.reduced') },
    { value: 4, label: t('modals.invoice.vat.superReduced') },
    { value: 0, label: t('modals.invoice.vat.exempt') },
  ]

  // Form state
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoice_number: '',
    supplier_id: 0,
    category_id: undefined,
    amount_without_vat: 0,
    amount_with_vat: 0,
    vat_percentage: 21,
    invoice_date: new Date().toISOString().split('T')[0],
    received_date: new Date().toISOString().split('T')[0],
    billing_period_start: undefined,
    billing_period_end: undefined,
    due_date: undefined,
    payment_method: 'transfer',
    notes: '',
  })

  // Reset form when modal opens/closes or invoice changes
  useEffect(() => {
    if (isOpen) {
      if (invoice) {
        // Edit mode - populate form
        setFormData({
          invoice_number: invoice.invoice_number,
          supplier_id: invoice.supplier_id,
          category_id: invoice.category_id || undefined,
          amount_without_vat: invoice.amount_without_vat,
          amount_with_vat: invoice.amount_with_vat,
          vat_percentage: invoice.vat_percentage,
          invoice_date: invoice.invoice_date.split('T')[0],
          received_date: invoice.received_date?.split('T')[0] || undefined,
          billing_period_start: invoice.billing_period_start?.split('T')[0] || undefined,
          billing_period_end: invoice.billing_period_end?.split('T')[0] || undefined,
          due_date: invoice.due_date?.split('T')[0] || undefined,
          payment_method: invoice.payment_method,
          notes: invoice.notes || '',
        })
      } else {
        // Create mode - reset form
        setFormData({
          invoice_number: '',
          supplier_id: 0,
          category_id: undefined,
          amount_without_vat: 0,
          amount_with_vat: 0,
          vat_percentage: 21,
          invoice_date: new Date().toISOString().split('T')[0],
          received_date: new Date().toISOString().split('T')[0],
          billing_period_start: undefined,
          billing_period_end: undefined,
          due_date: undefined,
          payment_method: 'transfer',
          notes: '',
        })
      }
      setErrors({})
    }
  }, [isOpen, invoice])

  // Auto-calculate amount with VAT when amount without VAT or VAT percentage changes
  const handleAmountChange = (field: 'amount_without_vat' | 'vat_percentage', value: number) => {
    if (field === 'amount_without_vat') {
      const withVat = applyVat(value, formData.vat_percentage || 21)
      setFormData((prev) => ({
        ...prev,
        amount_without_vat: value,
        amount_with_vat: Math.round(withVat * 100) / 100,
      }))
    } else {
      const withVat = applyVat(formData.amount_without_vat, value)
      setFormData((prev) => ({
        ...prev,
        vat_percentage: value,
        amount_with_vat: Math.round(withVat * 100) / 100,
      }))
    }
  }

  // Auto-fill category when supplier changes
  const handleSupplierChange = (supplierId: number) => {
    const supplier = suppliers.find((s) => s.id === supplierId)
    setFormData((prev) => ({
      ...prev,
      supplier_id: supplierId,
      category_id: supplier?.default_category_id || prev.category_id,
      payment_method: supplier?.payment_method || prev.payment_method,
    }))
  }

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.invoice_number.trim()) {
      newErrors.invoice_number = t('modals.invoice.validation.invoiceNumberRequired')
    }
    if (!formData.supplier_id) {
      newErrors.supplier_id = t('modals.invoice.validation.supplierRequired')
    }
    if (!formData.amount_with_vat || formData.amount_with_vat <= 0) {
      newErrors.amount_with_vat = t('modals.invoice.validation.amountRequired')
    }
    if (!formData.invoice_date) {
      newErrors.invoice_date = t('modals.invoice.validation.dateRequired')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    startTransition(async () => {
      try {
        if (invoice) {
          // Update existing invoice
          await backofficeApi.updateInvoice(invoice.id, formData)
          toast.success(t('toast.invoiceUpdated'))
        } else {
          // Create new invoice
          await backofficeApi.createInvoice(formData)
          toast.success(t('toast.invoiceCreated'))
        }
        onSuccess()
        onClose()
      } catch (error) {
        const message = error instanceof Error ? error.message : t('toast.invoiceSaveError')
        toast.error(message)
      }
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white dark:bg-[#151b23] rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {invoice ? t('modals.invoice.editTitle') : t('modals.invoice.createTitle')}
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Número de factura */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('modals.invoice.fields.invoiceNumber')} *
                </label>
                <input
                  type="text"
                  value={formData.invoice_number}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, invoice_number: e.target.value }))
                  }
                  className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#0d1117] dark:text-gray-200 ${
                    errors.invoice_number
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={t('modals.invoice.placeholders.invoiceNumber')}
                />
                {errors.invoice_number && (
                  <p className="mt-1 text-xs text-red-500">{errors.invoice_number}</p>
                )}
              </div>

              {/* Proveedor */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('modals.invoice.fields.supplier')} *
                </label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => handleSupplierChange(Number(e.target.value))}
                  className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#0d1117] dark:text-gray-200 ${
                    errors.supplier_id
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value={0}>{t('modals.invoice.placeholders.selectSupplier')}</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {errors.supplier_id && (
                  <p className="mt-1 text-xs text-red-500">{errors.supplier_id}</p>
                )}
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('modals.invoice.fields.category')}
                </label>
                <select
                  value={formData.category_id || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category_id: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#0d1117] dark:text-gray-200"
                >
                  <option value="">{t('modals.invoice.placeholders.noCategory')}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.cost_center} - {cat.department}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha factura */}
              <div>
                <DatePickerInput
                  label={t('modals.invoice.fields.invoiceDate')}
                  value={formData.invoice_date}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, invoice_date: value || '' }))
                  }
                  required
                  error={errors.invoice_date}
                  placeholder={t('modals.invoice.placeholders.selectDate')}
                />
              </div>

              {/* Importe sin IVA */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('modals.invoice.fields.amountWithoutVat')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount_without_vat || ''}
                  onChange={(e) =>
                    handleAmountChange('amount_without_vat', parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#0d1117] dark:text-gray-200"
                  placeholder="0.00"
                />
              </div>

              {/* % IVA */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('modals.invoice.fields.vatPercentage')}
                </label>
                <select
                  value={formData.vat_percentage}
                  onChange={(e) => handleAmountChange('vat_percentage', Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#0d1117] dark:text-gray-200"
                >
                  {VAT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Importe con IVA */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('modals.invoice.fields.amountWithVat')} *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount_with_vat || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      amount_with_vat: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#0d1117] dark:text-gray-200 ${
                    errors.amount_with_vat
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="0.00"
                />
                {errors.amount_with_vat && (
                  <p className="mt-1 text-xs text-red-500">{errors.amount_with_vat}</p>
                )}
              </div>

              {/* Método de pago */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('modals.invoice.fields.paymentMethod')}
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      payment_method: e.target.value as PaymentMethod,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#0d1117] dark:text-gray-200"
                >
                  <option value="transfer">{t('modals.invoice.paymentMethods.transfer')}</option>
                  <option value="direct_debit">
                    {t('modals.invoice.paymentMethods.directDebit')}
                  </option>
                </select>
              </div>

              {/* Fecha recepción */}
              <div>
                <DatePickerInput
                  label={t('modals.invoice.fields.receivedDate')}
                  value={formData.received_date}
                  onChange={(value) => setFormData((prev) => ({ ...prev, received_date: value }))}
                  placeholder={t('modals.invoice.placeholders.selectDate')}
                  clearable
                />
              </div>

              {/* Fecha vencimiento */}
              <div>
                <DatePickerInput
                  label={t('modals.invoice.fields.dueDate')}
                  value={formData.due_date}
                  onChange={(value) => setFormData((prev) => ({ ...prev, due_date: value }))}
                  placeholder={t('modals.invoice.placeholders.selectDate')}
                  clearable
                />
              </div>

              {/* Periodo facturación inicio */}
              <div>
                <DatePickerInput
                  label={t('modals.invoice.fields.periodStart')}
                  value={formData.billing_period_start}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, billing_period_start: value }))
                  }
                  placeholder={t('modals.invoice.placeholders.selectDate')}
                  clearable
                />
              </div>

              {/* Periodo facturación fin */}
              <div>
                <DatePickerInput
                  label={t('modals.invoice.fields.periodEnd')}
                  value={formData.billing_period_end}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, billing_period_end: value }))
                  }
                  placeholder={t('modals.invoice.placeholders.selectDate')}
                  minDate={
                    formData.billing_period_start
                      ? new Date(formData.billing_period_start + 'T12:00:00')
                      : null
                  }
                  clearable
                />
              </div>

              {/* Notas - Full width */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('modals.invoice.fields.notes')}
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#0d1117] dark:text-gray-200 resize-none"
                  placeholder={t('modals.invoice.placeholders.notes')}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {t('actions.cancel')}
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    {t('actions.saving')}
                  </>
                ) : (
                  <>
                    <FiSave className="w-4 h-4" />
                    {invoice
                      ? t('modals.invoice.buttons.update')
                      : t('modals.invoice.buttons.create')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

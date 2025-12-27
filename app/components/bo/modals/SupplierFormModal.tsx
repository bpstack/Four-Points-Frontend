// app/components/bo/modals/SupplierFormModal.tsx
/**
 * Modal para crear/editar proveedores
 * Reutilizable para ambas operaciones
 */

'use client'

import { useState, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { FiX, FiSave, FiLoader } from 'react-icons/fi'
import type {
  SupplierWithStats,
  SupplierFormData,
  Category,
  Periodicity,
  PaymentMethod,
} from '@/app/lib/backoffice/types'
import { backofficeApi } from '@/app/lib/backoffice/backofficeApi'
import toast from 'react-hot-toast'

interface SupplierFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  supplier?: SupplierWithStats | null // Si existe, es edición
  categories: Category[]
}

export function SupplierFormModal({
  isOpen,
  onClose,
  onSuccess,
  supplier,
  categories,
}: SupplierFormModalProps) {
  const t = useTranslations('backoffice')
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Periodicity options with translations
  const PERIODICITY_OPTIONS: { value: Periodicity; label: string }[] = [
    { value: 'monthly', label: t('periodicity.monthly') },
    { value: 'bimonthly', label: t('periodicity.bimonthly') },
    { value: 'quarterly', label: t('periodicity.quarterly') },
    { value: 'annual', label: t('periodicity.annual') },
    { value: 'on_demand', label: t('periodicity.onDemand') },
  ]

  // Payment method options with translations
  const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
    { value: 'transfer', label: t('filters.transfer') },
    { value: 'direct_debit', label: t('filters.directDebit') },
  ]

  // Form state
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    cif: '',
    default_category_id: undefined,
    periodicity: 'monthly',
    payment_method: 'transfer',
    bank_account: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  })

  // Reset form when modal opens/closes or supplier changes
  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        // Edit mode - populate form
        setFormData({
          name: supplier.name,
          cif: supplier.cif || '',
          default_category_id: supplier.default_category_id || undefined,
          periodicity: supplier.periodicity,
          payment_method: supplier.payment_method,
          bank_account: supplier.bank_account || '',
          email: supplier.email || '',
          phone: supplier.phone || '',
          address: supplier.address || '',
          notes: supplier.notes || '',
        })
      } else {
        // Create mode - reset form
        setFormData({
          name: '',
          cif: '',
          default_category_id: undefined,
          periodicity: 'monthly',
          payment_method: 'transfer',
          bank_account: '',
          email: '',
          phone: '',
          address: '',
          notes: '',
        })
      }
      setErrors({})
    }
  }, [isOpen, supplier])

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = t('modals.supplier.validation.nameRequired')
    }

    // Validate tax ID format if provided (CIF español o VAT extranjero)
    // Acepta: CIF español (B12345678), VAT europeo (DE123456789, FR12345678901), o genérico (5-20 alfanuméricos)
    if (formData.cif && formData.cif.trim()) {
      const taxIdRegex = /^[A-Za-z0-9]{5,20}$/
      const cleanedTaxId = formData.cif.replace(/[\s.-]/g, '').toUpperCase()
      if (!taxIdRegex.test(cleanedTaxId)) {
        newErrors.cif = t('modals.supplier.validation.cifInvalid')
      }
    }

    // Validate email format if provided
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = t('modals.supplier.validation.emailInvalid')
      }
    }

    // Validate IBAN format if provided (universal format: 2 letters + 2 digits + 11-30 alphanumeric)
    if (formData.bank_account && formData.bank_account.trim()) {
      const ibanRegex = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/
      const cleanedIban = formData.bank_account.replace(/\s/g, '').toUpperCase()
      if (!ibanRegex.test(cleanedIban)) {
        newErrors.bank_account = t('modals.supplier.validation.ibanInvalid')
      }
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
        // Clean up data before sending
        const cleanData: SupplierFormData = {
          name: formData.name.trim(),
          cif: formData.cif?.trim() || undefined,
          default_category_id: formData.default_category_id || undefined,
          periodicity: formData.periodicity,
          payment_method: formData.payment_method,
          bank_account: formData.bank_account?.trim() || undefined,
          email: formData.email?.trim() || undefined,
          phone: formData.phone?.trim() || undefined,
          address: formData.address?.trim() || undefined,
          notes: formData.notes?.trim() || undefined,
        }

        if (supplier) {
          // Update existing supplier
          await backofficeApi.updateSupplier(supplier.id, cleanData)
          toast.success(t('toast.supplierUpdated'))
        } else {
          // Create new supplier
          await backofficeApi.createSupplier(cleanData)
          toast.success(t('toast.supplierCreated'))
        }
        onSuccess()
        onClose()
      } catch (error) {
        const message = error instanceof Error ? error.message : t('toast.supplierSaveError')
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
              {supplier ? t('modals.supplier.editTitle') : t('modals.supplier.createTitle')}
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
              {/* Nombre */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('modals.supplier.fields.name')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#0d1117] dark:text-gray-200 ${
                    errors.name
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={t('modals.supplier.placeholders.name')}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>

              {/* CIF */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('modals.supplier.fields.cif')}
                </label>
                <input
                  type="text"
                  value={formData.cif || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, cif: e.target.value.toUpperCase() }))
                  }
                  className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#0d1117] dark:text-gray-200 ${
                    errors.cif
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={t('modals.supplier.placeholders.cif')}
                  maxLength={9}
                />
                {errors.cif && <p className="mt-1 text-xs text-red-500">{errors.cif}</p>}
              </div>

              {/* Categoría por defecto */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('modals.supplier.fields.defaultCategory')}
                </label>
                <select
                  value={formData.default_category_id || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      default_category_id: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#0d1117] dark:text-gray-200"
                >
                  <option value="">{t('modals.supplier.placeholders.noCategory')}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.cost_center} - {cat.department}
                    </option>
                  ))}
                </select>
              </div>

              {/* Periodicidad */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('modals.supplier.fields.periodicity')}
                </label>
                <select
                  value={formData.periodicity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      periodicity: e.target.value as Periodicity,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#0d1117] dark:text-gray-200"
                >
                  {PERIODICITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Método de pago */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('modals.supplier.fields.paymentMethod')}
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
                  {PAYMENT_METHOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cuenta bancaria (IBAN) */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('modals.supplier.fields.bankAccount')}
                </label>
                <input
                  type="text"
                  value={formData.bank_account || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      bank_account: e.target.value.toUpperCase(),
                    }))
                  }
                  className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#0d1117] dark:text-gray-200 ${
                    errors.bank_account
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={t('modals.supplier.placeholders.bankAccount')}
                />
                {errors.bank_account && (
                  <p className="mt-1 text-xs text-red-500">{errors.bank_account}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('modals.supplier.fields.email')}
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#0d1117] dark:text-gray-200 ${
                    errors.email
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={t('modals.supplier.placeholders.email')}
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('modals.supplier.fields.phone')}
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#0d1117] dark:text-gray-200"
                  placeholder={t('modals.supplier.placeholders.phone')}
                />
              </div>

              {/* Dirección */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('modals.supplier.fields.address')}
                </label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#0d1117] dark:text-gray-200"
                  placeholder={t('modals.supplier.placeholders.address')}
                />
              </div>

              {/* Notas */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('modals.supplier.fields.notes')}
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#0d1117] dark:text-gray-200 resize-none"
                  placeholder={t('modals.supplier.placeholders.notes')}
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
                    {supplier
                      ? t('modals.supplier.buttons.update')
                      : t('modals.supplier.buttons.create')}
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

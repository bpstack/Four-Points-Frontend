// app/components/groups/panels/PaymentPanel.tsx

'use client'

import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FiEdit2, FiCalendar } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'

import { paymentSchema, type PaymentFormData } from '@/app/lib/schemas/group-schemas'
import {
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
  type GroupPayment,
  PaymentStatus,
} from '@/app/lib/groups'
import { useGroupStore } from '@/app/stores/useGroupStore'
import SimpleCalendarCompact from '@/app/ui/calendar/SimpleCalendarCompact'
import { formatDateForInput, formatDateDisplayShort, parseInputDate } from '@/app/lib/helpers/date'
import {
  SlidePanel,
  SlidePanelSection,
  FormField,
  Alert,
  SlidePanelFooterWithDelete,
  SlidePanelFooterButtons,
  inputClassName,
  selectClassName,
  textareaClassName,
} from '@/app/ui/panels'

interface PaymentPanelProps {
  isOpen: boolean
  onClose: () => void
  payment?: GroupPayment
  groupId: number
  totalAmount: number
}

export function PaymentPanel({
  isOpen,
  onClose,
  payment,
  groupId,
  totalAmount,
}: PaymentPanelProps) {
  const t = useTranslations('groups')
  const { currentGroup } = useGroupStore()
  const isEditing = !!payment

  const PAYMENT_ORDER_OPTIONS = [
    { value: 1, label: t('paymentPanel.firstPayment') },
    { value: 2, label: t('paymentPanel.secondPayment') },
    { value: 3, label: t('paymentPanel.thirdPayment') },
    { value: 4, label: t('paymentPanel.fourthPayment') },
    { value: 5, label: t('paymentPanel.fifthPayment') },
    { value: 99, label: t('paymentPanel.finalPayment') },
  ]

  const effectiveGroupId = currentGroup?.id ?? groupId
  const createPaymentMutation = useCreatePayment(effectiveGroupId)
  const updatePaymentMutation = useUpdatePayment(effectiveGroupId, payment?.id)
  const deletePaymentMutation = useDeletePayment(effectiveGroupId, payment?.id)

  // Calendar state
  const [showDueDateCal, setShowDueDateCal] = useState(false)
  const dueDateCalRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: payment
      ? {
          payment_name: payment.payment_name,
          payment_order: payment.payment_order || 1,
          percentage: payment.percentage ?? undefined,
          amount: payment.amount ?? undefined,
          amount_paid: payment.amount_paid ?? undefined,
          due_date: payment.due_date ? payment.due_date.split('T')[0] : '',
          status: payment.status || 'pending',
          notes: payment.notes ?? '',
        }
      : {
          payment_name: '',
          payment_order: 1,
          percentage: undefined,
          amount: undefined,
          amount_paid: undefined,
          due_date: '',
          status: 'pending',
          notes: '',
        },
  })

  const percentage = watch('percentage')
  const due_date = watch('due_date')

  // Reset and load data when payment or isOpen changes
  useEffect(() => {
    if (isOpen && payment) {
      reset({
        payment_name: payment.payment_name,
        payment_order: payment.payment_order || 1,
        percentage: payment.percentage ?? undefined,
        amount: payment.amount ?? undefined,
        amount_paid: payment.amount_paid ?? undefined,
        due_date: payment.due_date ? payment.due_date.split('T')[0] : '',
        status: payment.status || 'pending',
        notes: payment.notes ?? '',
      })
    } else if (isOpen && !payment) {
      reset({
        payment_name: '',
        payment_order: 1,
        percentage: undefined,
        amount: undefined,
        amount_paid: undefined,
        due_date: '',
        status: 'pending',
        notes: '',
      })
    }
    setShowDueDateCal(false)
  }, [isOpen, payment, reset])

  // Auto-calculate amount from percentage
  useEffect(() => {
    if (percentage !== null && percentage !== undefined && totalAmount > 0) {
      const calculatedAmount = (totalAmount * percentage) / 100
      setValue('amount', calculatedAmount)
    }
  }, [percentage, totalAmount, setValue])

  // Click outside to close calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dueDateCalRef.current && !dueDateCalRef.current.contains(event.target as Node)) {
        setShowDueDateCal(false)
      }
    }

    if (showDueDateCal) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDueDateCal])

  const handleDueDateSelect = (date: Date | null) => {
    if (date) {
      setValue('due_date', formatDateForInput(date))
    }
    setShowDueDateCal(false)
  }

  const onSubmit = async (data: PaymentFormData) => {
    try {
      const payload = {
        payment_name: data.payment_name,
        payment_order: data.payment_order,
        percentage: data.percentage ?? undefined,
        amount: data.amount ?? undefined,
        amount_paid: data.amount_paid ?? 0,
        due_date: data.due_date,
        status: data.status as PaymentStatus,
        notes: data.notes || undefined,
      }

      if (!effectiveGroupId) {
        throw new Error(t('paymentPanel.missingGroupId'))
      }

      if (isEditing && payment) {
        await updatePaymentMutation.mutateAsync(payload)
        toast.success(t('paymentPanel.updateSuccess'))
      } else {
        await createPaymentMutation.mutateAsync(payload)
        toast.success(t('paymentPanel.createSuccess'))
      }

      onClose()
    } catch (error) {
      console.error('Error saving payment:', error)
      const message = error instanceof Error ? error.message : t('paymentPanel.error')
      toast.error(message)
    }
  }

  const handleDelete = async () => {
    if (!payment) return

    try {
      await deletePaymentMutation.mutateAsync()
      toast.success(t('paymentPanel.deleteSuccess'))
      onClose()
    } catch (error) {
      console.error('Error deleting payment:', error)
      const message = error instanceof Error ? error.message : t('paymentPanel.deleteError')
      toast.error(message)
    }
  }

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('paymentPanel.editPayment') : t('paymentPanel.newPayment')}
      subtitle={isEditing ? t('paymentPanel.editSubtitle') : t('paymentPanel.subtitle')}
      size="lg"
      headerIcon={
        isEditing ? <FiEdit2 className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : undefined
      }
      footer={
        isEditing ? (
          <SlidePanelFooterWithDelete
            onCancel={onClose}
            onSubmit={handleSubmit(onSubmit)}
            onDelete={handleDelete}
            isSubmitting={
              isSubmitting ||
              updatePaymentMutation.isPending ||
              deletePaymentMutation.isPending ||
              createPaymentMutation.isPending
            }
            submitText={t('paymentPanel.updatePayment')}
            deleteText={t('paymentPanel.deletePayment')}
          />
        ) : (
          <SlidePanelFooterButtons
            onCancel={onClose}
            onSubmit={handleSubmit(onSubmit)}
            isSubmitting={isSubmitting || createPaymentMutation.isPending}
            submitText={t('paymentPanel.createPayment')}
            submitVariant="primary"
          />
        )
      }
    >
      {isEditing && payment && (
        <Alert variant="info" className="mb-4">
          {t('paymentPanel.editing')}{' '}
          {PAYMENT_ORDER_OPTIONS.find((opt) => opt.value === payment.payment_order)?.label ||
            t('paymentPanel.payment')}{' '}
          - {payment.payment_name}
        </Alert>
      )}

      <SlidePanelSection>
        {/* Payment Name */}
        <FormField
          label={t('paymentPanel.paymentName')}
          required
          error={errors.payment_name?.message}
        >
          <input
            {...register('payment_name')}
            type="text"
            placeholder={t('paymentPanel.paymentNamePlaceholder')}
            className={inputClassName}
          />
        </FormField>

        {/* Payment Order */}
        <FormField label={t('paymentPanel.paymentOrder')} error={errors.payment_order?.message}>
          <select
            {...register('payment_order', { valueAsNumber: true })}
            className={selectClassName}
          >
            {PAYMENT_ORDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        {/* Percentage and Amount - Grid */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label={t('paymentPanel.percentage')} error={errors.percentage?.message}>
            <input
              {...register('percentage', {
                setValueAs: (v) => (v === '' ? undefined : parseFloat(v)),
              })}
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="30"
              className={inputClassName}
            />
          </FormField>

          <FormField label={t('paymentPanel.amount')} required error={errors.amount?.message}>
            <input
              {...register('amount', {
                setValueAs: (v) => (v === '' ? undefined : parseFloat(v)),
              })}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className={inputClassName}
            />
          </FormField>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('paymentPanel.percentageHint')}
        </p>

        {/* Amount Paid */}
        <FormField label={t('paymentPanel.amountPaid')} error={errors.amount_paid?.message}>
          <input
            {...register('amount_paid', {
              setValueAs: (v) => (v === '' ? undefined : parseFloat(v)),
            })}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            className={inputClassName}
          />
        </FormField>

        {/* Due Date with Calendar */}
        <div className="relative" ref={dueDateCalRef}>
          <FormField label={t('paymentPanel.dueDate')} required error={errors.due_date?.message}>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={due_date ? formatDateDisplayShort(parseInputDate(due_date)!) : ''}
                placeholder={t('createPanel.selectDate')}
                onClick={() => setShowDueDateCal(!showDueDateCal)}
                className={`${inputClassName} pr-10 cursor-pointer`}
              />
              <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </FormField>
          {showDueDateCal && (
            <div className="absolute z-50 mt-1 right-0">
              <SimpleCalendarCompact
                selectedDate={due_date ? parseInputDate(due_date) : null}
                onSelect={handleDueDateSelect}
                onClose={() => setShowDueDateCal(false)}
              />
            </div>
          )}
        </div>

        {/* Status */}
        <FormField label={t('paymentPanel.paymentStatus')} error={errors.status?.message}>
          <select {...register('status')} className={selectClassName}>
            <option value="pending">{t('paymentPanel.statusPending')}</option>
            <option value="requested">{t('paymentPanel.statusRequested')}</option>
            <option value="partial">{t('paymentPanel.statusPartial')}</option>
            <option value="paid">{t('paymentPanel.statusPaid')}</option>
          </select>
        </FormField>

        {/* Notes */}
        <FormField label={t('paymentPanel.notes')} error={errors.notes?.message}>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder={t('paymentPanel.notesPlaceholder')}
            className={textareaClassName}
          />
        </FormField>
      </SlidePanelSection>
    </SlidePanel>
  )
}

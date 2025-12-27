// app/components/groups/panels/CreateGroupPanel.tsx

'use client'

import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { groupSchema, type GroupFormData } from '@/app/lib/schemas/group-schemas'
import { groupsApi, GroupStatus } from '@/app/lib/groups'
import { FiSave, FiCalendar } from 'react-icons/fi'
import toast from 'react-hot-toast'
import SimpleCalendarCompact from '@/app/ui/calendar/SimpleCalendarCompact'
import { formatDateForInput, formatDateDisplayShort, parseInputDate } from '@/app/lib/helpers/date'
import {
  SlidePanel,
  SlidePanelSection,
  SlidePanelFooterButtons,
  FormField,
  inputClassName,
  selectClassName,
  textareaClassName,
} from '@/app/ui/panels'

interface CreateGroupPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateGroupPanel({ isOpen, onClose }: CreateGroupPanelProps) {
  const t = useTranslations('groups')

  // Calendar state
  const [showArrivalCal, setShowArrivalCal] = useState(false)
  const [showDepartureCal, setShowDepartureCal] = useState(false)
  const arrivalCalRef = useRef<HTMLDivElement>(null)
  const departureCalRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: '',
      agency: '',
      arrival_date: '',
      departure_date: '',
      status: GroupStatus.PENDING,
      total_amount: undefined,
      currency: undefined,
      notes: '',
    },
  })

  const arrivalDate = watch('arrival_date')
  const departureDate = watch('departure_date')

  // Reset form when panel closes
  useEffect(() => {
    if (!isOpen) {
      reset()
      setShowArrivalCal(false)
      setShowDepartureCal(false)
    }
  }, [isOpen, reset])

  // Click outside to close calendars
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (arrivalCalRef.current && !arrivalCalRef.current.contains(event.target as Node)) {
        setShowArrivalCal(false)
      }
      if (departureCalRef.current && !departureCalRef.current.contains(event.target as Node)) {
        setShowDepartureCal(false)
      }
    }

    if (showArrivalCal || showDepartureCal) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showArrivalCal, showDepartureCal])

  const onSubmit = async (data: GroupFormData) => {
    try {
      const payload = {
        name: data.name,
        agency: data.agency || undefined,
        arrival_date: data.arrival_date,
        departure_date: data.departure_date,
        status: data.status,
        total_amount: data.total_amount,
        currency: data.currency || 'EUR',
        notes: data.notes || undefined,
      }

      const response = await groupsApi.create(payload)
      toast.success(t('createPanel.success'))
      window.location.href = `/dashboard/groups/${response.data.id}`
      onClose()
      reset()
    } catch (error) {
      console.error('Error creating group:', error)
      const message = error instanceof Error ? error.message : t('createPanel.error')
      toast.error(message)
    }
  }

  const handleArrivalDateSelect = (date: Date | null) => {
    if (date) {
      setValue('arrival_date', formatDateForInput(date), { shouldValidate: true })
    }
    setShowArrivalCal(false)
  }

  const handleDepartureDateSelect = (date: Date | null) => {
    if (date) {
      setValue('departure_date', formatDateForInput(date), { shouldValidate: true })
    }
    setShowDepartureCal(false)
  }

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={t('createPanel.title')}
      subtitle={t('createPanel.subtitle')}
      size="lg"
      footer={
        <SlidePanelFooterButtons
          onCancel={onClose}
          onSubmit={handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          submitText={t('createPanel.createGroup')}
          submitIcon={<FiSave className="w-4 h-4" />}
          submitVariant="success"
        />
      }
    >
      <SlidePanelSection>
        {/* Name */}
        <FormField label={t('createPanel.groupName')} required error={errors.name?.message}>
          <input
            {...register('name')}
            type="text"
            placeholder={t('createPanel.groupNamePlaceholder')}
            className={inputClassName}
          />
        </FormField>

        {/* Agency */}
        <FormField label={t('createPanel.agency')} error={errors.agency?.message}>
          <input
            {...register('agency')}
            type="text"
            placeholder={t('createPanel.agencyPlaceholder')}
            className={inputClassName}
          />
        </FormField>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Arrival Date */}
          <div className="relative" ref={arrivalCalRef}>
            <FormField
              label={t('createPanel.arrivalDate')}
              required
              error={errors.arrival_date?.message}
            >
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={arrivalDate ? formatDateDisplayShort(parseInputDate(arrivalDate)!) : ''}
                  placeholder={t('createPanel.selectDate')}
                  onClick={() => {
                    setShowArrivalCal(!showArrivalCal)
                    setShowDepartureCal(false)
                  }}
                  className={`${inputClassName} pr-10 cursor-pointer`}
                />
                <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </FormField>
            {showArrivalCal && (
              <div className="absolute z-50 mt-1">
                <SimpleCalendarCompact
                  selectedDate={arrivalDate ? parseInputDate(arrivalDate) : null}
                  onSelect={handleArrivalDateSelect}
                  onClose={() => setShowArrivalCal(false)}
                />
              </div>
            )}
          </div>

          {/* Departure Date */}
          <div className="relative" ref={departureCalRef}>
            <FormField
              label={t('createPanel.departureDate')}
              required
              error={errors.departure_date?.message}
            >
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={
                    departureDate ? formatDateDisplayShort(parseInputDate(departureDate)!) : ''
                  }
                  placeholder={t('createPanel.selectDate')}
                  onClick={() => {
                    setShowDepartureCal(!showDepartureCal)
                    setShowArrivalCal(false)
                  }}
                  className={`${inputClassName} pr-10 cursor-pointer`}
                />
                <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </FormField>
            {showDepartureCal && (
              <div className="absolute z-50 mt-1 right-0">
                <SimpleCalendarCompact
                  selectedDate={departureDate ? parseInputDate(departureDate) : null}
                  onSelect={handleDepartureDateSelect}
                  onClose={() => setShowDepartureCal(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <FormField label={t('createPanel.status')} error={errors.status?.message}>
          <select {...register('status')} className={selectClassName}>
            <option value={GroupStatus.PENDING}>{t('status.pending')}</option>
            <option value={GroupStatus.CONFIRMED}>{t('status.confirmed')}</option>
            <option value={GroupStatus.IN_PROGRESS}>{t('status.in_progress')}</option>
            <option value={GroupStatus.COMPLETED}>{t('status.completed')}</option>
            <option value={GroupStatus.CANCELLED}>{t('status.cancelled')}</option>
          </select>
        </FormField>

        {/* Total Amount */}
        <FormField
          label={t('createPanel.totalAmount')}
          error={errors.total_amount?.message}
          hint={t('createPanel.totalAmountHint')}
        >
          <input
            {...register('total_amount', { valueAsNumber: true })}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            className={inputClassName}
          />
        </FormField>

        {/* Notes */}
        <FormField label={t('createPanel.notes')} error={errors.notes?.message}>
          <textarea
            {...register('notes')}
            rows={4}
            placeholder={t('createPanel.notesPlaceholder')}
            className={textareaClassName}
          />
        </FormField>
      </SlidePanelSection>
    </SlidePanel>
  )
}

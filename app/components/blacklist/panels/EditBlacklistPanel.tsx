// app/components/blacklist/panels/EditBlacklistPanel.tsx

'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { blacklistEditSchema } from '@/app/lib/blacklist/blacklistSchema'
import { blacklistApi } from '@/app/lib/blacklist/blacklistApi'
import { updateBlacklist, deleteBlacklist } from '@/app/dashboard/blacklist/actions'
import { FiSave, FiCalendar, FiUpload, FiTrash2, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import SimpleCalendarCompact from '@/app/ui/calendar/SimpleCalendarCompact'
import { DOCUMENT_TYPES, SEVERITY_LEVELS, BlacklistEntry } from '@/app/lib/blacklist/types'
import {
  SlidePanel,
  SlidePanelSection,
  FormField,
  inputClassName,
  selectClassName,
  textareaClassName,
} from '@/app/ui/panels'

interface EditBlacklistPanelProps {
  isOpen: boolean
  onClose: () => void
  entry: BlacklistEntry
  onSuccess: () => void
}

type BlacklistEditFormValues = {
  guest_name: string
  document_type: 'DNI' | 'PASSPORT' | 'NIE' | 'OTHER'
  document_number: string
  check_in_date: Date
  check_out_date: Date
  reason: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  comments: string
  new_images?: File[]
  existing_images?: string[]
}

export function EditBlacklistPanel({ isOpen, onClose, entry, onSuccess }: EditBlacklistPanelProps) {
  const t = useTranslations('blacklist')
  const router = useRouter()
  const [showCheckInCalendar, setShowCheckInCalendar] = useState(false)
  const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<BlacklistEditFormValues>({
    resolver: zodResolver(blacklistEditSchema),
    defaultValues: {
      guest_name: entry.guest_name,
      document_type: entry.document_type,
      document_number: entry.document_number,
      check_in_date: new Date(entry.check_in_date),
      check_out_date: new Date(entry.check_out_date),
      reason: entry.reason,
      severity: entry.severity,
      comments: entry.comments,
      existing_images: entry.images || [],
      new_images: [],
    },
  })

  const checkInDate = watch('check_in_date')
  const checkOutDate = watch('check_out_date')

  // Close calendars when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.calendar-container')) {
        setShowCheckInCalendar(false)
        setShowCheckOutCalendar(false)
      }
    }

    if (showCheckInCalendar || showCheckOutCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCheckInCalendar, showCheckOutCalendar])

  // Reset form when opening panel
  useEffect(() => {
    if (isOpen) {
      reset({
        guest_name: entry.guest_name,
        document_type: entry.document_type,
        document_number: entry.document_number,
        check_in_date: new Date(entry.check_in_date),
        check_out_date: new Date(entry.check_out_date),
        reason: entry.reason,
        severity: entry.severity,
        comments: entry.comments,
        existing_images: entry.images || [],
        new_images: [],
      })
      setShowCheckInCalendar(false)
      setShowCheckOutCalendar(false)
      setSelectedImages([])
      setShowDeleteConfirm(false)
    }
  }, [isOpen, entry, reset])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const existingCount = entry.images?.length || 0
    if (files.length + existingCount > 5) {
      toast.error(t('form.maxImagesEdit', { count: existingCount }))
      return
    }
    setSelectedImages(files)
    setValue('new_images', files)
  }

  const removeNewImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index)
    setSelectedImages(newImages)
    setValue('new_images', newImages)
  }

  const onSubmit = async (data: BlacklistEditFormValues) => {
    try {
      let imageUrls: string[] = [...(entry.images || [])]

      // Upload new images if any
      if (selectedImages.length > 0) {
        setUploadingImages(true)
        toast.loading(t('messages.uploadingImages'))

        const uploadedImages = await blacklistApi.uploadImages(selectedImages)
        const newImageUrls = uploadedImages.map((img) => img.secure_url)
        imageUrls = [...imageUrls, ...newImageUrls]

        toast.dismiss()
        toast.success(t('messages.newImagesUploaded', { count: newImageUrls.length }))
      }

      setUploadingImages(false)

      // Prepare payload
      const payload = {
        guest_name: data.guest_name,
        document_type: data.document_type,
        document_number: data.document_number,
        check_in_date: data.check_in_date,
        check_out_date: data.check_out_date,
        reason: data.reason,
        severity: data.severity,
        comments: data.comments,
        images: imageUrls,
      }

      toast.loading(t('messages.updatingEntry'))
      const result = await updateBlacklist(entry.id, payload)
      toast.dismiss()

      if (result.success) {
        toast.success(t('messages.updateSuccess'))
        onSuccess()
        onClose()
      } else {
        toast.error(result.error || t('messages.saveError'))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('messages.formError')
      console.error('Error en submit:', message)
      toast.dismiss()
      toast.error(message)
    } finally {
      setUploadingImages(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      toast.loading(t('delete.deleting'))
      const result = await deleteBlacklist(entry.id)
      toast.dismiss()

      if (result.success) {
        toast.success(t('delete.success'))
        onClose()
        router.push('/dashboard/blacklist')
      } else {
        toast.error(result.error || t('delete.error'))
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
      const message = error instanceof Error ? error.message : t('delete.error')
      toast.dismiss()
      toast.error(message)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return ''
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Custom footer with delete functionality
  const renderFooter = () => (
    <div className="flex flex-col gap-3">
      {/* Main action buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting || uploadingImages || isDeleting}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          {t('form.cancel')}
        </button>
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={
            isSubmitting ||
            uploadingImages ||
            isDeleting ||
            (!isDirty && selectedImages.length === 0)
          }
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          {isSubmitting || uploadingImages ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {uploadingImages ? t('form.uploadingImages') : t('panels.updating')}
            </>
          ) : (
            <>
              <FiSave className="w-4 h-4" />
              {t('panels.updateButton')}
            </>
          )}
        </button>
      </div>

      {/* Delete button */}
      <div className="flex justify-center pt-2 border-t border-gray-100 dark:border-gray-800">
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isSubmitting || uploadingImages || isDeleting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:text-red-600 dark:focus:text-red-400 disabled:opacity-50 transition-colors"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
            {t('delete.deleteEntry')}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {t('delete.confirmTitle')}
            </span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isDeleting ? t('delete.deleting') : t('delete.yes')}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 focus:outline-none disabled:opacity-50"
            >
              {t('delete.no')}
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={t('panels.editTitle')}
      subtitle={t('panels.editSubtitle')}
      size="lg"
      footer={renderFooter()}
    >
      {/* Guest Information */}
      <SlidePanelSection title={t('form.guestInfo')}>
        <FormField label={t('form.fullName')} required error={errors.guest_name?.message}>
          <input
            {...register('guest_name')}
            type="text"
            placeholder={t('form.fullNamePlaceholder')}
            className={inputClassName}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label={t('form.documentType')} required error={errors.document_type?.message}>
            <select {...register('document_type')} className={selectClassName}>
              {Object.entries(DOCUMENT_TYPES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label={t('form.documentNumber')}
            required
            error={errors.document_number?.message}
          >
            <input
              {...register('document_number')}
              type="text"
              placeholder={t('form.documentPlaceholder')}
              className={inputClassName}
            />
          </FormField>
        </div>
      </SlidePanelSection>

      {/* Stay Dates */}
      <SlidePanelSection title={t('form.stayDates')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Check-in Date */}
          <div className="relative calendar-container">
            <FormField label={t('form.checkInDate')} required error={errors.check_in_date?.message}>
              <div className="relative">
                <Controller
                  name="check_in_date"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      value={formatDateDisplay(field.value)}
                      readOnly
                      placeholder={t('form.selectDate')}
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowCheckOutCalendar(false)
                        setShowCheckInCalendar(!showCheckInCalendar)
                      }}
                      className={`${inputClassName} pr-8 cursor-pointer`}
                    />
                  )}
                />
                <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </FormField>

            {showCheckInCalendar && (
              <div className="absolute z-50 mt-1" onClick={(e) => e.stopPropagation()}>
                <SimpleCalendarCompact
                  selectedDate={checkInDate || null}
                  onSelect={(date) => {
                    if (date) {
                      setValue('check_in_date', date, { shouldValidate: true })
                    }
                    setShowCheckInCalendar(false)
                  }}
                  onClose={() => setShowCheckInCalendar(false)}
                />
              </div>
            )}
          </div>

          {/* Check-out Date */}
          <div className="relative calendar-container">
            <FormField
              label={t('form.checkOutDate')}
              required
              error={errors.check_out_date?.message}
            >
              <div className="relative">
                <Controller
                  name="check_out_date"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      value={formatDateDisplay(field.value)}
                      readOnly
                      placeholder={t('form.selectDate')}
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowCheckInCalendar(false)
                        setShowCheckOutCalendar(!showCheckOutCalendar)
                      }}
                      className={`${inputClassName} pr-8 cursor-pointer`}
                    />
                  )}
                />
                <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </FormField>

            {showCheckOutCalendar && (
              <div
                className="absolute z-50 mt-1 right-0 sm:right-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <SimpleCalendarCompact
                  selectedDate={checkOutDate || null}
                  onSelect={(date) => {
                    if (date) {
                      setValue('check_out_date', date, { shouldValidate: true })
                    }
                    setShowCheckOutCalendar(false)
                  }}
                  onClose={() => setShowCheckOutCalendar(false)}
                />
              </div>
            )}
          </div>
        </div>
      </SlidePanelSection>

      {/* Incident Details */}
      <SlidePanelSection title={t('form.incidentDetails')}>
        <FormField label={t('form.severityLevel')} required error={errors.severity?.message}>
          <select {...register('severity')} className={selectClassName}>
            {Object.entries(SEVERITY_LEVELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label={t('form.inclusionReason')} required error={errors.reason?.message}>
          <textarea
            {...register('reason')}
            rows={3}
            placeholder={t('form.inclusionReasonPlaceholder')}
            className={textareaClassName}
          />
        </FormField>

        <FormField label={t('form.additionalComments')} required error={errors.comments?.message}>
          <textarea
            {...register('comments')}
            rows={3}
            placeholder={t('form.additionalCommentsPlaceholder')}
            className={textareaClassName}
          />
        </FormField>
      </SlidePanelSection>

      {/* Evidence Photos */}
      <SlidePanelSection title={t('form.photoEvidence')}>
        {/* Existing Images */}
        {entry.images && entry.images.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('form.currentImages')} ({entry.images.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {entry.images.map((url, index) => (
                <div
                  key={index}
                  className="relative w-16 h-16 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Imagen ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Images */}
        <FormField
          label={t('form.addNewImages')}
          hint={t('form.imageHintEdit', { count: 5 - (entry.images?.length || 0) })}
        >
          <div className="flex items-center justify-center w-full">
            <label
              className={`flex flex-col items-center justify-center w-full h-20 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-lg bg-white dark:bg-[#0d1117] transition-colors ${
                (entry.images?.length || 0) >= 5
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-[#161B22]'
              }`}
            >
              <div className="flex flex-col items-center justify-center pt-2 pb-3">
                <FiUpload className="w-5 h-5 mb-1 text-gray-400" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">{t('form.clickToUpload')}</span>
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                disabled={(entry.images?.length || 0) >= 5}
              />
            </label>
          </div>

          {/* New Image Previews */}
          {selectedImages.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {t('form.newImagesSelected', { count: selectedImages.length })}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedImages.map((file, index) => (
                  <div
                    key={index}
                    className="relative w-14 h-14 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <FiX className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </FormField>
      </SlidePanelSection>
    </SlidePanel>
  )
}

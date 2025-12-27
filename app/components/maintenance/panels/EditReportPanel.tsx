// app/components/maintenance/panels/EditReportPanel.tsx

'use client'

import { useEffect, useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { reportSchema, type ReportFormData } from '@/app/lib/maintenance/maintenance-schemas'
import { maintenanceApi } from '@/app/lib/maintenance/maintenanceApi'
import type { ReportWithDetails, MaintenanceImage } from '@/app/lib/maintenance/maintenance'
import { FiSave, FiTool, FiUpload, FiX, FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'
import {
  SlidePanel,
  SlidePanelSection,
  SlidePanelFooterButtons,
  FormField,
  inputClassName,
  selectClassName,
  textareaClassName,
  checkboxClassName,
} from '@/app/ui/panels'

interface EditReportPanelProps {
  isOpen: boolean
  onClose: () => void
  report: ReportWithDetails
  onSuccess?: () => void
}

export function EditReportPanel({ isOpen, onClose, report, onSuccess }: EditReportPanelProps) {
  const t = useTranslations('maintenance')
  // State for new images to upload
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  // State for existing images
  const [existingImages, setExistingImages] = useState<MaintenanceImage[]>([])
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      location_type: report.location_type,
      location_description: report.location_description,
      title: report.title,
      description: report.description,
      priority: report.priority,
      room_number: report.room_number || '',
      room_out_of_service: report.room_out_of_service ?? false,
      assigned_to: report.assigned_to || undefined,
      assigned_type: report.assigned_type || undefined,
      external_company_name: report.external_company_name || '',
      external_contact: report.external_contact || '',
    },
  })

  const locationType = watch('location_type')
  const assignedType = watch('assigned_type')

  // Reset form when report changes or panel opens
  useEffect(() => {
    if (isOpen && report) {
      reset({
        location_type: report.location_type,
        location_description: report.location_description,
        title: report.title,
        description: report.description,
        priority: report.priority,
        room_number: report.room_number || '',
        room_out_of_service: report.room_out_of_service ?? false,
        assigned_to: report.assigned_to || undefined,
        assigned_type: report.assigned_type || undefined,
        external_company_name: report.external_company_name || '',
        external_contact: report.external_contact || '',
      })
      // Load existing images
      setExistingImages(report.images || [])
      // Clear new images
      setPreviewImages([])
      setImageFiles([])
    }
  }, [isOpen, report, reset])

  useEffect(() => {
    if (locationType !== 'room') {
      setValue('room_number', '')
      setValue('room_out_of_service', false)
    }
  }, [locationType, setValue])

  useEffect(() => {
    if (assignedType === 'internal') {
      setValue('external_company_name', '')
      setValue('external_contact', '')
    } else if (assignedType === 'external') {
      setValue('assigned_to', undefined)
    }
  }, [assignedType, setValue])

  // Calculate total images (existing + new)
  const totalImages = existingImages.length + previewImages.length
  const maxImages = 5
  const canAddMoreImages = totalImages < maxImages

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPreviews: string[] = []
    const newFiles: File[] = []

    Array.from(files).forEach((file) => {
      if (totalImages + newPreviews.length >= maxImages) {
        toast.error(t('panels.edit.toast.maxImages', { max: maxImages }))
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('panels.edit.toast.fileTooLarge', { fileName: file.name }))
        return
      }

      newFiles.push(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        newPreviews.push(reader.result as string)
        if (newPreviews.length === newFiles.length) {
          setPreviewImages((prev) =>
            [...prev, ...newPreviews].slice(0, maxImages - existingImages.length)
          )
          setImageFiles((prev) =>
            [...prev, ...newFiles].slice(0, maxImages - existingImages.length)
          )
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeNewImage = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index))
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const deleteExistingImage = async (imageId: number) => {
    try {
      setDeletingImageId(imageId)
      await maintenanceApi.deleteImage(report.id, imageId)
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId))
      toast.success(t('panels.edit.toast.imageDeleted'))
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error(t('panels.edit.toast.imageDeleteError'))
    } finally {
      setDeletingImageId(null)
    }
  }

  const onSubmit: SubmitHandler<ReportFormData> = async (data) => {
    try {
      await maintenanceApi.update(report.id, data)

      // Upload new images if any
      if (imageFiles.length > 0) {
        try {
          toast.loading(t('panels.edit.toast.uploadingImages'), { id: 'upload-images' })
          await maintenanceApi.uploadImages(report.id, imageFiles)
          toast.success(t('panels.edit.toast.imagesUploaded'), { id: 'upload-images' })
        } catch (imgError) {
          console.error('Error subiendo imagenes:', imgError)
          toast.error(t('panels.edit.toast.imagesUploadError'), {
            id: 'upload-images',
          })
        }
      }

      toast.success(t('panels.edit.toast.reportUpdated'))
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error updating report:', error)
      const message = error instanceof Error ? error.message : t('panels.edit.toast.updateError')
      toast.error(message)
    }
  }

  // Check if there are pending changes (form dirty or new images)
  const hasPendingChanges = isDirty || imageFiles.length > 0

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={t('panels.edit.title')}
      subtitle={`ID: ${report.id}`}
      size="lg"
      headerIcon={<FiTool className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
      footer={
        <SlidePanelFooterButtons
          onCancel={onClose}
          onSubmit={handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          submitDisabled={!hasPendingChanges}
          submitText={t('panels.edit.submitText')}
          submitIcon={<FiSave className="w-4 h-4" />}
          submitVariant="primary"
        />
      }
    >
      <SlidePanelSection>
        {/* Location Type */}
        <FormField
          label={t('panels.create.fields.locationType')}
          required
          error={errors.location_type?.message}
        >
          <select {...register('location_type')} className={selectClassName}>
            <option value="room">{t('locationType.room')}</option>
            <option value="common_area">{t('locationType.commonArea')}</option>
            <option value="exterior">{t('locationType.exterior')}</option>
            <option value="facilities">{t('locationType.facilities')}</option>
            <option value="other">{t('locationType.other')}</option>
          </select>
        </FormField>

        {/* Room Number */}
        {locationType === 'room' && (
          <FormField
            label={t('panels.create.fields.roomNumber')}
            required
            error={errors.room_number?.message}
          >
            <input
              {...register('room_number')}
              type="text"
              placeholder={t('panels.create.placeholders.roomNumber')}
              className={inputClassName}
            />
          </FormField>
        )}

        {/* Location Description */}
        <FormField
          label={t('panels.create.fields.locationDescription')}
          required
          error={errors.location_description?.message}
        >
          <input
            {...register('location_description')}
            type="text"
            placeholder={t('panels.create.placeholders.locationDescription')}
            className={inputClassName}
          />
        </FormField>

        {/* Title */}
        <FormField
          label={t('panels.create.fields.reportTitle')}
          required
          error={errors.title?.message}
        >
          <input
            {...register('title')}
            type="text"
            placeholder={t('panels.create.placeholders.reportTitle')}
            className={inputClassName}
          />
        </FormField>

        {/* Description */}
        <FormField
          label={t('panels.create.fields.description')}
          required
          error={errors.description?.message}
        >
          <textarea
            {...register('description')}
            rows={4}
            placeholder={t('panels.create.placeholders.description')}
            className={textareaClassName}
          />
        </FormField>

        {/* Priority */}
        <FormField label={t('panels.create.fields.priority')}>
          <select {...register('priority')} className={selectClassName}>
            <option value="low">{t('priority.low')}</option>
            <option value="medium">{t('priority.medium')}</option>
            <option value="high">{t('priority.high')}</option>
            <option value="urgent">{t('priority.urgent')}</option>
          </select>
        </FormField>

        {/* Room Out of Service */}
        {locationType === 'room' && (
          <div className="flex items-center">
            <input
              {...register('room_out_of_service')}
              type="checkbox"
              className={checkboxClassName}
            />
            <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              {t('panels.create.fields.roomOutOfService')}
            </label>
          </div>
        )}

        {/* Assigned Type */}
        <FormField label={t('panels.create.fields.assignment')}>
          <select {...register('assigned_type')} className={selectClassName}>
            <option value="">{t('panels.create.assignment.unassigned')}</option>
            <option value="internal">{t('panels.create.assignment.internal')}</option>
            <option value="external">{t('panels.create.assignment.external')}</option>
          </select>
        </FormField>

        {/* External Company */}
        {assignedType === 'external' && (
          <>
            <FormField label={t('panels.create.fields.companyName')}>
              <input
                {...register('external_company_name')}
                type="text"
                placeholder={t('panels.create.placeholders.companyName')}
                className={inputClassName}
              />
            </FormField>

            <FormField label={t('panels.create.fields.companyContact')}>
              <input
                {...register('external_contact')}
                type="text"
                placeholder={t('panels.create.placeholders.companyContact')}
                className={inputClassName}
              />
            </FormField>
          </>
        )}

        {/* Existing Images */}
        {existingImages.length > 0 && (
          <FormField label={t('panels.edit.currentImages', { count: existingImages.length })}>
            <div className="grid grid-cols-3 gap-2">
              {existingImages.map((image) => (
                <div key={image.id} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.file_path}
                    alt={image.file_name}
                    className="w-full h-24 object-cover rounded-md border border-gray-300 dark:border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => deleteExistingImage(image.id)}
                    disabled={deletingImageId === image.id}
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    title={t('panels.edit.deleteImageTooltip')}
                  >
                    {deletingImageId === image.id ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FiTrash2 className="w-3 h-3" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </FormField>
        )}

        {/* New Images Upload */}
        <FormField label={t('panels.edit.addImages', { current: totalImages, max: maxImages })}>
          <label
            className={`flex items-center justify-center w-full px-4 py-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-md transition-colors ${
              canAddMoreImages
                ? 'cursor-pointer hover:border-gray-400 dark:hover:border-gray-600'
                : 'cursor-not-allowed opacity-50'
            }`}
          >
            <div className="space-y-1 text-center">
              <FiUpload className="mx-auto h-8 w-8 text-gray-400" />
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {canAddMoreImages ? (
                  <>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {t('panels.create.images.clickToUpload')}
                    </span>{' '}
                    {t('panels.create.images.dragImages')}
                  </>
                ) : (
                  <span>{t('panels.edit.imageLimitReached')}</span>
                )}
              </div>
              <p className="text-[10px] text-gray-500">{t('panels.create.images.formats')}</p>
            </div>
            <input
              type="file"
              className="sr-only"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              disabled={!canAddMoreImages}
            />
          </label>
        </FormField>

        {/* Preview New Images */}
        {previewImages.length > 0 && (
          <FormField label={t('panels.edit.newImages', { count: previewImages.length })}>
            <div className="grid grid-cols-3 gap-2">
              {previewImages.map((preview, index) => (
                <div key={index} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md border-2 border-blue-400 dark:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-1 left-1 px-1 py-0.5 bg-blue-600 text-white text-[8px] rounded">
                    {t('panels.edit.newBadge')}
                  </div>
                </div>
              ))}
            </div>
          </FormField>
        )}
      </SlidePanelSection>
    </SlidePanel>
  )
}

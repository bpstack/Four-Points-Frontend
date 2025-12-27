// app/components/maintenance/panels/CreateReportPanel.tsx

'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { reportSchema, type ReportFormData } from '@/app/lib/maintenance/maintenance-schemas'
import { maintenanceApi } from '@/app/lib/maintenance/maintenanceApi'
import { FiSave, FiUpload, FiX, FiTool } from 'react-icons/fi'
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

interface CreateReportPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateReportPanel({ isOpen, onClose }: CreateReportPanelProps) {
  const t = useTranslations('maintenance')
  const router = useRouter()
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      location_type: 'room',
      location_description: '',
      title: '',
      description: '',
      priority: 'medium',
      room_number: '',
      room_out_of_service: false,
      assigned_to: undefined,
      assigned_type: undefined,
      external_company_name: '',
      external_contact: '',
    },
  })

  const locationType = watch('location_type')
  const assignedType = watch('assigned_type')

  useEffect(() => {
    if (!isOpen) {
      reset()
      setPreviewImages([])
      setImageFiles([])
    }
  }, [isOpen, reset])

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPreviews: string[] = []
    const newFiles: File[] = []

    Array.from(files).forEach((file) => {
      if (previewImages.length + newPreviews.length >= 5) {
        toast.error(t('panels.create.toast.maxImages'))
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('panels.create.toast.fileTooLarge', { fileName: file.name }))
        return
      }

      newFiles.push(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        newPreviews.push(reader.result as string)
        if (newPreviews.length === newFiles.length) {
          setPreviewImages((prev) => [...prev, ...newPreviews].slice(0, 5))
          setImageFiles((prev) => [...prev, ...newFiles].slice(0, 5))
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index))
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: ReportFormData) => {
    try {
      const response = await maintenanceApi.create(data)
      const reportId = response.report.id.toString()

      // Upload images to Cloudinary if any
      if (imageFiles.length > 0) {
        try {
          toast.loading(t('panels.create.toast.uploadingImages'), { id: 'upload-images' })
          await maintenanceApi.uploadImages(reportId, imageFiles)
          toast.success(t('panels.create.toast.imagesUploaded'), { id: 'upload-images' })
        } catch (imgError) {
          console.error('Error subiendo imagenes:', imgError)
          toast.error(t('panels.create.toast.imagesUploadError'), { id: 'upload-images' })
        }
      }

      toast.success(t('panels.create.toast.reportCreated'))
      router.push(`/dashboard/maintenance/${reportId}`)
      onClose()
      reset()
      setPreviewImages([])
      setImageFiles([])
    } catch (error) {
      console.error('Error creating report:', error)
      const message = error instanceof Error ? error.message : t('panels.create.toast.createError')
      toast.error(message)
    }
  }

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={t('panels.create.title')}
      subtitle={t('panels.create.subtitle')}
      size="lg"
      headerIcon={<FiTool className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
      footer={
        <SlidePanelFooterButtons
          onCancel={onClose}
          onSubmit={handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          submitText={t('panels.create.submitText')}
          submitIcon={<FiSave className="w-4 h-4" />}
          submitVariant="success"
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

        {/* Images Upload */}
        <FormField label={t('panels.create.fields.images')}>
          <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-md cursor-pointer hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
            <div className="space-y-1 text-center">
              <FiUpload className="mx-auto h-8 w-8 text-gray-400" />
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {t('panels.create.images.clickToUpload')}
                </span>{' '}
                {t('panels.create.images.dragImages')}
              </div>
              <p className="text-[10px] text-gray-500">{t('panels.create.images.formats')}</p>
            </div>
            <input
              type="file"
              className="sr-only"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              disabled={previewImages.length >= 5}
            />
          </label>
        </FormField>

        {/* Preview Images */}
        {previewImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previewImages.map((preview, index) => (
              <div key={index} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-md border border-gray-300 dark:border-gray-700"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </SlidePanelSection>
    </SlidePanel>
  )
}

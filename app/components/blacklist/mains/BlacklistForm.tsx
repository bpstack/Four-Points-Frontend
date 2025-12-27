// app/dashboard/blacklist/components/mains/BlacklistForm.tsx

'use client'

/**
 * Formulario de Blacklist (crear/editar)
 * - React Hook Form + Zod
 * - Upload de imágenes a Cloudinary
 * - Validación en tiempo real
 * - Estados de loading y errores
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import toast from 'react-hot-toast'
import { Input } from '@/app/components/blacklist/ui/Input'
import { TextArea } from '@/app/components/blacklist/ui/TextArea'
import { Select } from '@/app/components/blacklist/ui/Select'
import { Button } from '@/app/components/blacklist/ui/Button'
import { ImageUploader } from '@/app/components/blacklist/ui/ImageUploader'
import { blacklistSchema } from '@/app/lib/blacklist/blacklistSchema'
import { blacklistApi } from '@/app/lib/blacklist/blacklistApi'
import { createBlacklist, updateBlacklist } from '@/app/dashboard/blacklist/actions'

// ✅ CRÍTICO: Asegúrate de que estos tipos estén importados
import type { BlacklistEntry } from '@/app/lib/blacklist/types'

// Tipo para el formulario (images es opcional para permitir default)
type BlacklistFormValues = {
  guest_name: string
  document_type: 'DNI' | 'PASSPORT' | 'NIE' | 'OTHER'
  document_number: string
  check_in_date: Date
  check_out_date: Date
  reason: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  images?: File[]
  comments: string
}

// ✅ Y también las constantes
import { DOCUMENT_TYPES, SEVERITY_LEVELS } from '@/app/lib/blacklist/types'

interface BlacklistFormProps {
  mode: 'create' | 'edit'
  initialData?: BlacklistEntry
  onSuccess?: () => void
}

export function BlacklistForm({ mode, initialData, onSuccess }: BlacklistFormProps) {
  const t = useTranslations('blacklist')
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)

  // ========================================
  // REACT HOOK FORM - UN SOLO FORMULARIO
  // ========================================
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<BlacklistFormValues>({
    resolver: zodResolver(blacklistSchema),
    defaultValues:
      mode === 'edit' && initialData
        ? {
            guest_name: initialData.guest_name,
            document_type: initialData.document_type,
            document_number: initialData.document_number,
            check_in_date: new Date(initialData.check_in_date),
            check_out_date: new Date(initialData.check_out_date),
            reason: initialData.reason,
            severity: initialData.severity,
            comments: initialData.comments,
            images: [], // Nuevas imágenes en modo edición
          }
        : {
            guest_name: '',
            document_type: 'DNI',
            document_number: '',
            check_in_date: new Date(),
            check_out_date: new Date(),
            reason: '',
            severity: 'MEDIUM',
            comments: '',
            images: [],
          },
  })

  // Watch images for display purposes (currently used in ImageUploader)
  watch('images')

  // ========================================
  // SUBMIT HANDLER
  // ========================================
  const onSubmit = async (data: BlacklistFormValues) => {
    setIsSubmitting(true)

    try {
      let imageUrls: string[] = []
      const formImages = data.images || []

      // 1. MODO CREAR: Subir imágenes si hay
      if (mode === 'create') {
        if (formImages.length > 0) {
          setUploadingImages(true)
          toast.loading(t('messages.uploadingImages'))

          const uploadedImages = await blacklistApi.uploadImages(formImages)
          imageUrls = uploadedImages.map((img) => img.secure_url)

          toast.dismiss()
          toast.success(t('messages.imagesUploaded', { count: imageUrls.length }))
        }
      }
      // 2. MODO EDITAR: Mantener existentes + nuevas
      else {
        // Mantener imágenes existentes
        imageUrls = initialData?.images || []

        // Si hay nuevas imágenes, subirlas
        if (formImages.length > 0) {
          setUploadingImages(true)
          toast.loading(t('messages.uploadingImages'))

          const uploadedImages = await blacklistApi.uploadImages(formImages)
          const newImageUrls = uploadedImages.map((img) => img.secure_url)
          imageUrls = [...imageUrls, ...newImageUrls]

          toast.dismiss()
          toast.success(t('messages.newImagesUploaded', { count: newImageUrls.length }))
        }
      }

      setUploadingImages(false)

      // 3. Preparar payload
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

      // 4. Crear o actualizar
      let result

      if (mode === 'create') {
        toast.loading(t('messages.creatingEntry'))
        result = await createBlacklist(payload)
      } else {
        toast.loading(t('messages.updatingEntry'))
        result = await updateBlacklist(initialData!.id, payload)
      }

      toast.dismiss()

      if (result.success) {
        toast.success(mode === 'create' ? t('messages.createSuccess') : t('messages.updateSuccess'))

        if (onSuccess) {
          onSuccess()
        } else {
          router.push('/dashboard/blacklist')
        }
      } else {
        toast.error(result.error || t('messages.saveError'))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('messages.formError')
      console.error('Error en submit:', message)
      toast.dismiss()
      toast.error(message)
    } finally {
      setIsSubmitting(false)
      setUploadingImages(false)
    }
  }

  const handleCancel = () => {
    if (confirm(t('form.cancelConfirm'))) {
      router.back()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Información del huésped */}
      <div className="bg-gray-50 dark:bg-[#0D1117] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t('form.guestInfo')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label={t('form.fullName')}
              placeholder={t('form.fullNamePlaceholder')}
              {...register('guest_name')}
              error={errors.guest_name?.message}
              required
            />
          </div>

          <Select
            label={t('form.documentType')}
            {...register('document_type')}
            error={errors.document_type?.message}
            options={Object.entries(DOCUMENT_TYPES).map(([value, label]) => ({
              value,
              label,
            }))}
            required
          />

          <Input
            label={t('form.documentNumber')}
            placeholder={t('form.documentPlaceholder')}
            {...register('document_number')}
            error={errors.document_number?.message}
            required
          />
        </div>
      </div>

      {/* Fechas de hospedaje */}
      <div className="bg-gray-100 dark:bg-[#0D1117] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t('form.stayDates')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="check_in_date"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1.5">
                  {t('form.checkInDate')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                  onChange={(e) => field.onChange(new Date(e.target.value))}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#161B22] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm"
                />
                {errors.check_in_date && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {errors.check_in_date.message}
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            name="check_out_date"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1.5">
                  {t('form.checkOutDate')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                  onChange={(e) => field.onChange(new Date(e.target.value))}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#161B22] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm"
                />
                {errors.check_out_date && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {errors.check_out_date.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>
      </div>

      {/* Motivo y gravedad */}
      <div className="bg-gray-50 dark:bg-[#0D1117] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t('form.incidentDetails')}
        </h3>

        <div className="space-y-4">
          <Select
            label={t('form.severityLevel')}
            {...register('severity')}
            error={errors.severity?.message}
            options={Object.entries(SEVERITY_LEVELS).map(([value, label]) => ({
              value,
              label,
            }))}
            required
          />

          <TextArea
            label={t('form.inclusionReasonFull')}
            placeholder={t('form.inclusionReasonPlaceholder')}
            {...register('reason')}
            error={errors.reason?.message}
            rows={4}
            required
          />

          <TextArea
            label={t('form.additionalCommentsReceptionist')}
            placeholder={t('form.additionalCommentsPlaceholder')}
            {...register('comments')}
            error={errors.comments?.message}
            rows={4}
            required
          />
        </div>
      </div>

      {/* Imágenes */}
      <div className="bg-gray-50 dark:bg-[#0D1117] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t('form.photoEvidence')}
        </h3>

        <Controller
          name="images"
          control={control}
          render={({ field }) => (
            <ImageUploader
              label={mode === 'create' ? t('form.uploadImages') : t('form.addNewImages')}
              value={field.value}
              onChange={field.onChange}
              error={errors.images?.message}
              helperText={mode === 'create' ? t('form.uploadHint') : t('form.uploadHintEdit')}
              maxFiles={5}
              maxSizeMB={5}
              required={mode === 'create'}
            />
          )}
        />

        {/* Mostrar imágenes existentes en modo edición */}
        {mode === 'edit' && initialData?.images && initialData.images.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('form.currentImages')} ({initialData.images.length}):
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {initialData.images.map((url, index) => (
                <div
                  key={url}
                  className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Imagen existente ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSubmitting}>
          {t('form.cancel')}
        </Button>

        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting || uploadingImages}
          disabled={isSubmitting || uploadingImages}
        >
          {isSubmitting || uploadingImages
            ? uploadingImages
              ? t('form.uploadingImages')
              : t('form.saving')
            : mode === 'create'
              ? t('form.createEntry')
              : t('form.saveChanges')}
        </Button>
      </div>
    </form>
  )
}

// ✅ Features del BlacklistForm:

// ✅ React Hook Form + Zod - Validación robusta y type-safe
// ✅ Modo create/edit - Reutilizable para crear y editar
// ✅ Campos completos:

// Nombre del huésped
// Tipo y número de documento
// Fechas de hospedaje (date inputs)
// Nivel de gravedad
// Motivo detallado
// Comentarios adicionales
// Upload de imágenes

// ✅ Upload de imágenes:

// Sube a Cloudinary antes de guardar
// Manejo de errores
// Loading states
// Toast notifications

// ✅ Validación en tiempo real - Errores bajo cada campo
// ✅ Estados de loading:

// "Subiendo imágenes..."
// "Guardando..."
// Botones deshabilitados

// ✅ Manejo de errores - Toast notifications con mensajes claros
// ✅ Modo edición:

// Muestra imágenes existentes
// Permite agregar nuevas imágenes
// Pre-llena formulario con datos actuales

// ✅ UX mejorada:

// Confirmación al cancelar
// Redirección automática al éxito
// Callback opcional

// ✅ Responsive - Grid adaptable
// ✅ Dark mode completo
// ✅ Secciones organizadas - Cards por categorías

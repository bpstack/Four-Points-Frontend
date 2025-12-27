// app/components/ui/ImageUploader.tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import { IoCloudUploadOutline, IoClose, IoImageOutline, IoWarning } from 'react-icons/io5'
import { clsx } from 'clsx'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

interface ImageUploaderProps {
  label?: string
  error?: string
  helperText?: string
  maxFiles?: number
  maxSizeMB?: number
  acceptedFormats?: string[]
  value?: File[]
  onChange: (files: File[]) => void
  required?: boolean
}

export function ImageUploader({
  label,
  error,
  helperText,
  maxFiles = 5,
  maxSizeMB = 5,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  value = [],
  onChange,
  required,
}: ImageUploaderProps) {
  const t = useTranslations('blacklist')
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Validar archivo individual
  const validateFile = useCallback(
    (file: File): string | null => {
      // Validar tipo
      if (!acceptedFormats.includes(file.type)) {
        return t('ui.imageUploader.formatNotAllowed', { fileName: file.name })
      }

      // Validar tamaño
      const sizeMB = file.size / (1024 * 1024)
      if (sizeMB > maxSizeMB) {
        return t('ui.imageUploader.exceedsMaxSize', {
          fileName: file.name,
          maxSize: maxSizeMB,
          actualSize: sizeMB.toFixed(2),
        })
      }

      return null
    },
    [acceptedFormats, maxSizeMB, t]
  )

  // Manejar archivos seleccionados
  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      setValidationError(null)

      const filesArray = Array.from(newFiles)

      // Validar cantidad máxima
      if (value.length + filesArray.length > maxFiles) {
        setValidationError(t('ui.imageUploader.maxImagesError', { maxFiles }))
        return
      }

      // Validar cada archivo
      const validFiles: File[] = []
      for (const file of filesArray) {
        const error = validateFile(file)
        if (error) {
          setValidationError(error)
          return
        }
        validFiles.push(file)
      }

      // Agregar archivos válidos
      onChange([...value, ...validFiles])
    },
    [value, maxFiles, onChange, validateFile, t]
  )

  // Evento: Click en botón
  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  // Evento: Input file change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
    // Reset input para permitir seleccionar el mismo archivo
    e.target.value = ''
  }

  // Evento: Drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  // Evento: Drag leave
  const handleDragLeave = () => {
    setIsDragging(false)
  }

  // Evento: Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  // Eliminar imagen
  const handleRemove = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index)
    onChange(newFiles)
    setValidationError(null)
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Label */}
      {label && (
        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        className={clsx(
          'relative flex flex-col items-center justify-center gap-3',
          'border-2 border-dashed rounded-lg p-8',
          'transition-all duration-200 cursor-pointer',
          'bg-gray-50 dark:bg-[#161B22]/50',
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : error || validationError
              ? 'border-red-500 hover:border-red-600'
              : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          multiple
          onChange={handleInputChange}
          className="hidden"
        />

        <IoCloudUploadOutline
          size={48}
          className={clsx(
            'transition-colors',
            isDragging
              ? 'text-blue-500'
              : error || validationError
                ? 'text-red-500'
                : 'text-gray-400'
          )}
        />

        <div className="text-center">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {isDragging ? t('ui.imageUploader.dropImagesHere') : t('ui.imageUploader.dragOrClick')}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {acceptedFormats.map((f) => f.split('/')[1].toUpperCase()).join(', ')} -{' '}
            {t('ui.imageUploader.maxPerFile', { maxSize: maxSizeMB })}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {t('ui.imageUploader.imagesCount', { current: value.length, max: maxFiles })}
          </p>
        </div>
      </div>

      {/* Preview grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {value.map((file, index) => (
            <ImagePreview
              key={`${file.name}-${index}`}
              file={file}
              onRemove={() => handleRemove(index)}
            />
          ))}
        </div>
      )}

      {/* Errors */}
      {(error || validationError) && (
        <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
          <IoWarning size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error || validationError}</span>
        </div>
      )}

      {/* Helper text */}
      {helperText && !error && !validationError && (
        <p className="text-xs text-gray-600 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  )
}

// ========================================
// COMPONENTE: Preview individual
// ========================================

interface ImagePreviewProps {
  file: File
  onRemove: () => void
}

function ImagePreview({ file, onRemove }: ImagePreviewProps) {
  const [preview, setPreview] = useState<string | null>(null)

  // Generar preview
  useState(() => {
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  })

  return (
    <div className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      {preview ? (
        <Image
          src={preview}
          alt={file.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <IoImageOutline size={32} className="text-gray-400" />
        </div>
      )}

      {/* Overlay con nombre y botón eliminar */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200">
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <p className="text-white text-xs font-medium text-center px-2 mb-2 line-clamp-2">
            {file.name}
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            <IoClose size={20} />
          </button>
        </div>
      </div>

      {/* Badge con tamaño del archivo */}
      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
        {(file.size / 1024).toFixed(0)} KB
      </div>
    </div>
  )
}

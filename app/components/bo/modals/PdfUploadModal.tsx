// app/components/bo/modals/PdfUploadModal.tsx
/**
 * Modal para subir PDFs a facturas
 * Permite subir PDF original o validado
 */

'use client'

import { useState, useCallback, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { FiX, FiUpload, FiLoader, FiFile, FiTrash2 } from 'react-icons/fi'
import { backofficeApi } from '@/app/lib/backoffice/backofficeApi'
import toast from 'react-hot-toast'

interface PdfUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  invoiceId: number
  invoiceNumber: string
  type: 'original' | 'validated'
  existingPdfUrl?: string | null
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function PdfUploadModal({
  isOpen,
  onClose,
  onSuccess,
  invoiceId,
  invoiceNumber,
  type,
  existingPdfUrl,
}: PdfUploadModalProps) {
  const t = useTranslations('backoffice')
  const [isPending, startTransition] = useTransition()
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal closes
  const handleClose = () => {
    setFile(null)
    setError(null)
    setDragActive(false)
    onClose()
  }

  // Handle file selection
  const handleFileChange = useCallback(
    (selectedFile: File | null) => {
      setError(null)

      if (!selectedFile) {
        setFile(null)
        return
      }

      // Validate file type
      if (selectedFile.type !== 'application/pdf') {
        setError(t('modals.pdfUpload.errors.onlyPdf'))
        return
      }

      // Validate file size
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError(t('modals.pdfUpload.errors.maxSize'))
        return
      }

      setFile(selectedFile)
    },
    [t]
  )

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileChange(e.dataTransfer.files[0])
      }
    },
    [handleFileChange]
  )

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0])
    }
  }

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError(t('modals.pdfUpload.errors.selectFile'))
      return
    }

    startTransition(async () => {
      try {
        await backofficeApi.uploadInvoicePdf(invoiceId, file, type)
        toast.success(
          type === 'original' ? t('toast.pdfOriginalUploaded') : t('toast.pdfValidatedUploaded')
        )
        onSuccess()
        handleClose()
      } catch (error) {
        const message = error instanceof Error ? error.message : t('toast.pdfUploadError')
        toast.error(message)
      }
    })
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white dark:bg-[#151b23] rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {type === 'original'
                  ? t('modals.pdfUpload.originalTitle')
                  : t('modals.pdfUpload.validatedTitle')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {t('modals.pdfUpload.invoice')} {invoiceNumber}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Existing PDF notice */}
            {existingPdfUrl && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  {type === 'original'
                    ? t('modals.pdfUpload.existingWarning.original')
                    : t('modals.pdfUpload.existingWarning.validated')}
                </p>
              </div>
            )}

            {/* Drop zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : file
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <input
                type="file"
                accept="application/pdf"
                onChange={handleInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {file ? (
                <div className="space-y-2">
                  <FiFile className="w-10 h-10 mx-auto text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px] mx-auto">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                    }}
                    className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <FiTrash2 className="w-3 h-3" />
                    {t('modals.pdfUpload.buttons.remove')}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <FiUpload className="w-10 h-10 mx-auto text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t('modals.pdfUpload.dropzone.drag')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('modals.pdfUpload.dropzone.click')}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {t('modals.pdfUpload.dropzone.maxSize')}
                  </p>
                </div>
              )}
            </div>

            {/* Error */}
            {error && <p className="mt-2 text-xs text-red-500 text-center">{error}</p>}

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {t('actions.cancel')}
              </button>
              <button
                type="submit"
                disabled={isPending || !file}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    {t('actions.uploading')}
                  </>
                ) : (
                  <>
                    <FiUpload className="w-4 h-4" />
                    {t('modals.pdfUpload.buttons.upload')}
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

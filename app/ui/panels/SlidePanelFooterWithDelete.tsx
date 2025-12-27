// app/ui/panels/SlidePanelFooterWithDelete.tsx

'use client'

import { useState } from 'react'
import { FiSave, FiTrash2 } from 'react-icons/fi'
import { useTranslations } from 'next-intl'

interface SlidePanelFooterWithDeleteProps {
  /** Cancel/close handler */
  onCancel: () => void
  /** Submit/save handler */
  onSubmit: () => void
  /** Delete handler (async for loading state) */
  onDelete: () => Promise<void>
  /** Whether form is currently submitting */
  isSubmitting?: boolean
  /** External deleting state (optional, internal state used if not provided) */
  isDeleting?: boolean
  /** Submit button text */
  submitText?: string
  /** Delete confirmation message */
  deleteConfirmText?: string
  /** Disable submit button */
  submitDisabled?: boolean
  /** Cancel button text */
  cancelText?: string
  /** Delete button text */
  deleteText?: string
}

/**
 * Footer component for edit panels with save and delete functionality.
 * Includes inline delete confirmation.
 *
 * @example
 * <SlidePanel
 *   footer={
 *     <SlidePanelFooterWithDelete
 *       onCancel={onClose}
 *       onSubmit={handleSubmit(onSubmit)}
 *       onDelete={handleDelete}
 *       isSubmitting={isSubmitting}
 *       submitDisabled={!isDirty}
 *     />
 *   }
 * >
 *   ...
 * </SlidePanel>
 */
export function SlidePanelFooterWithDelete({
  onCancel,
  onSubmit,
  onDelete,
  isSubmitting = false,
  isDeleting: externalDeleting,
  submitText,
  deleteConfirmText,
  submitDisabled = false,
  cancelText,
  deleteText,
}: SlidePanelFooterWithDeleteProps) {
  const t = useTranslations('common')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [internalDeleting, setInternalDeleting] = useState(false)

  const resolvedSubmitText = submitText ?? t('actions.update')
  const resolvedDeleteConfirmText = deleteConfirmText ?? t('panels.deleteConfirm')
  const resolvedCancelText = cancelText ?? t('actions.cancel')
  const resolvedDeleteText = deleteText ?? t('actions.delete')

  const isDeleting = externalDeleting ?? internalDeleting

  const handleDelete = async () => {
    setInternalDeleting(true)
    try {
      await onDelete()
    } finally {
      setInternalDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const isDisabled = isSubmitting || isDeleting

  return (
    <div className="flex flex-col gap-3">
      {/* Main action buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isDisabled}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          {resolvedCancelText}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isDisabled || submitDisabled}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('actions.saving')}
            </>
          ) : (
            <>
              <FiSave className="w-4 h-4" />
              {resolvedSubmitText}
            </>
          )}
        </button>
      </div>

      {/* Delete section */}
      <div className="flex justify-center pt-2 border-t border-gray-100 dark:border-gray-800">
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDisabled}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:text-red-600 dark:focus:text-red-400 disabled:opacity-50 transition-colors"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
            {resolvedDeleteText}
          </button>
        ) : (
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {resolvedDeleteConfirmText}
            </span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
            >
              {isDeleting ? t('actions.deleting') : t('actions.yes')}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 focus:outline-none disabled:opacity-50 transition-colors"
            >
              {t('actions.no')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

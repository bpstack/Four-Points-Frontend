// app/components/maintenance/shared/ConfirmDialog.tsx
'use client'

import { Fragment } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, Transition } from '@headlessui/react'
import { FiAlertTriangle, FiX } from 'react-icons/fi'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'danger' | 'warning' | 'primary'
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  confirmVariant = 'primary',
  isLoading = false,
}: ConfirmDialogProps) {
  const t = useTranslations('maintenance')

  const resolvedConfirmText = confirmText ?? t('confirm.confirm')
  const resolvedCancelText = cancelText ?? t('confirm.cancel')
  const getConfirmButtonClasses = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white'
      case 'warning':
        return 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 text-white'
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white'
    }
  }

  const getIconColor = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'text-red-600 dark:text-red-400'
      case 'warning':
        return 'text-orange-600 dark:text-orange-400'
      default:
        return 'text-blue-600 dark:text-blue-400'
    }
  }

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 dark:bg-black/60" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-[#151b23] rounded-lg shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full bg-gray-100 dark:bg-gray-800 ${getIconColor()}`}
                  >
                    <FiAlertTriangle className="w-5 h-5" />
                  </div>
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {title}
                  </Dialog.Title>
                </div>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none disabled:opacity-50"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  {resolvedCancelText}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 ${getConfirmButtonClasses()}`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('confirm.processing')}
                    </>
                  ) : (
                    resolvedConfirmText
                  )}
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}

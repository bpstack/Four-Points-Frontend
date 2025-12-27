// app/ui/panels/SlidePanel.tsx

'use client'

import { Fragment, ReactNode } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { FiX, FiCheck } from 'react-icons/fi'
import { cn } from '@/app/lib/helpers/utils'
import { useTranslations } from 'next-intl'

// ===============================================
// TYPES
// ===============================================

export type SlidePanelSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface StepConfig {
  /** Step number (1-based) */
  number: number
  /** Step label */
  label: string
  /** Optional icon */
  icon?: ReactNode
}

export type SlidePanelPosition = 'left' | 'right'

export interface SlidePanelProps {
  /** Whether the panel is open */
  isOpen: boolean
  /** Called when the panel should close */
  onClose: () => void
  /** Panel title */
  title: string
  /** Optional subtitle/description */
  subtitle?: string
  /** Panel size */
  size?: SlidePanelSize
  /** Panel content */
  children: ReactNode
  /** Footer content (buttons, etc.) */
  footer?: ReactNode
  /** Whether to show close button in header */
  showCloseButton?: boolean
  /** Additional class names for the panel */
  className?: string
  /** Whether clicking backdrop closes the panel */
  closeOnBackdrop?: boolean
  /** Step configuration for wizard mode */
  steps?: StepConfig[]
  /** Current step (1-based) for wizard mode */
  currentStep?: number
  /** Header icon */
  headerIcon?: ReactNode
  /** Position of the panel (default: 'right') */
  position?: SlidePanelPosition
}

// ===============================================
// SIZE MAPPINGS
// ===============================================

const sizeClasses: Record<SlidePanelSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg md:max-w-xl lg:max-w-2xl',
  xl: 'max-w-xl md:max-w-2xl lg:max-w-3xl',
  full: 'max-w-full',
}

// ===============================================
// STEP INDICATOR COMPONENT
// ===============================================

interface StepIndicatorProps {
  steps: StepConfig[]
  currentStep: number
  variant?: 'default' | 'compact'
}

export function StepIndicator({ steps, currentStep, variant = 'default' }: StepIndicatorProps) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        {steps.map((step, idx) => (
          <div key={step.number} className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200',
                step.number < currentStep
                  ? 'bg-green-500 text-white'
                  : step.number === currentStep
                    ? 'bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-800'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              )}
            >
              {step.number < currentStep ? <FiCheck className="w-4 h-4" /> : step.number}
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  'w-8 h-0.5 mx-1 transition-all duration-200',
                  step.number < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                )}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, idx) => (
        <div key={step.number} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200',
                step.number < currentStep
                  ? 'bg-green-500 text-white'
                  : step.number === currentStep
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              )}
            >
              {step.number < currentStep ? (
                <FiCheck className="w-5 h-5" />
              ) : (
                step.icon || step.number
              )}
            </div>
            <span
              className={cn(
                'mt-2 text-xs font-medium transition-colors',
                step.number === currentStep
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              )}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={cn(
                'flex-1 h-0.5 mx-4 transition-all duration-200',
                step.number < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ===============================================
// MAIN COMPONENT
// ===============================================

export function SlidePanel({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'lg',
  children,
  footer,
  showCloseButton = true,
  className,
  closeOnBackdrop = true,
  steps,
  currentStep,
  headerIcon,
  position = 'right',
}: SlidePanelProps) {
  const t = useTranslations('common')
  const isWizard = steps && steps.length > 0 && currentStep !== undefined
  const isLeft = position === 'left'

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={closeOnBackdrop ? onClose : () => {}} className="relative z-50">
        {/* Backdrop - reduced opacity for better visibility */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40" aria-hidden="true" />
        </Transition.Child>

        {/* Panel container */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div
              className={cn(
                'pointer-events-none fixed inset-y-0 flex max-w-full',
                isLeft ? 'left-0 pr-10' : 'right-0 pl-10'
              )}
            >
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom={isLeft ? '-translate-x-full' : 'translate-x-full'}
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo={isLeft ? '-translate-x-full' : 'translate-x-full'}
              >
                <Dialog.Panel
                  className={cn('pointer-events-auto w-screen', sizeClasses[size], className)}
                >
                  <div className="flex h-full flex-col bg-white dark:bg-[#151b23] shadow-xl">
                    {/* Header */}
                    <div className="px-4 py-6 sm:px-6 border-b border-gray-200 dark:border-gray-800">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {headerIcon && (
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                              {headerIcon}
                            </div>
                          )}
                          <div>
                            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {title}
                            </Dialog.Title>
                            {subtitle && (
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                        {showCloseButton && (
                          <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            <span className="sr-only">{t('panels.closePanel')}</span>
                            <FiX className="h-6 w-6" />
                          </button>
                        )}
                      </div>

                      {/* Step indicator for wizard mode */}
                      {isWizard && (
                        <div className="mt-6">
                          <StepIndicator steps={steps} currentStep={currentStep} />
                        </div>
                      )}
                    </div>

                    {/* Body - scrollable */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">{children}</div>

                    {/* Footer - fixed at bottom */}
                    {footer && (
                      <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-4 sm:px-6">
                        {footer}
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

// ===============================================
// SUB-COMPONENTS
// ===============================================

interface SlidePanelSectionProps {
  children: ReactNode
  className?: string
  title?: string
}

/** Section within panel body */
export function SlidePanelSection({ children, className, title }: SlidePanelSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {title && (
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}

interface SlidePanelFooterButtonsProps {
  onCancel: () => void
  onSubmit?: () => void
  cancelText?: string
  submitText?: string
  submitIcon?: ReactNode
  isSubmitting?: boolean
  submitDisabled?: boolean
  submitVariant?: 'primary' | 'success' | 'danger'
  /** For wizard: show back button */
  onBack?: () => void
  backText?: string
  /** Extra content on the left side */
  leftContent?: ReactNode
}

/** Pre-styled footer buttons */
export function SlidePanelFooterButtons({
  onCancel,
  onSubmit,
  cancelText,
  submitText,
  submitIcon,
  isSubmitting = false,
  submitDisabled = false,
  submitVariant = 'success',
  onBack,
  backText,
  leftContent,
}: SlidePanelFooterButtonsProps) {
  const t = useTranslations('common')
  const resolvedCancelText = cancelText ?? t('actions.cancel')
  const resolvedSubmitText = submitText ?? t('actions.save')
  const resolvedBackText = backText ?? t('actions.back')

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  }

  return (
    <div className="flex items-center justify-between">
      <div>{leftContent}</div>
      <div className="flex gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {resolvedBackText}
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          {resolvedCancelText}
        </button>
        {onSubmit && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || submitDisabled}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors',
              variantClasses[submitVariant]
            )}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('actions.saving')}
              </>
            ) : (
              <>
                {submitIcon}
                {resolvedSubmitText}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ===============================================
// FORM INPUT HELPERS
// ===============================================

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
  hint?: string
  className?: string
}

/** Consistent form field wrapper */
export function FormField({ label, required, error, children, hint, className }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

/** Consistent text input styling */
export const inputClassName =
  'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

/** Consistent select styling */
export const selectClassName = inputClassName

/** Consistent textarea styling */
export const textareaClassName = cn(inputClassName, 'resize-none')

/** Consistent checkbox styling */
export const checkboxClassName =
  'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#0d1117]'

// ===============================================
// ALERT COMPONENTS
// ===============================================

interface AlertProps {
  children: ReactNode
  variant: 'info' | 'warning' | 'error' | 'success'
  className?: string
}

export function Alert({ children, variant, className }: AlertProps) {
  const variants = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-400',
    warning:
      'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-400',
    error:
      'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400',
    success:
      'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-400',
  }

  return (
    <div className={cn('rounded-md border p-3 text-sm', variants[variant], className)}>
      {children}
    </div>
  )
}

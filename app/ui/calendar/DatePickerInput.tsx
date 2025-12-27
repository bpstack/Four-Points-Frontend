// app/ui/calendar/DatePickerInput.tsx
/**
 * Input de fecha con calendario desplegable personalizado
 * Usa SimpleCalendarCompact para una experiencia consistente
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { FiCalendar, FiX } from 'react-icons/fi'
import SimpleCalendarCompact from './SimpleCalendarCompact'
import { useTranslations } from 'next-intl'

interface DatePickerInputProps {
  value?: string // formato YYYY-MM-DD
  onChange: (value: string | undefined) => void
  label?: string
  placeholder?: string
  required?: boolean
  error?: string
  minDate?: Date | null
  disabled?: boolean
  clearable?: boolean
  className?: string
  size?: 'sm' | 'md' // sm para filtros, md por defecto
}

export default function DatePickerInput({
  value,
  onChange,
  label,
  placeholder,
  required = false,
  error,
  minDate,
  disabled = false,
  clearable = true,
  className = '',
  size = 'md',
}: DatePickerInputProps) {
  const t = useTranslations('common')
  const [isOpen, setIsOpen] = useState(false)
  const [alignRight, setAlignRight] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const defaultPlaceholder = placeholder ?? t('calendar.selectDate')

  // Convertir string YYYY-MM-DD a Date
  const selectedDate = value ? new Date(value + 'T12:00:00') : null

  // Formatear fecha para mostrar (DD/MM/YYYY)
  const formatDisplayDate = (dateStr: string | undefined): string => {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }

  // Manejar selección de fecha
  const handleSelect = (date: Date | null) => {
    if (date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      onChange(`${year}-${month}-${day}`)
    } else {
      onChange(undefined)
    }
    setIsOpen(false)
  }

  // Limpiar fecha
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(undefined)
  }

  // Calcular si el calendario debe alinearse a la derecha
  const handleOpen = () => {
    if (disabled) return

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const calendarWidth = 224 // w-56 = 14rem = 224px
      const spaceOnRight = window.innerWidth - rect.left

      // Si no hay espacio suficiente a la derecha, alinear a la derecha
      setAlignRight(spaceOnRight < calendarWidth + 16) // 16px de margen
    }

    setIsOpen(!isOpen)
  }

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label} {required && '*'}
        </label>
      )}

      <div ref={containerRef} className="relative">
        {/* Input button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          className={`
            w-full text-left border rounded-md 
            focus:outline-none focus:ring-2 focus:ring-blue-500
            bg-white dark:bg-[#151b23] dark:text-gray-200 
            flex items-center justify-between gap-2
            ${size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3 py-2 text-sm'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${
              error
                ? 'border-red-500 dark:border-red-500'
                : value
                  ? 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
            }
          `}
        >
          <span
            className={
              value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
            }
          >
            {value ? formatDisplayDate(value) : defaultPlaceholder}
          </span>

          <div className="flex items-center gap-1">
            {clearable && value && !disabled && (
              <span
                role="button"
                onClick={handleClear}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <FiX
                  className={size === 'sm' ? 'w-3 h-3 text-gray-400' : 'w-3.5 h-3.5 text-gray-400'}
                />
              </span>
            )}
            <FiCalendar
              className={size === 'sm' ? 'w-3.5 h-3.5 text-gray-400' : 'w-4 h-4 text-gray-400'}
            />
          </div>
        </button>

        {/* Calendar dropdown */}
        {isOpen && (
          <div className={`absolute z-50 mt-1 ${alignRight ? 'right-0' : 'left-0'}`}>
            <SimpleCalendarCompact
              selectedDate={selectedDate}
              onSelect={handleSelect}
              onClose={() => setIsOpen(false)}
              minDate={minDate}
            />
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

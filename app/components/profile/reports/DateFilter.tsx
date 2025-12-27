// app/components/profile/reports/DateFilter.tsx

'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { FiCalendar, FiX } from 'react-icons/fi'
import SimpleCalendar from '@/app/ui/calendar/simplecalendar'

interface DateFilterProps {
  selectedDate: string | null // YYYY-MM-DD format
  onDateChange: (date: string | null) => void
  label?: string
}

export default function DateFilter({ selectedDate, onDateChange, label }: DateFilterProps) {
  const t = useTranslations('profile.reports.common')
  const locale = useLocale()
  const [showCalendar, setShowCalendar] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const defaultLabel = label || t('filterByDate')

  // Close calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowCalendar(false)
      }
    }

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCalendar])

  // Parse selected date to Date object
  const parsedDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : null

  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  // Handle date selection from calendar
  const handleSelectDate = (date: Date | null | undefined) => {
    if (date) {
      // Convert to YYYY-MM-DD format
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      onDateChange(`${year}-${month}-${day}`)
    } else {
      onDateChange(null)
    }
    setShowCalendar(false)
  }

  // Clear date filter
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDateChange(null)
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <div className="inline-flex items-center gap-1">
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className={`
            inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors
            ${
              selectedDate
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-r-none border-r-0'
                : 'bg-white dark:bg-[#21262d] border-gray-300 dark:border-[#30363d] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#30363d]'
            }
          `}
        >
          <FiCalendar className="w-4 h-4" />
          <span>{selectedDate ? formatDisplayDate(selectedDate) : defaultLabel}</span>
        </button>
        {selectedDate && (
          <button
            onClick={handleClear}
            className="p-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 border-l-0 rounded-r-lg text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
          >
            <FiX className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Calendar Dropdown */}
      {showCalendar && (
        <div className="absolute z-50 mt-2 left-0">
          <SimpleCalendar
            selectedDate={parsedDate}
            onSelect={handleSelectDate}
            onClose={() => setShowCalendar(false)}
          />
        </div>
      )}
    </div>
  )
}

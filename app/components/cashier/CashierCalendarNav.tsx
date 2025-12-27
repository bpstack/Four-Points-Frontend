// app/components/cashier/CashierCalendarNav.tsx
'use client'

import { useTranslations } from 'next-intl'
import { FiChevronLeft, FiChevronRight, FiCalendar } from 'react-icons/fi'

interface CashierCalendarNavProps {
  currentMonth: string
  currentYear: number
  selectedDate: string
  username: string | undefined
  onPreviousMonth: () => void
  onNextMonth: () => void
  onToday: () => void
}

export default function CashierCalendarNav({
  currentMonth,
  currentYear,
  selectedDate,
  username,
  onPreviousMonth,
  onNextMonth,
  onToday,
}: CashierCalendarNavProps) {
  const t = useTranslations('cashier')

  return (
    <div className="sticky top-0 z-30 bg-white dark:bg-[#010409] shadow-sm">
      <div className="px-3 py-2 md:px-4 md:py-3 border-b border-gray-200 dark:border-gray-800">
        {/* Desktop */}
        <div className="hidden md:flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-56 flex-shrink-0">
              <h1 className="text-base font-semibold text-gray-900 dark:text-white capitalize truncate">
                {currentMonth} {currentYear}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onPreviousMonth}
                className="p-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onNextMonth}
                className="p-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onToday}
              className="ml-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
            >
              <FiCalendar className="w-4 h-4" /> {t('calendar.today')}
            </button>

            <div className="ml-4 text-sm text-gray-700 dark:text-gray-400 flex-shrink-0">
              {t('calendar.user')}:{' '}
              <span className="font-medium text-gray-900 dark:text-gray-200">
                {username || 'N/A'}
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t('calendar.date')}: {selectedDate}
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <h1 className="text-base font-semibold text-gray-900 dark:text-white capitalize whitespace-nowrap w-20">
              {currentMonth.slice(0, 3)} {currentYear}
            </h1>
            <button
              onClick={onPreviousMonth}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNextMonth}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onToday}
            className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            {t('calendar.today')}
          </button>
        </div>
      </div>
    </div>
  )
}

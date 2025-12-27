// app/components/logbooks/LogbooksContainer.tsx
'use client'

import { useState, useMemo } from 'react'
import { FiChevronLeft, FiChevronRight, FiCalendar, FiPlus } from 'react-icons/fi'
import { useLogbooks, type LogbookMessages } from '@/app/lib/logbooks/hooks/useLogbooks'
import { useAuth } from '@/app/lib/auth/useAuth'
import HorizontalDatePicker from '@/app/ui/calendar/HorizontalDatePicker'
import LogbooksList from './LogbooksList'
import NewLogbookEntry from './NewLogbookEntry'
import { useLocale, useTranslations } from 'next-intl'

export default function LogbooksContainer() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date().getDate())
  const [showNewEntryModal, setShowNewEntryModal] = useState(false)
  const { user } = useAuth()
  const t = useTranslations('logbooks')
  const tLogbook = useTranslations('logbook')
  const locale = useLocale()

  // Memoize messages for the hook
  const messages: LogbookMessages = useMemo(
    () => ({
      entryCreated: tLogbook('toast.entryCreated'),
      entryCreateError: tLogbook('toast.entryCreateError'),
      entryUpdated: tLogbook('toast.entryUpdated'),
      entryUpdateError: tLogbook('toast.entryUpdateError'),
      entryDeleted: tLogbook('toast.entryDeleted'),
      entryDeleteError: tLogbook('toast.entryDeleteError'),
      statusResolved: tLogbook('toast.statusResolved'),
      statusPending: tLogbook('toast.statusPending'),
      statusChangedTo: (status: string) => tLogbook('toast.statusChangedTo', { status }),
      statusChangeError: tLogbook('toast.statusChangeError'),
      markedAsRead: tLogbook('toast.markedAsRead'),
      unmarkedAsRead: tLogbook('toast.unmarkedAsRead'),
      readStatusError: tLogbook('toast.readStatusError'),
      commentAdded: tLogbook('toast.commentAdded'),
      commentAddError: tLogbook('toast.commentAddError'),
      commentUpdated: tLogbook('toast.commentUpdated'),
      commentUpdateError: tLogbook('toast.commentUpdateError'),
      commentDeleted: tLogbook('toast.commentDeleted'),
      commentDeleteError: tLogbook('toast.commentDeleteError'),
    }),
    [tLogbook]
  )

  const currentMonth = currentDate.toLocaleString(locale, { month: 'long' })
  const currentYear = currentDate.getFullYear()

  // Build date string for the query
  const dateString = useMemo(() => {
    const month = currentDate.getMonth() + 1
    return `${currentYear}-${String(month).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
  }, [currentYear, currentDate, selectedDay])

  // Use React Query hook
  const {
    entries,
    isLoading,
    createLogbook,
    updateLogbook,
    deleteLogbook,
    toggleStatus,
    toggleRead,
    createComment,
    updateComment,
    deleteComment,
    useReaders,
  } = useLogbooks({ date: dateString, messages })

  const handleSubmitNewEntry = async (payload: {
    message: string
    date: string
    importance_level: 'baja' | 'media' | 'alta' | 'urgente'
    department_id: number
  }) => {
    if (!user) {
      console.error('No user available')
      return
    }

    await createLogbook.mutateAsync({
      author_id: user.id,
      message: payload.message,
      importance_level: payload.importance_level,
      department_id: payload.department_id,
      date: payload.date,
    })

    const [year, month, day] = payload.date.split('-').map(Number)
    setShowNewEntryModal(false)
    const entryDate = new Date(year, month - 1, day)
    setCurrentDate(entryDate)
    setSelectedDay(day)
  }

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentDate(newDate)
    setSelectedDay(1)
  }

  const goToNextMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentDate(newDate)
    setSelectedDay(1)
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDay(today.getDate())
  }

  const handleSelectDay = (day: number) => {
    setSelectedDay(day)
  }

  const orderedEntries = useMemo(
    () =>
      [...entries].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
    [entries]
  )

  const dayStatusMessage = isLoading
    ? t('list.loading')
    : entries.length === 0
      ? t('list.empty')
      : ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-[#010409] shadow-sm">
        <div className="px-3 py-2 md:px-4 md:py-3 border-b border-gray-200 dark:border-gray-800">
          {/* Desktop */}
          <div className="hidden md:flex items-center gap-3 justify-between max-w-[1600px]">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-56 flex-shrink-0">
                <h1 className="text-base font-semibold text-gray-900 dark:text-white capitalize truncate">
                  {currentMonth} {currentYear}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={goToNextMonth}
                  className="p-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={goToToday}
                className="ml-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
              >
                <FiCalendar className="w-4 h-4" /> {t('container.today')}
              </button>
              <div className="ml-4 flex items-center gap-4 text-sm text-gray-700 dark:text-gray-400 flex-shrink-0">
                <span>{t('container.dailyEntries', { count: orderedEntries.length })}</span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  {t('container.lastUpdate')}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowNewEntryModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors"
            >
              <FiPlus className="w-4 h-4" /> {t('container.newEntry')}
            </button>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                {currentMonth.slice(0, 3)} {currentYear}
              </h1>
              <div className="flex items-center">
                <button
                  onClick={goToPreviousMonth}
                  className="p-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={goToNextMonth}
                  className="p-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Acciones: Hoy + Nueva */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={goToToday}
                className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              >
                {t('container.today')}
              </button>
              <button
                onClick={() => setShowNewEntryModal(true)}
                className="p-1.5 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Date Picker */}
      <div className="sticky top-[64px] z-30">
        <HorizontalDatePicker
          currentDate={currentDate}
          selectedDay={selectedDay}
          onSelectDay={handleSelectDay}
          locale="en-US"
        />
      </div>

      {/* Logbooks List */}
      <LogbooksList
        entries={orderedEntries}
        dayStatusMessage={dayStatusMessage}
        mutations={{
          updateLogbook,
          deleteLogbook,
          toggleStatus,
          toggleRead,
          createComment,
          updateComment,
          deleteComment,
        }}
        useReaders={useReaders}
      />

      {/* New Entry Modal */}
      {showNewEntryModal && (
        <NewLogbookEntry
          isOpen={showNewEntryModal}
          onClose={() => setShowNewEntryModal(false)}
          onSubmit={handleSubmitNewEntry}
          defaultDate={dateString}
          title={t('modals.newEntry.title')}
        />
      )}
    </div>
  )
}

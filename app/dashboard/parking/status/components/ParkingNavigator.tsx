//NUNCA BORRAR ESTOS COMENTARIOS PORQUE SIRVEN DE GUÍA PARA REFACTORIZAR LOS DEMÁS ARCHIVOS
//PASO 1: Layout como Server Component -> app/dashboard/parking/layout.tsx
//PASO 2: Navegador como Client Component separado

// app/dashboard/parking/status/components/ParkingNavigator.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { FiChevronLeft, FiChevronRight, FiCalendar, FiPlus } from 'react-icons/fi'
import { MdLocalParking } from 'react-icons/md'
import Link from 'next/link'
import HorizontalDatePicker from '@/app/ui/calendar/HorizontalDatePicker'

const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ParkingNavigator() {
  const t = useTranslations('parking')
  const router = useRouter()
  const searchParams = useSearchParams()

  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [isClient, setIsClient] = useState(false)
  const isInitialMount = useRef(true)

  const selectedLevel = searchParams?.get('level') || 'all'

  // Inicialización del cliente - solo ejecutar una vez al montar
  // searchParams intentionally excluded - we only want to read it once on mount
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    setIsClient(true)
    const dateFromUrl = searchParams?.get('date')
    if (dateFromUrl) {
      const [year, month, day] = dateFromUrl.split('-').map(Number)
      setCurrentDate(new Date(year, month - 1, day))
      setSelectedDay(day)
    } else {
      const today = new Date()
      setCurrentDate(today)
      setSelectedDay(today.getDate())
    }
  }, [])
  /* eslint-enable react-hooks/exhaustive-deps */

  // Actualizar URL cuando cambia la fecha o día seleccionado (pero no en el primer render)
  useEffect(() => {
    if (!isClient || !currentDate || selectedDay === null) return

    // Saltar la primera ejecución para evitar push innecesario
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    const dateStr = getLocalDateString(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay)
    )
    const currentLevel = searchParams?.get('level') || 'all'
    router.push(`?date=${dateStr}&level=${currentLevel}`, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, selectedDay]) // Solo depender de currentDate y selectedDay

  if (!isClient || !currentDate || selectedDay === null) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-gray-500 dark:text-gray-400">{t('statusPageNav.loadingCalendar')}</div>
      </div>
    )
  }

  const currentMonth = currentDate.toLocaleString('es-ES', { month: 'long' })
  const currentYear = currentDate.getFullYear()

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

  const selectDay = (day: number) => {
    setSelectedDay(day)
  }

  const selectLevel = (level: string) => {
    const dateStr = searchParams?.get('date') || getLocalDateString()
    router.push(`?date=${dateStr}&level=${level}`, { scroll: false })
  }

  return (
    <>
      {/* Header sticky principal */}
      <div className="sticky top-0 z-40 bg-white dark:bg-[#010409] shadow-sm">
        <div className="px-3 py-2 md:px-4 md:py-3 border-b border-gray-200 dark:border-gray-800">
          {/* Desktop */}
          <div className="hidden md:flex items-center gap-3 justify-between max-w-[1400px]">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                  <MdLocalParking className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h1 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t('statusPageNav.title')}
                </h1>
              </div>

              <div className="w-56 flex-shrink-0">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white capitalize truncate">
                  {currentMonth} {currentYear}
                </h2>
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
                <FiCalendar className="w-4 h-4" /> {t('statusPageNav.today')}
              </button>

              {/* Filtros de nivel */}
              <div className="flex items-center gap-2 ml-3 pl-3 border-l border-gray-300 dark:border-gray-700">
                {['all', '-2', '-3'].map((level) => (
                  <button
                    key={`desktop-level-${level}`}
                    onClick={() => selectLevel(level)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      selectedLevel === level
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {level === 'all'
                      ? t('statusPageNav.allLevels')
                      : t('statusPageNav.level', { level: level.replace('-', '') })}
                  </button>
                ))}
              </div>
            </div>

            <Link href="/dashboard/parking/bookings/new">
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors">
                <FiPlus className="w-4 h-4" /> {t('statusPageNav.newBooking')}
              </button>
            </Link>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-2">
            {/* Fila 1: Icono + Mes + Navegación mes */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                  <MdLocalParking className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
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
                  {t('statusPageNav.today')}
                </button>
                <Link href="/dashboard/parking/bookings/new">
                  <button className="p-1.5 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors">
                    <FiPlus className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Fila 2: Filtros de nivel */}
            <div className="flex items-center gap-1.5">
              {['all', '-2', '-3'].map((level) => (
                <button
                  key={`mobile-level-${level}`}
                  onClick={() => selectLevel(level)}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    selectedLevel === level
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {level === 'all'
                    ? t('statusPageNav.allLevelsMobile')
                    : t('statusPageNav.level', { level: level.replace('-', '') })}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Paginación sticky - Selector de días */}
      {/* Mobile: ~88px (header compacto), Desktop: ~64px (single row) */}
      <div className="sticky top-[88px] md:top-[64px] z-30">
        <HorizontalDatePicker
          currentDate={currentDate}
          selectedDay={selectedDay}
          onSelectDay={selectDay}
          locale="es-ES"
        />
      </div>
    </>
  )
}

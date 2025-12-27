// app/components/parking/VehicleSearchModal.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { FiSearch, FiX, FiClock, FiCalendar } from 'react-icons/fi'
import { FaCar } from 'react-icons/fa'
import { useTranslations } from 'next-intl'
import { parkingApi } from '@/app/lib/parking'
import type { ParkingVehicle, ParkingBooking } from '@/app/lib/parking/types'

interface VehicleSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface VehicleWithBookings extends ParkingVehicle {
  bookings?: ParkingBooking[]
}

export function VehicleSearchModal({ isOpen, onClose }: VehicleSearchModalProps) {
  const t = useTranslations('parking')
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<ParkingVehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithBookings | null>(null)
  const [vehicleBookings, setVehicleBookings] = useState<ParkingBooking[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingBookings, setLoadingBookings] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    if (!isOpen) {
      setSearchTerm('')
      setResults([])
      setSelectedVehicle(null)
      setVehicleBookings([])
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedVehicle) {
          setSelectedVehicle(null)
          setVehicleBookings([])
        } else {
          onClose()
        }
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, selectedVehicle])

  // Search debounce
  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const vehicles = await parkingApi.searchVehicles(searchTerm)
        setResults(vehicles)
      } catch (error) {
        console.error('Error searching vehicles:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Load bookings when vehicle is selected
  const handleSelectVehicle = async (vehicle: ParkingVehicle) => {
    setSelectedVehicle(vehicle)
    setLoadingBookings(true)
    try {
      const response = await parkingApi.getAllBookings({ plate_number: vehicle.plate_number })
      setVehicleBookings(response.bookings || [])
    } catch (error) {
      console.error('Error loading bookings:', error)
      setVehicleBookings([])
    } finally {
      setLoadingBookings(false)
    }
  }

  const handleBackToSearch = () => {
    setSelectedVehicle(null)
    setVehicleBookings([])
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const _formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    const STATUS_TRANSLATION_KEYS: Record<string, string> = {
      reserved: 'status.reserved',
      checked_in: 'status.checkedIn',
      completed: 'status.completed',
      canceled: 'status.canceled',
      no_show: 'status.noShow',
    }
    const statusColors: Record<string, string> = {
      reserved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      checked_in: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      canceled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
      no_show: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    }
    const translationKey = STATUS_TRANSLATION_KEYS[status] || STATUS_TRANSLATION_KEYS.reserved
    const color = statusColors[status] || statusColors.reserved
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${color}`}>
        {t(translationKey)}
      </span>
    )
  }

  if (!isOpen) return null

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg bg-white dark:bg-[#161b22] rounded-xl shadow-2xl border border-gray-200 dark:border-[#30363d] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-[#30363d]">
          {selectedVehicle ? (
            <>
              <button
                onClick={handleBackToSearch}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <FiX className="w-4 h-4 text-gray-500 dark:text-gray-400 rotate-180" />
              </button>
              <div className="flex items-center gap-2 flex-1">
                <FaCar className="w-4 h-4 text-purple-500" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedVehicle.plate_number}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  - {selectedVehicle.owner_name}
                </span>
              </div>
            </>
          ) : (
            <>
              <FiSearch className="w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('vehicleSearch.placeholder')}
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  <FiX className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <FiX className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {selectedVehicle ? (
            // Vehicle details view
            <div className="p-4">
              {/* Vehicle Info */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-[#0d1117] rounded-lg">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      {t('vehicleSearch.plateNumber')}
                    </span>
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      {selectedVehicle.plate_number}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      {t('vehicleSearch.owner')}
                    </span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedVehicle.owner_name}
                    </p>
                  </div>
                  {selectedVehicle.model && (
                    <div>
                      <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        {t('vehicleSearch.model')}
                      </span>
                      <p className="text-gray-700 dark:text-gray-300">{selectedVehicle.model}</p>
                    </div>
                  )}
                  {selectedVehicle.created_at && (
                    <div>
                      <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        {t('vehicleSearch.registered')}
                      </span>
                      <p className="text-gray-700 dark:text-gray-300">
                        {formatDate(selectedVehicle.created_at)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bookings History */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2 flex items-center gap-2">
                  <FiCalendar className="w-3.5 h-3.5" />
                  {t('vehicleSearch.bookingHistory')} ({vehicleBookings.length})
                </h4>

                {loadingBookings ? (
                  <div className="py-8 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-r-transparent" />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {t('vehicleSearch.loadingHistory')}
                    </p>
                  </div>
                ) : vehicleBookings.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    {t('vehicleSearch.noBookings')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {vehicleBookings.map((booking) => (
                      <Link
                        key={booking.id}
                        href={`/dashboard/parking/bookings/${booking.booking_code}`}
                        onClick={onClose}
                        className="block p-3 bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-lg hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                            {booking.booking_code}
                          </span>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <FiClock className="w-3 h-3" />
                            <span>
                              {formatDate(booking.schedule.expected_checkin)} -{' '}
                              {formatDate(booking.schedule.expected_checkout)}
                            </span>
                          </div>
                          <div>
                            {t('vehicleSearch.spot')} {booking.spot.level}-{booking.spot.number}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Search results view
            <div>
              {loading ? (
                <div className="py-12 text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-r-transparent" />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {t('vehicleSearch.searching')}
                  </p>
                </div>
              ) : searchTerm.length < 2 ? (
                <div className="py-12 text-center">
                  <FaCar className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('vehicleSearch.minChars')}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {t('vehicleSearch.searchHint')}
                  </p>
                </div>
              ) : results.length === 0 ? (
                <div className="py-12 text-center">
                  <FiSearch className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('vehicleSearch.noResults')}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {t('vehicleSearch.tryAnother')}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-[#21262d]">
                  {results.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      onClick={() => handleSelectVehicle(vehicle)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#0d1117] transition-colors text-left"
                    >
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                        <FaCar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                            {vehicle.plate_number}
                          </span>
                          {vehicle.model && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {vehicle.model}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {vehicle.owner_name}
                        </p>
                      </div>
                      <FiCalendar className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {!selectedVehicle && (
          <div className="px-4 py-2 border-t border-gray-100 dark:border-[#21262d] bg-gray-50 dark:bg-[#0d1117]">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
              {t('vehicleSearch.pressEsc')}{' '}
              <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[9px]">ESC</kbd>{' '}
              {t('vehicleSearch.toClose')}
            </p>
          </div>
        )}
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}

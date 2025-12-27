// app/components/groups/tabs/RoomsTab.tsx

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useGroupStore } from '@/app/stores/useGroupStore'
import { useGroupRooms } from '@/app/lib/groups'
import { RoomCard } from '../cards/RoomCard'
import { EmptyState } from '../shared/EmptyState'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { FiPlus, FiEdit, FiUsers } from 'react-icons/fi'

export function RoomsTab() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentGroup } = useGroupStore()
  const t = useTranslations('groups')

  const groupId = currentGroup?.id
  const { data: rooms = [], isLoading } = useGroupRooms(groupId)

  const handleCreateRoom = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('panel', 'new-room')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleEditRoom = (roomId: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('panel', `edit-room-${roomId}`)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" message={t('rooms.loadingRooms')} />
      </div>
    )
  }

  // Validación estricta de array
  const roomsArray = Array.isArray(rooms) ? rooms : []
  const totalRooms = roomsArray.reduce((sum, room) => sum + room.quantity, 0)
  const totalGuests = roomsArray.reduce(
    (sum, room) => sum + room.quantity * room.guests_per_room,
    0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FiEdit className="w-4 h-4" />
            {t('rooms.groupRooms')}
          </h3>
          {roomsArray.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {totalRooms}{' '}
              {totalRooms === 1
                ? t('rooms.totalRooms').toLowerCase()
                : t('rooms.totalRooms').toLowerCase()}{' '}
              · {totalGuests} {totalGuests === 1 ? t('cards.guest') : t('cards.guests')}
            </p>
          )}
        </div>
        <button
          onClick={handleCreateRoom}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 dark:bg-green-700 text-white text-xs font-medium rounded-md hover:bg-green-700 dark:hover:bg-green-800 transition-colors"
        >
          <FiPlus className="w-3.5 h-3.5" />
          {t('rooms.newRoom')}
        </button>
      </div>

      {/* Rooms List */}
      {roomsArray.length === 0 ? (
        <EmptyState
          icon={<FiEdit className="w-12 h-12" />}
          title={t('rooms.noRooms')}
          description={t('rooms.addFirstRoom')}
          action={
            <button
              onClick={handleCreateRoom}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              {t('rooms.createFirst')}
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roomsArray.map((room) => (
            <RoomCard key={room.id} room={room} onEdit={() => handleEditRoom(room.id)} />
          ))}
        </div>
      )}

      {/* Summary Box */}
      {roomsArray.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 dark:bg-blue-700 rounded-full flex items-center justify-center">
                <FiUsers className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{t('rooms.totalGuests')}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {totalGuests} {totalGuests === 1 ? t('cards.guest') : t('cards.guests')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600 dark:text-gray-400">{t('rooms.totalRooms')}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{totalRooms}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-xs text-blue-800 dark:text-blue-300">{t('rooms.infoTip')}</p>
      </div>
    </div>
  )
}

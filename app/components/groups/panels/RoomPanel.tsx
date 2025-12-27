// app/components/groups/panels/RoomPanel.tsx

'use client'

import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FiSave, FiEdit } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'

import { roomSchema, type RoomFormData } from '@/app/lib/schemas/group-schemas'
import { useCreateOrUpdateRoom, useUpdateRoom } from '@/app/lib/groups'
import { useGroupStore } from '@/app/stores/useGroupStore'
import { RoomType, type GroupRoom } from '@/app/lib/groups'
import {
  SlidePanel,
  SlidePanelSection,
  SlidePanelFooterButtons,
  FormField,
  Alert,
  inputClassName,
  textareaClassName,
} from '@/app/ui/panels'

interface RoomPanelProps {
  isOpen: boolean
  onClose: () => void
  room?: GroupRoom
  groupId: number
}

export function RoomPanel({ isOpen, onClose, room, groupId }: RoomPanelProps) {
  const t = useTranslations('groups')
  const { currentGroup } = useGroupStore()
  const isEditing = !!room

  const ROOM_TYPES = [
    { value: RoomType.SINGLE, label: t('roomPanel.single'), icon: '1' },
    { value: RoomType.DOUBLE_BED, label: t('roomPanel.doubleBed'), icon: '2' },
    { value: RoomType.TWIN_BEDS, label: t('roomPanel.twinBeds'), icon: '2+' },
  ] as const

  const effectiveGroupId = currentGroup?.id ?? groupId
  const createOrUpdateRoomMutation = useCreateOrUpdateRoom(effectiveGroupId)
  const updateRoomMutation = useUpdateRoom(effectiveGroupId, room?.id)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema) as Resolver<RoomFormData>,
    defaultValues: room
      ? {
          room_type: room.room_type,
          quantity: room.quantity,
          guests_per_room: room.guests_per_room,
          notes: room.notes || '',
        }
      : {
          room_type: RoomType.DOUBLE_BED,
          quantity: 1,
          guests_per_room: 2,
          notes: '',
        },
  })

  // Watch values for live calculations
  const quantity = watch('quantity')
  const guestsPerRoom = watch('guests_per_room')
  const totalGuests = (quantity || 0) * (guestsPerRoom || 0)

  // Reset form when panel closes
  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  const onSubmit = async (data: RoomFormData) => {
    try {
      const payload = {
        room_type: data.room_type,
        quantity: data.quantity,
        guests_per_room: data.guests_per_room,
        notes: data.notes || undefined,
      }

      if (!effectiveGroupId) {
        throw new Error(t('roomPanel.missingGroupId'))
      }

      if (isEditing && room) {
        await updateRoomMutation.mutateAsync(payload)
        toast.success(t('roomPanel.updateSuccess'))
      } else {
        await createOrUpdateRoomMutation.mutateAsync(payload)
        toast.success(t('roomPanel.createSuccess'))
      }

      onClose()
      reset()
    } catch (error) {
      console.error('Error saving room:', error)
      const message = error instanceof Error ? error.message : t('roomPanel.error')
      toast.error(message)
    }
  }

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('roomPanel.editRoom') : t('roomPanel.newRoom')}
      subtitle={isEditing ? t('roomPanel.editSubtitle') : t('roomPanel.subtitle')}
      size="md"
      headerIcon={<FiEdit className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
      footer={
        <SlidePanelFooterButtons
          onCancel={onClose}
          onSubmit={handleSubmit(onSubmit)}
          isSubmitting={
            isSubmitting || createOrUpdateRoomMutation.isPending || updateRoomMutation.isPending
          }
          submitText={isEditing ? t('roomPanel.updateRoom') : t('roomPanel.createRoom')}
          submitIcon={<FiSave className="w-4 h-4" />}
          submitVariant="primary"
        />
      }
    >
      <SlidePanelSection>
        {/* Room Type */}
        <FormField label={t('roomPanel.roomType')} required error={errors.room_type?.message}>
          <div className="grid grid-cols-1 gap-2">
            {ROOM_TYPES.map((type) => (
              <label
                key={type.value}
                className="relative flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-gray-200 dark:border-gray-700 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20"
              >
                <input
                  {...register('room_type')}
                  type="radio"
                  value={type.value}
                  className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="w-8 h-8 flex items-center justify-center text-sm font-bold bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">
                  {type.icon}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {type.label}
                </span>
              </label>
            ))}
          </div>
        </FormField>

        {/* Quantity */}
        <FormField label={t('roomPanel.quantity')} required error={errors.quantity?.message}>
          <input
            {...register('quantity', { valueAsNumber: true })}
            type="number"
            min="1"
            placeholder={t('roomPanel.quantityPlaceholder')}
            className={inputClassName}
          />
        </FormField>

        {/* Guests per Room */}
        <FormField
          label={t('roomPanel.guestsPerRoom')}
          required
          error={errors.guests_per_room?.message}
        >
          <input
            {...register('guests_per_room', { valueAsNumber: true })}
            type="number"
            min="1"
            max="10"
            placeholder={t('roomPanel.guestsPerRoomPlaceholder')}
            className={inputClassName}
          />
        </FormField>

        {/* Total Guests Calculation */}
        {quantity > 0 && guestsPerRoom > 0 && (
          <Alert variant="info">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t('roomPanel.totalGuests')}</span>
              <span className="text-lg font-bold">{totalGuests}</span>
            </div>
            <p className="text-xs mt-1 opacity-80">
              {quantity}{' '}
              {quantity !== 1 ? t('roomPanel.roomsCalcPlural') : t('roomPanel.roomsCalc')} ×{' '}
              {guestsPerRoom}{' '}
              {guestsPerRoom !== 1 ? t('roomPanel.personsCalc') : t('roomPanel.personCalc')}
            </p>
          </Alert>
        )}

        {/* Notes */}
        <FormField label={t('roomPanel.notes')} error={errors.notes?.message}>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder={t('roomPanel.notesPlaceholder')}
            className={textareaClassName}
          />
        </FormField>
      </SlidePanelSection>
    </SlidePanel>
  )
}

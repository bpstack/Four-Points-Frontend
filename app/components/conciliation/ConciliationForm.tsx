// app/components/conciliation/ConciliationForm.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { FiAlertCircle } from 'react-icons/fi'
import { useTranslations } from 'next-intl'
import {
  useUpdateConciliationForm,
  useUpdateConciliationStatus,
  RECEPTION_REASONS_ORDERED,
  HOUSEKEEPING_REASONS_ORDERED,
  RECEPTION_CONFIG,
  HOUSEKEEPING_CONFIG,
  type ConciliationDetail,
  type ReceptionReason,
  type HousekeepingReason,
  type EntryForm,
  type ConciliationFormData,
  type ReceptionEntryWithReason,
  type HousekeepingEntryWithReason,
} from '@/app/lib/conciliation'
import { useAuth } from '@/app/lib/auth/useAuth'
import TotalsCards from './TotalsCards'
import ConciliationTable from './ConciliationTable'
import RoomPopover from './RoomPopover'
import NotePopover from './NotePopover'
import GeneralNotes from './GeneralNotes'
import ActionButtons from './ActionButtons'
import DaySummary from './DaySummary'

interface Note {
  id: string
  text: string
  author: string
  timestamp: string
  author_id: string
}

interface RoomPopoverState {
  type: 'reception' | 'housekeeping'
  reason: string
  rooms: string[]
}

interface NotePopoverState {
  type: 'reception' | 'housekeeping'
  reason: string
  notes: string[]
}

interface ConciliationFormProps {
  conciliation: ConciliationDetail | null
  loading: boolean
  dayStatusMessage: string
  onUpdate: () => void
}

function parseRooms(roomString: string): string[] {
  if (!roomString.trim()) return []
  return roomString
    .split(',')
    .map((r) => r.trim())
    .filter((r) => r.length > 0)
}

function parseNotes(noteString: string): string[] {
  if (!noteString.trim()) return []
  return noteString
    .split(',')
    .map((n) => n.trim())
    .filter((n) => n.length > 0)
}

export default function ConciliationForm({
  conciliation,
  loading,
  dayStatusMessage,
  onUpdate,
}: ConciliationFormProps) {
  const { user } = useAuth()
  const t = useTranslations('conciliation')

  // React Query mutations
  const updateFormMutation = useUpdateConciliationForm()
  const updateStatusMutation = useUpdateConciliationStatus()

  const [receptionForm, setReceptionForm] = useState<Record<ReceptionReason, EntryForm>>(
    {} as Record<ReceptionReason, EntryForm>
  )
  const [housekeepingForm, setHousekeepingForm] = useState<Record<HousekeepingReason, EntryForm>>(
    {} as Record<HousekeepingReason, EntryForm>
  )
  const [notes, setNotes] = useState<Note[]>([])
  const [newNoteText, setNewNoteText] = useState('')
  const [roomPopover, setRoomPopover] = useState<RoomPopoverState | null>(null)
  const [notePopover, setNotePopover] = useState<NotePopoverState | null>(null)

  // Estado de saving derivado de mutations
  const saving = updateFormMutation.isPending || updateStatusMutation.isPending

  // Inicializar formularios cuando cambia la conciliacion
  useEffect(() => {
    if (conciliation) {
      const newReceptionForm = {} as Record<ReceptionReason, EntryForm>
      RECEPTION_REASONS_ORDERED.forEach((reason) => {
        const entry = conciliation.reception_entries?.find(
          (e: ReceptionEntryWithReason) => e.reason === reason
        )
        newReceptionForm[reason] = {
          value: entry?.value || 0,
          room_number: entry?.room_number || '',
          notes: entry?.notes || '',
        }
      })
      setReceptionForm(newReceptionForm)

      const newHousekeepingForm = {} as Record<HousekeepingReason, EntryForm>
      HOUSEKEEPING_REASONS_ORDERED.forEach((reason) => {
        const entry = conciliation.housekeeping_entries?.find(
          (e: HousekeepingEntryWithReason) => e.reason === reason
        )
        newHousekeepingForm[reason] = {
          value: entry?.value || 0,
          room_number: entry?.room_number || '',
          notes: entry?.notes || '',
        }
      })
      setHousekeepingForm(newHousekeepingForm)

      // Parsear notas generales
      if (conciliation.notes) {
        try {
          const parsedNotes = JSON.parse(conciliation.notes)
          if (Array.isArray(parsedNotes)) {
            setNotes(parsedNotes)
          } else {
            setNotes([
              {
                id: Date.now().toString(),
                text: conciliation.notes,
                author: 'Sistema',
                timestamp: new Date().toISOString(),
                author_id: 'system',
              },
            ])
          }
        } catch {
          if (conciliation.notes.trim()) {
            setNotes([
              {
                id: Date.now().toString(),
                text: conciliation.notes,
                author: 'Sistema',
                timestamp: new Date().toISOString(),
                author_id: 'system',
              },
            ])
          } else {
            setNotes([])
          }
        }
      } else {
        setNotes([])
      }
    }
  }, [conciliation])

  // Calcular totales
  const calculateTotals = useCallback(() => {
    let totalReception = 0
    let totalHousekeeping = 0

    RECEPTION_REASONS_ORDERED.forEach((reason) => {
      const config = RECEPTION_CONFIG[reason]
      const value = receptionForm[reason]?.value || 0
      totalReception += config.direction === 'add' ? value : -value
    })

    HOUSEKEEPING_REASONS_ORDERED.forEach((reason) => {
      const config = HOUSEKEEPING_CONFIG[reason]
      const value = housekeepingForm[reason]?.value || 0
      totalHousekeeping += config.direction === 'add' ? value : -value
    })

    return {
      totalReception,
      totalHousekeeping,
      difference: totalReception - totalHousekeeping,
    }
  }, [receptionForm, housekeepingForm])

  const totals = calculateTotals()

  // Actualizar valores
  const updateReceptionValue = (
    reason: ReceptionReason,
    field: keyof EntryForm,
    value: string | number
  ) => {
    setReceptionForm((prev) => ({
      ...prev,
      [reason]: { ...prev[reason], [field]: value },
    }))
  }

  const updateHousekeepingValue = (
    reason: HousekeepingReason,
    field: keyof EntryForm,
    value: string | number
  ) => {
    setHousekeepingForm((prev) => ({
      ...prev,
      [reason]: { ...prev[reason], [field]: value },
    }))
  }

  // Room popover handlers
  const handleRoomClick = (
    type: 'reception' | 'housekeeping',
    reason: string,
    roomString: string
  ) => {
    setRoomPopover({ type, reason, rooms: parseRooms(roomString) })
  }

  const addRoom = (newRoom: string) => {
    if (!roomPopover) return
    const trimmed = newRoom.trim()
    if (!trimmed || roomPopover.rooms.includes(trimmed)) return
    if (roomPopover.rooms.length >= 15) {
      alert(t('alerts.maxRooms'))
      return
    }

    const updatedRooms = [...roomPopover.rooms, trimmed]
    const roomString = updatedRooms.join(', ')

    if (roomPopover.type === 'reception') {
      updateReceptionValue(roomPopover.reason as ReceptionReason, 'room_number', roomString)
    } else {
      updateHousekeepingValue(roomPopover.reason as HousekeepingReason, 'room_number', roomString)
    }
    setRoomPopover({ ...roomPopover, rooms: updatedRooms })
  }

  const removeRoom = (roomToRemove: string) => {
    if (!roomPopover) return
    const updatedRooms = roomPopover.rooms.filter((r) => r !== roomToRemove)
    const roomString = updatedRooms.join(', ')

    if (roomPopover.type === 'reception') {
      updateReceptionValue(roomPopover.reason as ReceptionReason, 'room_number', roomString)
    } else {
      updateHousekeepingValue(roomPopover.reason as HousekeepingReason, 'room_number', roomString)
    }
    setRoomPopover({ ...roomPopover, rooms: updatedRooms })
  }

  // Note popover handlers
  const handleNoteClick = (
    type: 'reception' | 'housekeeping',
    reason: string,
    noteString: string
  ) => {
    setNotePopover({ type, reason, notes: parseNotes(noteString) })
  }

  const addEntryNote = (newNote: string) => {
    if (!notePopover) return
    const trimmed = newNote.trim()
    if (!trimmed || notePopover.notes.includes(trimmed)) return
    if (trimmed.length > 200) {
      alert(t('alerts.maxNoteLength'))
      return
    }
    if (notePopover.notes.length >= 10) {
      alert(t('alerts.maxNotes'))
      return
    }

    const updatedNotes = [...notePopover.notes, trimmed]
    const noteString = updatedNotes.join(', ')

    if (notePopover.type === 'reception') {
      updateReceptionValue(notePopover.reason as ReceptionReason, 'notes', noteString)
    } else {
      updateHousekeepingValue(notePopover.reason as HousekeepingReason, 'notes', noteString)
    }
    setNotePopover({ ...notePopover, notes: updatedNotes })
  }

  const removeEntryNote = (noteToRemove: string) => {
    if (!notePopover) return
    const updatedNotes = notePopover.notes.filter((n) => n !== noteToRemove)
    const noteString = updatedNotes.join(', ')

    if (notePopover.type === 'reception') {
      updateReceptionValue(notePopover.reason as ReceptionReason, 'notes', noteString)
    } else {
      updateHousekeepingValue(notePopover.reason as HousekeepingReason, 'notes', noteString)
    }
    setNotePopover({ ...notePopover, notes: updatedNotes })
  }

  // General notes handlers
  const addGeneralNote = () => {
    if (!newNoteText.trim() || !user) return
    const newNote: Note = {
      id: Date.now().toString(),
      text: newNoteText.trim(),
      author: user.username || user.email || 'Usuario',
      author_id: user.id,
      timestamp: new Date().toISOString(),
    }
    setNotes((prev) => [newNote, ...prev])
    setNewNoteText('')
  }

  const deleteGeneralNote = (noteId: string, authorId: string) => {
    if (user?.id !== authorId) {
      alert(t('alerts.onlyAuthorCanDelete'))
      return
    }
    setNotes((prev) => prev.filter((n) => n.id !== noteId))
  }

  // Save handlers
  const handleSave = async () => {
    if (!conciliation) return
    try {
      const formData: ConciliationFormData = {
        reception: RECEPTION_REASONS_ORDERED.map((reason) => ({
          reason,
          value: receptionForm[reason]?.value || 0,
          room_number: receptionForm[reason]?.room_number || '',
          notes: receptionForm[reason]?.notes || '',
        })),
        housekeeping: HOUSEKEEPING_REASONS_ORDERED.map((reason) => ({
          reason,
          value: housekeepingForm[reason]?.value || 0,
          room_number: housekeepingForm[reason]?.room_number || '',
          notes: housekeepingForm[reason]?.notes || '',
        })),
        notes: JSON.stringify(notes),
      }
      await updateFormMutation.mutateAsync({ id: conciliation.id!, formData })
      onUpdate()
    } catch (error) {
      console.error('Error saving:', error)
      alert(t('alerts.errorSaving'))
    }
  }

  const handleConfirm = async () => {
    if (!conciliation) return
    await handleSave()
    try {
      await updateStatusMutation.mutateAsync({ id: conciliation.id!, status: 'confirmed' })
      onUpdate()
    } catch (error) {
      console.error('Error confirming:', error)
      alert(t('alerts.errorConfirming'))
    }
  }

  const handleReopen = async () => {
    if (!conciliation) return
    try {
      await updateStatusMutation.mutateAsync({ id: conciliation.id!, status: 'draft' })
      onUpdate()
    } catch (error) {
      console.error('Error reopening:', error)
      alert(t('alerts.errorReopening'))
    }
  }

  const handleClose = async () => {
    if (!conciliation) return
    if (!confirm(t('alerts.confirmClose'))) return
    try {
      await updateStatusMutation.mutateAsync({ id: conciliation.id!, status: 'closed' })
      onUpdate()
    } catch (error) {
      console.error('Error closing:', error)
      alert(t('alerts.errorClosing'))
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">{t('page.loading')}</div>
      </div>
    )
  }

  // No conciliation state
  if (!conciliation) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <FiAlertCircle className="w-12 h-12 text-gray-400" />
        <p className="text-gray-600 dark:text-gray-400">
          {dayStatusMessage || t('page.selectDay')}
        </p>
      </div>
    )
  }

  const isReadOnly = conciliation.status === 'closed'

  return (
    <div className="space-y-6 relative">
      {/* Popovers */}
      {roomPopover && (
        <RoomPopover
          rooms={roomPopover.rooms}
          isReadOnly={isReadOnly}
          onClose={() => setRoomPopover(null)}
          onAddRoom={addRoom}
          onRemoveRoom={removeRoom}
        />
      )}

      {notePopover && (
        <NotePopover
          notes={notePopover.notes}
          isReadOnly={isReadOnly}
          onClose={() => setNotePopover(null)}
          onAddNote={addEntryNote}
          onRemoveNote={removeEntryNote}
        />
      )}

      {/* Botones de accion */}
      <ActionButtons
        status={conciliation.status}
        saving={saving}
        onSave={handleSave}
        onConfirm={handleConfirm}
        onReopen={handleReopen}
        onClose={handleClose}
      />

      {/* Totales - Mobile/Tablet (hidden on >= 1400px) */}
      <div className="min-[1400px]:hidden">
        <TotalsCards
          totalReception={totals.totalReception}
          totalHousekeeping={totals.totalHousekeeping}
          difference={totals.difference}
        />
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 min-[1400px]:grid-cols-4 gap-6">
        {/* Left Column - Main Content */}
        <div className="min-[1400px]:col-span-3 space-y-6">
          <ConciliationTable
            title={t('table.reception')}
            reasons={RECEPTION_REASONS_ORDERED}
            config={RECEPTION_CONFIG}
            form={receptionForm}
            onUpdateValue={updateReceptionValue}
            onRoomClick={(reason, roomString) => handleRoomClick('reception', reason, roomString)}
            onNoteClick={(reason, noteString) => handleNoteClick('reception', reason, noteString)}
            isReadOnly={isReadOnly}
            total={totals.totalReception}
            colorScheme="blue"
          />

          <ConciliationTable
            title={t('table.housekeeping')}
            reasons={HOUSEKEEPING_REASONS_ORDERED}
            config={HOUSEKEEPING_CONFIG}
            form={housekeepingForm}
            onUpdateValue={updateHousekeepingValue}
            onRoomClick={(reason, roomString) =>
              handleRoomClick('housekeeping', reason, roomString)
            }
            onNoteClick={(reason, noteString) =>
              handleNoteClick('housekeeping', reason, noteString)
            }
            isReadOnly={isReadOnly}
            total={totals.totalHousekeeping}
            colorScheme="purple"
          />

          <GeneralNotes
            notes={notes}
            newNoteText={newNoteText}
            isReadOnly={isReadOnly}
            currentUserId={user?.id}
            onNewNoteChange={setNewNoteText}
            onAddNote={addGeneralNote}
            onDeleteNote={deleteGeneralNote}
          />
        </div>

        {/* Right Column - Totals & Summary */}
        <div className="hidden min-[1400px]:block space-y-4">
          <div className="sticky top-4 space-y-4">
            {/* Totals Cards - Desktop */}
            <TotalsCards
              totalReception={totals.totalReception}
              totalHousekeeping={totals.totalHousekeeping}
              difference={totals.difference}
              layout="vertical"
            />

            {/* Day Summary */}
            <DaySummary
              conciliation={conciliation}
              baseRooms={receptionForm['base_rooms']?.value || 0}
            />
          </div>
        </div>
      </div>

      {/* Day Summary - Mobile/Tablet (shown below main content) */}
      <div className="min-[1400px]:hidden">
        <DaySummary
          conciliation={conciliation}
          baseRooms={receptionForm['base_rooms']?.value || 0}
        />
      </div>
    </div>
  )
}

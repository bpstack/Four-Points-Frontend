// app/components/logbooks/LogbooksList.tsx
'use client'

import { useState } from 'react'
import {
  FiClock,
  FiAlertCircle,
  FiEdit2,
  FiMessageSquare,
  FiEye,
  FiCheckCircle,
  FiClock as FiPending,
  FiTrash2,
  FiUser,
  FiUsers,
  FiTag,
} from 'react-icons/fi'
import { SlBookOpen } from 'react-icons/sl'
import { LogEntry, Comment } from '@/app/lib/logbooks/types'
import { useAuth } from '@/app/lib/auth/useAuth'
import { toast } from 'react-hot-toast'
import { useDepartments } from '@/app/lib/logbooks/hooks/useDepartments'
import { updateLogbookSchema, updateCommentSchema } from '@/app/lib/logbooks/validations'
import { formatEditTimestamp, formatMadridDate } from '@/app/lib/helpers/date'
import { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import NewCommentEntry from './NewCommentEntry'
import EditLogbookModal from './EditLogbookModal'
import EditCommentModal from './EditCommentModal'
import { useTranslations } from 'next-intl'

// =============================================
// HELPER FUNCTIONS
// =============================================

function formatUsername(
  username: string | undefined | null,
  unknownLabel: string = 'Unknown'
): string {
  if (!username) return unknownLabel
  return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase()
}

function getInitials(username: string): string {
  if (!username) return '?'
  const parts = username.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return username.substring(0, 2).toUpperCase()
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'critical':
      return 'text-red-700 bg-red-100 border-red-300 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800'
    case 'high':
      return 'text-orange-700 bg-orange-100 border-orange-300 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800'
    case 'medium':
      return 'text-yellow-700 bg-yellow-100 border-yellow-300 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800'
    case 'low':
      return 'text-green-700 bg-green-100 border-green-300 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800'
    default:
      return 'text-gray-700 bg-gray-100 border-gray-300 dark:text-gray-400 dark:bg-gray-800 dark:border-gray-700'
  }
}

function getPriorityBackground(priority: string) {
  switch (priority) {
    case 'critical':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    case 'high':
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
    default:
      return 'bg-white dark:bg-[#151b23] border-gray-200 dark:border-gray-800'
  }
}

function mapPriorityToBackend(
  priority: 'low' | 'medium' | 'high' | 'critical'
): 'baja' | 'media' | 'alta' | 'urgente' {
  switch (priority) {
    case 'critical':
      return 'urgente'
    case 'high':
      return 'alta'
    case 'medium':
      return 'media'
    default:
      return 'baja'
  }
}

// =============================================
// INTERFACES
// =============================================

interface ReadByUser {
  user_id: string
  username: string
  read_at: string
}

// Type for mutations passed from parent
interface LogbookMutations {
  updateLogbook: UseMutationResult<
    unknown,
    Error,
    {
      id: number
      data: {
        message?: string
        importance_level?: 'baja' | 'media' | 'alta' | 'urgente'
        department_id?: number
      }
    },
    unknown
  >
  deleteLogbook: UseMutationResult<unknown, Error, number, unknown>
  toggleStatus: UseMutationResult<
    unknown,
    Error,
    { id: number; currentStatus: 'pending' | 'resolved' },
    unknown
  >
  toggleRead: UseMutationResult<unknown, Error, { id: number; isRead: boolean }, unknown>
  createComment: UseMutationResult<
    unknown,
    Error,
    {
      logbookId: number
      data: {
        comment: string
        department_id: number
        importance_level: 'baja' | 'media' | 'alta' | 'urgente'
      }
    },
    unknown
  >
  updateComment: UseMutationResult<
    unknown,
    Error,
    {
      logbookId: number
      commentId: number
      data: {
        comment?: string
        importance_level?: 'baja' | 'media' | 'alta' | 'urgente'
        department_id?: number
      }
    },
    unknown
  >
  deleteComment: UseMutationResult<
    unknown,
    Error,
    { logbookId: number; commentId: number },
    unknown
  >
}

export interface LogbooksListProps {
  entries: LogEntry[]
  dayStatusMessage?: string
  mutations: LogbookMutations
  useReaders: (logbookId: number) => UseQueryResult<ReadByUser[] | undefined, Error>
}

// =============================================
// SUB-COMPONENTS
// =============================================

function ReadByAvatars({
  users,
  maxVisible = 8,
  noneLabel = 'None',
  moreLabel = '+__count__ more',
}: {
  users: ReadByUser[]
  maxVisible?: number
  noneLabel?: string
  moreLabel?: string
}) {
  // Ensure users is an array
  const safeUsers = Array.isArray(users) ? users : []
  const visibleUsers = safeUsers.slice(0, maxVisible)
  const remainingCount = safeUsers.length - maxVisible

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-red-500',
    'bg-indigo-500',
  ]

  const getColor = (index: number) => colors[index % colors.length]

  const rows: ReadByUser[][] = []
  for (let i = 0; i < visibleUsers.length; i += 4) {
    rows.push(visibleUsers.slice(i, i + 4))
  }

  if (safeUsers.length === 0) {
    return <span className="text-xs text-gray-400 dark:text-gray-500 italic">{noneLabel}</span>
  }

  return (
    <div className="flex flex-col gap-1">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex items-center -space-x-2">
          {row.map((user, index) => {
            const globalIndex = rowIndex * 4 + index
            const initials = getInitials(user.username)
            return (
              <div
                key={user.user_id}
                className={`w-7 h-7 rounded-full ${getColor(globalIndex)} text-white text-xs font-semibold flex items-center justify-center border-2 border-white dark:border-gray-800 cursor-pointer hover:scale-110 transition-transform hover:z-10 relative`}
                title={`${user.username} - ${formatMadridDate(user.read_at)}`}
              >
                {initials}
              </div>
            )
          })}
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="text-[10px] text-gray-500 dark:text-gray-400 ml-1">
          {moreLabel.replace('__count__', String(remainingCount))}
        </div>
      )}
    </div>
  )
}

// Component to fetch and display readers for a single entry
function EntryReaders({
  entryId,
  useReaders,
  noneLabel,
  moreLabel,
}: {
  entryId: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useReaders: (logbookId: number) => UseQueryResult<any, Error>
  noneLabel?: string
  moreLabel?: string
}) {
  const { data: readers = [] } = useReaders(entryId)

  return <ReadByAvatars users={readers} noneLabel={noneLabel} moreLabel={moreLabel} />
}

// Hook to get read status for toggle button
function useReadStatus(
  entryId: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useReaders: (logbookId: number) => UseQueryResult<any, Error>,
  userId?: string
): boolean {
  const { data: readers = [] } = useReaders(entryId)
  // Ensure readers is an array before calling .some()
  const safeReaders = Array.isArray(readers) ? readers : []
  return userId ? safeReaders.some((r: ReadByUser) => r.user_id === userId) : false
}

// Toggle read button component
function ReadToggleButton({
  entryId,
  useReaders,
  userId,
  onToggleRead,
  isPending,
  markLabel = 'Mark read',
  unmarkLabel = 'Unmark',
}: {
  entryId: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useReaders: (logbookId: number) => UseQueryResult<any, Error>
  userId?: string
  onToggleRead: (entryId: number, isRead: boolean) => void
  isPending?: boolean
  markLabel?: string
  unmarkLabel?: string
}) {
  const isRead = useReadStatus(entryId, useReaders, userId)

  return (
    <button
      onClick={() => onToggleRead(entryId, isRead)}
      disabled={isPending}
      className={`flex items-center gap-1.5 text-xs transition-colors ${
        isRead
          ? 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700'
          : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
      }`}
    >
      <FiEye className="w-4 h-4" />
      <span>{isRead ? unmarkLabel : markLabel}</span>
    </button>
  )
}

// =============================================
// MAIN COMPONENT
// =============================================

export default function LogbooksList({
  entries = [],
  dayStatusMessage = '',
  mutations,
  useReaders,
}: LogbooksListProps) {
  const { user } = useAuth()
  const { getDepartmentName } = useDepartments()
  const t = useTranslations('logbooks')

  // Comment modal state
  const [commentModalOpen, setCommentModalOpen] = useState<number | null>(null)
  const [newComment, setNewComment] = useState('')
  const [commentPriority, setCommentPriority] = useState<'baja' | 'media' | 'alta' | 'urgente'>(
    'baja'
  )
  const [commentDepartment, setCommentDepartment] = useState<number | null>(null)

  // Edit logbook modal state
  const [editModalOpen, setEditModalOpen] = useState<number | null>(null)
  const [editMessage, setEditMessage] = useState('')
  const [editPriority, setEditPriority] = useState<'baja' | 'media' | 'alta' | 'urgente'>('baja')
  const [editDepartment, setEditDepartment] = useState<number>(1)

  // Edit comment modal state
  const [editCommentModalOpen, setEditCommentModalOpen] = useState<{
    entryId: number
    commentId: number
  } | null>(null)
  const [editCommentText, setEditCommentText] = useState('')
  const [editCommentPriority, setEditCommentPriority] = useState<
    'baja' | 'media' | 'alta' | 'urgente'
  >('baja')
  const [editCommentDepartment, setEditCommentDepartment] = useState<number>(1)

  // =============================================
  // HANDLERS - EDIT LOGBOOK
  // =============================================

  const handleEdit = (entryId: number) => {
    const entry = entries.find((e) => e.id === entryId)
    if (!entry) return

    if (user?.id !== entry.author_id) {
      toast.error(t('list.alerts.entryAuthorOnly'))
      return
    }

    setEditMessage(entry.description)
    setEditPriority(mapPriorityToBackend(entry.priority || 'low'))
    setEditDepartment(entry.department_id || 1)
    setEditModalOpen(entryId)
  }

  const handleSaveEdit = async () => {
    const validation = updateLogbookSchema.safeParse({
      message: editMessage.trim(),
      importance_level: editPriority,
      department_id: editDepartment,
    })

    if (!validation.success) {
      toast.error(validation.error.errors[0].message)
      return
    }

    await mutations.updateLogbook.mutateAsync({
      id: editModalOpen!,
      data: {
        message: editMessage.trim(),
        importance_level: editPriority,
        department_id: editDepartment,
      },
    })

    setEditModalOpen(null)
  }

  // =============================================
  // HANDLERS - COMMENTS
  // =============================================

  const handleOpenCommentModal = (entryId: number) => {
    const entry = entries.find((e) => e.id === entryId)
    setCommentModalOpen(entryId)
    setNewComment('')
    setCommentPriority('baja')
    setCommentDepartment(entry?.department_id ?? null)
  }

  const handleSaveComment = async (
    entryId: number,
    payload?: {
      comment: string
      department_id: number
      importance_level: 'baja' | 'media' | 'alta' | 'urgente'
    }
  ) => {
    const commentText = payload?.comment ?? newComment
    const deptId = payload?.department_id ?? commentDepartment
    const priorityLevel = payload?.importance_level ?? commentPriority

    if (!commentText.trim()) return
    if (deptId === null) return

    await mutations.createComment.mutateAsync({
      logbookId: entryId,
      data: {
        comment: commentText.trim(),
        department_id: deptId,
        importance_level: priorityLevel,
      },
    })

    setCommentModalOpen(null)
    setNewComment('')
  }

  // =============================================
  // HANDLERS - EDIT COMMENT
  // =============================================

  const handleEditComment = (entryId: number, commentId: number) => {
    const entry = entries.find((e) => e.id === entryId)
    const comment = entry?.comments?.find((c) => c.id === commentId)

    if (!comment) return

    if (user?.id !== comment.user_id) {
      toast.error(t('list.alerts.commentAuthorOnly'))
      return
    }

    setEditCommentText(comment.comment)
    setEditCommentPriority(comment.importance_level || 'baja')
    setEditCommentDepartment(comment.department_id || 1)
    setEditCommentModalOpen({ entryId, commentId })
  }

  const handleSaveEditComment = async () => {
    const validation = updateCommentSchema.safeParse({
      comment: editCommentText.trim(),
      importance_level: editCommentPriority,
      department_id: editCommentDepartment,
    })

    if (!validation.success) {
      toast.error(validation.error.errors[0].message)
      return
    }

    await mutations.updateComment.mutateAsync({
      logbookId: editCommentModalOpen!.entryId,
      commentId: editCommentModalOpen!.commentId,
      data: {
        comment: editCommentText.trim(),
        importance_level: editCommentPriority,
        department_id: editCommentDepartment,
      },
    })

    setEditCommentModalOpen(null)
  }

  // =============================================
  // HANDLERS - OTHER ACTIONS
  // =============================================

  const handleToggleStatus = async (entryId: number, currentStatus: string) => {
    await mutations.toggleStatus.mutateAsync({
      id: entryId,
      currentStatus: currentStatus as 'pending' | 'resolved',
    })
  }

  const handleToggleRead = async (entryId: number, isRead: boolean) => {
    if (!user?.id) {
      toast.error(t('list.alerts.unauthenticated'))
      return
    }
    await mutations.toggleRead.mutateAsync({ id: entryId, isRead })
  }

  const handleDeleteEntry = async (entryId: number) => {
    if (!window.confirm(t('list.confirm.deleteEntry'))) return
    await mutations.deleteLogbook.mutateAsync(entryId)
  }

  const handleDeleteComment = async (entryId: number, commentId: number) => {
    if (!window.confirm(t('list.confirm.deleteComment'))) return
    await mutations.deleteComment.mutateAsync({ logbookId: entryId, commentId })
  }

  // =============================================
  // RENDER
  // =============================================

  return (
    <div className="max-w-[1600px] space-y-3">
      {/* Header - Desktop only */}
      {entries.length > 0 && (
        <div className="hidden md:block sticky top-[115px] z-20 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-[#0d1117] shadow-sm overflow-hidden mb-3">
          <div className="flex px-3 py-2.5 bg-gray-50/50 dark:bg-gray-900/20">
            <div className="w-24 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 pr-3">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {t('list.columns.timeAuthor')}
              </h3>
            </div>
            <div className="flex-1 px-4 border-r border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1.5">
                <SlBookOpen className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('list.columns.entries')}
                </h3>
              </div>
            </div>
            <div className="w-32 flex-shrink-0 px-3 border-r border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1.5">
                <FiUsers className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('list.columns.department')}
                </h3>
              </div>
            </div>
            <div className="w-28 flex-shrink-0 px-3 border-r border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1.5">
                <FiTag className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('list.columns.priority')}
                </h3>
              </div>
            </div>
            <div className="w-40 flex-shrink-0 pl-3">
              <div className="flex items-center gap-1.5">
                <FiEye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t('list.columns.readBy')}
                </h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entries */}
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`border rounded-lg hover:shadow-md transition-shadow ${
            entry.status === 'resolved'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : getPriorityBackground(entry.priority ?? 'low')
          }`}
        >
          {/* Desktop Layout */}
          <div className="hidden md:flex p-4">
            <div className="w-24 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 pr-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FiClock className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(entry.timestamp).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FiUser className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {formatUsername(entry.author_name, t('list.unknownUser'))}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 px-4 border-r border-slate-200 dark:border-slate-700">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {entry.description}
              </p>
              {entry.comments && entry.comments.length > 0 && (
                <div className="mt-3 ml-4 space-y-2 border-l-2 border-blue-200 dark:border-blue-800 pl-3">
                  {entry.comments
                    .sort((a, b) => {
                      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
                      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
                      return dateA - dateB
                    })
                    .map((comment: Comment) => (
                      <div
                        key={comment.id}
                        className={`text-sm rounded-lg p-2 border ${
                          entry.status === 'resolved'
                            ? 'bg-green-100 dark:bg-green-800/20 border-green-200 dark:border-green-600'
                            : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'
                        }`}
                      >
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {comment.comment}
                        </p>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-medium">
                              {formatUsername(comment.author_name, t('list.unknownUser'))}
                            </span>
                            <span>·</span>
                            <span>
                              {formatEditTimestamp(comment.created_at || new Date().toISOString())}
                            </span>
                            {comment.updated_at && comment.updated_at !== comment.created_at && (
                              <>
                                <span>·</span>
                                <span
                                  className="italic"
                                  title={t('list.comment.editedTooltip', {
                                    date: formatEditTimestamp(comment.updated_at),
                                  })}
                                >
                                  {t('list.comment.edited')}
                                </span>
                              </>
                            )}
                          </div>
                          {user?.id === comment.user_id && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditComment(entry.id, comment.id)
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                                title={t('list.tooltips.editComment')}
                              >
                                <FiEdit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteComment(entry.id, comment.id)
                                }}
                                className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                title={t('list.tooltips.deleteComment')}
                              >
                                <FiTrash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="w-32 flex-shrink-0 px-3 border-r border-slate-200 dark:border-slate-700 flex items-start">
              <span className="inline-block px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md">
                {getDepartmentName(entry.department_id || 1)}
              </span>
            </div>

            <div className="w-28 flex-shrink-0 px-3 border-r border-slate-200 dark:border-slate-700 flex items-start">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border ${getPriorityColor(entry.priority ?? 'low')}`}
              >
                {entry.priority === 'critical' && <FiAlertCircle className="w-3 h-3" />}
                {t(`priorities.${entry.priority ?? 'low'}`)}
              </span>
            </div>

            <div className="w-40 flex-shrink-0 pl-3 flex flex-col items-start">
              <EntryReaders
                entryId={entry.id}
                useReaders={useReaders}
                noneLabel={t('list.readers.none')}
                moreLabel={t('list.readers.moreTemplate')}
              />
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden p-4 space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {entry.description}
            </p>
            {entry.comments && entry.comments.length > 0 && (
              <div className="ml-3 space-y-2 border-l-2 border-blue-200 dark:border-blue-800 pl-3">
                {entry.comments
                  .sort((a, b) => {
                    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
                    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
                    return dateA - dateB
                  })
                  .map((comment: Comment) => (
                    <div
                      key={comment.id}
                      className={`text-sm rounded-lg p-2 border ${
                        entry.status === 'resolved'
                          ? 'bg-green-100 dark:bg-green-800/20 border-green-200 dark:border-green-600'
                          : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'
                      }`}
                    >
                      <p className="text-gray-700 dark:text-gray-300 text-xs whitespace-pre-wrap">
                        {comment.comment}
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium">
                            {formatUsername(comment.author_name, t('list.unknownUser'))}
                          </span>
                          <span>·</span>
                          <span>
                            {formatEditTimestamp(comment.created_at || new Date().toISOString())}
                          </span>
                        </div>
                        {user?.id === comment.user_id && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditComment(entry.id, comment.id)
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                            >
                              <FiEdit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteComment(entry.id, comment.id)
                              }}
                              className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                            >
                              <FiTrash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t('list.readers.label')}
              </span>
              <EntryReaders
                entryId={entry.id}
                useReaders={useReaders}
                noneLabel={t('list.readers.none')}
                moreLabel={t('list.readers.moreTemplate')}
              />
            </div>
          </div>

          {/* Footer - Actions */}
          <div className="px-4 pb-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="hidden md:flex">
              <div className="w-24 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 pr-3" />
              <div className="flex-1 px-4 flex items-center gap-4 border-r border-slate-200 dark:border-slate-700">
                {user?.id === entry.author_id && (
                  <button
                    onClick={() => handleEdit(entry.id)}
                    className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <FiEdit2 className="w-4 h-4" />
                    <span>{t('list.actions.edit')}</span>
                  </button>
                )}

                <button
                  onClick={() => handleOpenCommentModal(entry.id)}
                  className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <FiMessageSquare className="w-4 h-4" />
                  <span>{t('list.actions.comment')}</span>
                </button>

                <button
                  onClick={() => handleToggleStatus(entry.id, entry.status || 'pending')}
                  disabled={mutations.toggleStatus.isPending}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${
                    entry.status === 'resolved'
                      ? 'text-green-600 dark:text-green-400 hover:text-green-700'
                      : 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-700'
                  }`}
                >
                  {entry.status === 'resolved' ? (
                    <>
                      <FiCheckCircle className="w-4 h-4" />
                      <span>{t('list.actions.resolved')}</span>
                    </>
                  ) : (
                    <>
                      <FiPending className="w-4 h-4" />
                      <span>{t('list.actions.pending')}</span>
                    </>
                  )}
                </button>

                {user?.id === entry.author_id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteEntry(entry.id)
                    }}
                    disabled={mutations.deleteLogbook.isPending}
                    className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500 transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    <span>{t('list.actions.delete')}</span>
                  </button>
                )}

                {entry.updated_at && entry.updated_at !== entry.timestamp && (
                  <div
                    className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 ml-auto"
                    title={t('list.badges.lastEditedTooltip', {
                      date: formatEditTimestamp(entry.updated_at),
                    })}
                  >
                    <FiEdit2 className="w-3 h-3 flex-shrink-0" />
                    <span className="whitespace-nowrap">
                      {t('list.badges.lastEdited', { date: formatEditTimestamp(entry.updated_at) })}
                    </span>
                  </div>
                )}
              </div>

              <div className="w-32 flex-shrink-0 px-3 border-r border-slate-200 dark:border-slate-700" />
              <div className="w-28 flex-shrink-0 px-3 border-r border-slate-200 dark:border-slate-700" />
              <div className="w-40 flex-shrink-0 pl-3">
                <ReadToggleButton
                  entryId={entry.id}
                  useReaders={useReaders}
                  userId={user?.id}
                  onToggleRead={handleToggleRead}
                  isPending={mutations.toggleRead.isPending}
                  markLabel={t('list.readers.mark')}
                  unmarkLabel={t('list.readers.unmark')}
                />
              </div>
            </div>

            {/* Footer Mobile */}
            <div className="md:hidden flex items-center justify-between">
              <div className="flex items-center gap-4 flex-wrap">
                {user?.id === entry.author_id && (
                  <button
                    onClick={() => handleEdit(entry.id)}
                    className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <FiEdit2 className="w-4 h-4" />
                    <span>{t('list.actions.edit')}</span>
                  </button>
                )}

                <button
                  onClick={() => handleOpenCommentModal(entry.id)}
                  className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <FiMessageSquare className="w-4 h-4" />
                  <span>{t('list.actions.comment')}</span>
                </button>

                <button
                  onClick={() => handleToggleStatus(entry.id, entry.status || 'pending')}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${
                    entry.status === 'resolved'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}
                >
                  {entry.status === 'resolved' ? (
                    <>
                      <FiCheckCircle className="w-4 h-4" />
                      <span>{t('list.actions.resolved')}</span>
                    </>
                  ) : (
                    <>
                      <FiPending className="w-4 h-4" />
                      <span>{t('list.actions.pending')}</span>
                    </>
                  )}
                </button>

                {user?.id === entry.author_id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteEntry(entry.id)
                    }}
                    className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-700 transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    <span>{t('list.actions.delete')}</span>
                  </button>
                )}
              </div>

              <ReadToggleButton
                entryId={entry.id}
                useReaders={useReaders}
                userId={user?.id}
                onToggleRead={handleToggleRead}
                isPending={mutations.toggleRead.isPending}
                markLabel={t('list.readers.mark')}
                unmarkLabel={t('list.readers.unmark')}
              />
            </div>
          </div>
        </div>
      ))}

      {entries.length === 0 && (
        <div className="bg-white dark:bg-[#151b23] border border-gray-200 dark:border-gray-800 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {dayStatusMessage || t('list.emptyState')}
          </p>
        </div>
      )}

      {/* Modals */}
      {commentModalOpen !== null && (
        <NewCommentEntry
          isOpen={commentModalOpen !== null}
          onClose={() => setCommentModalOpen(null)}
          onSubmit={async (payload) => {
            await handleSaveComment(commentModalOpen, payload)
          }}
          title={t('modals.newComment.title')}
          initialComment={newComment}
          initialPriority={commentPriority}
          initialDepartment={commentDepartment}
        />
      )}

      <EditLogbookModal
        isOpen={editModalOpen !== null}
        onClose={() => setEditModalOpen(null)}
        onSave={handleSaveEdit}
        message={editMessage}
        setMessage={setEditMessage}
        priority={editPriority}
        setPriority={setEditPriority}
        department={editDepartment}
        setDepartment={setEditDepartment}
        isSubmitting={mutations.updateLogbook.isPending}
      />

      <EditCommentModal
        isOpen={editCommentModalOpen !== null}
        onClose={() => setEditCommentModalOpen(null)}
        onSave={handleSaveEditComment}
        comment={editCommentText}
        setComment={setEditCommentText}
        priority={editCommentPriority}
        setPriority={setEditCommentPriority}
        department={editCommentDepartment}
        setDepartment={setEditCommentDepartment}
        isSubmitting={mutations.updateComment.isPending}
      />
    </div>
  )
}

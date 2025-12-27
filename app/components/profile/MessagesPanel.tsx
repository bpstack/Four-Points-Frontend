// app/components/profile/MessagesPanel.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useAuth } from '@/app/lib/auth/useAuth'
import { cn } from '@/app/lib/helpers/utils'
import {
  FiSend,
  FiSearch,
  FiMoreVertical,
  FiArrowLeft,
  FiUser,
  FiCheck,
  FiCheckCircle,
  FiPlus,
  FiUsers,
  FiEdit2,
  FiTrash2,
  FiBell,
  FiX,
  FiLoader,
} from 'react-icons/fi'
import { useConversations, useChat, useUserSearch } from '@/app/lib/messaging/hooks'
import type {
  Conversation,
  ConversationWithParticipants,
  ConversationType,
} from '@/app/lib/messaging/types'

// ===============================================
// MAIN COMPONENT
// ===============================================

interface MessagesPanelProps {
  onConversationSelect?: (hasSelection: boolean) => void
}

export function MessagesPanel({ onConversationSelect }: MessagesPanelProps) {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const chatParam = searchParams.get('chat')
  const t = useTranslations('profile.messages')
  const locale = useLocale()

  // Hooks
  const conversations = useConversations({
    initialConversationId: chatParam ? parseInt(chatParam) : null,
  })

  const chat = useChat({
    conversationId: conversations.selectedConversation?.id ?? null,
    onMessageSent: (message) => {
      // Update conversation preview
      conversations.updateConversationLocal(message.conversation_id, {
        last_message: message.content,
        last_message_at: new Date().toISOString(),
      })
    },
  })

  const userSearch = useUserSearch({
    enabled: false, // Manual control
  })

  // Local UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [notify, setNotify] = useState(false)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [showConversationMenu, setShowConversationMenu] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [participants, setParticipants] = useState<ConversationWithParticipants['participants']>([])
  const [loadingParticipants, setLoadingParticipants] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [creatingConversation, setCreatingConversation] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)

  // ===============================================
  // EFFECTS
  // ===============================================

  // Mark as read when selecting conversation
  useEffect(() => {
    if (conversations.selectedConversation) {
      conversations.markAsRead(conversations.selectedConversation.id)
      setShowParticipants(false)
      setParticipants([])
    }
    // Notify parent about selection state
    onConversationSelect?.(!!conversations.selectedConversation)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.selectedConversation?.id])

  // Enable user search when modal opens
  useEffect(() => {
    if (showNewConversation) {
      userSearch.search()
    } else {
      userSearch.reset()
      setGroupName('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNewConversation])

  // Debounced user search (only when query changes, not on initial open)
  useEffect(() => {
    if (!showNewConversation || userSearch.query === '') return

    const timer = setTimeout(() => {
      userSearch.search(userSearch.query)
    }, 300)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSearch.query])

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowConversationMenu(false)
      }
    }

    if (showConversationMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showConversationMenu])

  // ===============================================
  // HANDLERS
  // ===============================================

  const handleSendMessage = async () => {
    if (!newMessage.trim() || chat.sending) return

    try {
      await chat.send(newMessage.trim(), notify)
      setNewMessage('')
      setNotify(false)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleCreateConversation = async () => {
    if (!userSearch.canCreate || creatingConversation) return

    const type: ConversationType = userSearch.isGroup ? 'group' : 'dm'
    if (type === 'group' && !groupName.trim()) {
      alert(t('newConversation.groupNeedsName'))
      return
    }

    try {
      setCreatingConversation(true)
      await conversations.create({
        type,
        name: type === 'group' ? groupName.trim() : undefined,
        participant_ids: userSearch.selectedUsers.map((u) => u.id),
      })
      setShowNewConversation(false)
    } catch (error) {
      console.error('Error creating conversation:', error)
    } finally {
      setCreatingConversation(false)
    }
  }

  const handleEditMessage = async () => {
    if (!chat.editingMessageId || !chat.editContent.trim()) return

    try {
      await chat.edit(chat.editingMessageId, chat.editContent)
    } catch (error) {
      console.error('Error editing message:', error)
    }
  }

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm(t('actions.deleteMessage'))) return

    try {
      await chat.remove(messageId)
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const handleShowParticipants = async () => {
    if (!conversations.selectedConversation || conversations.selectedConversation.type !== 'group')
      return

    if (showParticipants) {
      setShowParticipants(false)
      return
    }

    try {
      setLoadingParticipants(true)
      const data = await conversations.getConversationDetails(conversations.selectedConversation.id)
      setParticipants(data?.participants || [])
      setShowParticipants(true)
    } catch (error) {
      console.error('Error loading participants:', error)
    } finally {
      setLoadingParticipants(false)
    }
  }

  const handleDeleteConversation = async () => {
    if (!conversations.selectedConversation) return
    if (!confirm(t('actions.deleteConversation'))) return

    try {
      await conversations.remove(conversations.selectedConversation.id)
      setShowConversationMenu(false)
    } catch (error) {
      console.error('Error deleting conversation:', error)
      alert(t('actions.noPermission'))
    }
  }

  const handleLeaveConversation = async () => {
    if (!conversations.selectedConversation) return
    if (!confirm(t('actions.leaveGroup'))) return

    try {
      await conversations.leave(conversations.selectedConversation.id)
      setShowConversationMenu(false)
    } catch (error) {
      console.error('Error leaving conversation:', error)
    }
  }

  const handleUserSelect = (user: (typeof userSearch.results)[0]) => {
    // If has existing DM, open it directly
    if (user.existing_dm_id) {
      const existingConv = conversations.conversations.find((c) => c.id === user.existing_dm_id)
      if (existingConv) {
        conversations.select(existingConv)
        setShowNewConversation(false)
        return
      }
    }
    userSearch.toggleUser(user)
  }

  // ===============================================
  // HELPERS
  // ===============================================

  const formatTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 0 || isNaN(diff)) return ''

    const minutes = Math.floor(diff / 1000 / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return t('time.now')
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
      day: 'numeric',
      month: 'short',
    })
  }

  const getRoleColor = (role: string | undefined) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      case 'recepcionista':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'mantenimiento':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const getConversationName = (conv: Conversation) => {
    if (conv.type === 'group') return conv.name || t('conversations.groupNoName')
    return conv.other_username || 'Usuario'
  }

  const getConversationInitial = (conv: Conversation) => {
    const name = getConversationName(conv)
    return name.charAt(0).toUpperCase()
  }

  const filteredConversations = conversations.conversations.filter((conv) => {
    const name = getConversationName(conv).toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  // ===============================================
  // RENDER
  // ===============================================

  if (conversations.loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <FiLoader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-2 md:mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base md:text-xl font-semibold text-gray-900 dark:text-white">
              {t('header.title')}
            </h2>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              {conversations.totalUnread > 0
                ? `${conversations.totalUnread} ${t('header.unread')}`
                : t('header.allRead')}
            </p>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Back to profile button - only visible when conversation is selected */}
            {conversations.selectedConversation && (
              <button
                onClick={() => conversations.select(null)}
                className="p-1.5 md:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title={t('header.backToProfile')}
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowNewConversation(true)}
              className="px-2 py-1 md:px-3 md:py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm rounded-lg flex items-center gap-1 md:gap-1.5 transition-colors"
            >
              <FiPlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">{t('header.new')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Conversations List */}
        <div
          className={cn(
            'w-full md:w-80 flex-shrink-0 flex flex-col bg-gray-50 dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg overflow-hidden',
            conversations.selectedConversation && 'hidden md:flex'
          )}
        >
          {/* Search */}
          <div className="p-3 border-b border-gray-200 dark:border-[#30363d]">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('conversations.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                <FiUser className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">{t('conversations.noConversations')}</p>
                <button
                  onClick={() => setShowNewConversation(true)}
                  className="mt-2 text-blue-500 text-sm hover:underline"
                >
                  {t('conversations.startNew')}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-[#30363d]">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => conversations.select(conv)}
                    className={cn(
                      'w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors',
                      conversations.selectedConversation?.id === conv.id &&
                        'bg-gray-100 dark:bg-[#21262d]'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0',
                          conv.type === 'group'
                            ? 'bg-gradient-to-br from-green-500 to-teal-600'
                            : 'bg-gradient-to-br from-blue-500 to-purple-600'
                        )}
                      >
                        {conv.type === 'group' ? (
                          <FiUsers className="w-5 h-5" />
                        ) : (
                          getConversationInitial(conv)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {getConversationName(conv)}
                          </span>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatTime(conv.last_message_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {conv.last_message || t('conversations.noMessages')}
                          </p>
                          {Number(conv.unread_count) > 0 ? (
                            <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full flex-shrink-0">
                              {conv.unread_count}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div
          className={cn(
            'flex-1 flex flex-col bg-gray-50 dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg overflow-hidden',
            !conversations.selectedConversation && 'hidden md:flex'
          )}
        >
          {conversations.selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-[#30363d] flex items-center gap-3">
                <button
                  onClick={() => conversations.select(null)}
                  className="md:hidden p-1 hover:bg-gray-100 dark:hover:bg-[#21262d] rounded-lg transition-colors"
                >
                  <FiArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium',
                    conversations.selectedConversation.type === 'group'
                      ? 'bg-gradient-to-br from-green-500 to-teal-600'
                      : 'bg-gradient-to-br from-blue-500 to-purple-600'
                  )}
                >
                  {conversations.selectedConversation.type === 'group' ? (
                    <FiUsers className="w-4 h-4" />
                  ) : (
                    getConversationInitial(conversations.selectedConversation)
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {getConversationName(conversations.selectedConversation)}
                  </p>
                  {conversations.selectedConversation.type === 'dm' &&
                    conversations.selectedConversation.other_role && (
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded text-xs font-medium',
                          getRoleColor(conversations.selectedConversation.other_role)
                        )}
                      >
                        {conversations.selectedConversation.other_role}
                      </span>
                    )}
                  {conversations.selectedConversation.type === 'group' && (
                    <button
                      onClick={handleShowParticipants}
                      className="text-xs text-gray-500 hover:text-blue-500 hover:underline transition-colors flex items-center gap-1"
                      disabled={loadingParticipants}
                    >
                      {loadingParticipants ? <FiLoader className="w-3 h-3 animate-spin" /> : null}
                      {conversations.selectedConversation.participant_count}{' '}
                      {t('chat.participants')}
                    </button>
                  )}
                </div>
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowConversationMenu(!showConversationMenu)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-[#21262d] rounded-lg transition-colors"
                  >
                    <FiMoreVertical className="w-4 h-4 text-gray-500" />
                  </button>

                  {showConversationMenu && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] rounded-lg shadow-lg py-1 z-50">
                      {conversations.selectedConversation.type === 'group' && (
                        <button
                          onClick={handleLeaveConversation}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#30363d] flex items-center gap-2"
                        >
                          <FiArrowLeft className="w-4 h-4" />
                          {t('actions.leaveGroupButton')}
                        </button>
                      )}
                      <button
                        onClick={handleDeleteConversation}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        {t('actions.deleteConversationButton')}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div ref={chat.containerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {chat.hasMore && (
                  <div className="text-center">
                    <button
                      onClick={chat.loadMore}
                      disabled={chat.loading}
                      className="text-sm text-blue-500 hover:underline disabled:opacity-50"
                    >
                      {chat.loading ? t('chat.loading') : t('chat.loadPrevious')}
                    </button>
                  </div>
                )}

                {chat.messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id
                  const isEditing = chat.editingMessageId === msg.id

                  return (
                    <div
                      key={msg.id}
                      className={cn('flex group', isOwn ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[80%] px-3 py-2 rounded-lg relative',
                          isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] text-gray-900 dark:text-white'
                        )}
                      >
                        {!isOwn && conversations.selectedConversation?.type === 'group' && (
                          <p className="text-xs font-medium mb-1 text-blue-500">
                            {msg.sender_username}
                          </p>
                        )}

                        {isEditing ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={chat.editContent}
                              onChange={(e) => chat.setEditContent(e.target.value)}
                              className="flex-1 px-2 py-1 text-sm bg-white dark:bg-[#21262d] border rounded text-gray-900 dark:text-white"
                              autoFocus
                            />
                            <button onClick={handleEditMessage} className="text-green-500">
                              <FiCheck className="w-4 h-4" />
                            </button>
                            <button onClick={chat.cancelEdit} className="text-red-500">
                              <FiX className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}

                        <div
                          className={cn(
                            'flex items-center justify-end gap-1 mt-1',
                            isOwn ? 'text-blue-200' : 'text-gray-400'
                          )}
                        >
                          {!!msg.is_edited && (
                            <span className="text-xs italic">{t('chat.edited')}</span>
                          )}
                          <span className="text-xs">{formatTime(msg.created_at)}</span>
                          {isOwn && <FiCheckCircle className="w-3 h-3" />}
                        </div>

                        {isOwn && !isEditing && (
                          <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1">
                            <button
                              onClick={() => chat.startEdit(msg)}
                              className="p-1 bg-white dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] rounded shadow-sm hover:bg-gray-100 dark:hover:bg-[#30363d]"
                            >
                              <FiEdit2 className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1 bg-white dark:bg-[#21262d] border border-gray-200 dark:border-[#30363d] rounded shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <FiTrash2 className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                <div ref={chat.messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-gray-200 dark:border-[#30363d]">
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setNotify(!notify)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      notify
                        ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'hover:bg-gray-100 dark:hover:bg-[#21262d] text-gray-400'
                    )}
                    title={notify ? t('chat.notificationActive') : t('chat.activateNotification')}
                  >
                    <FiBell className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    placeholder={t('chat.writeMessage')}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    className="flex-1 px-3 py-2 text-sm bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || chat.sending}
                    className="p-1.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:opacity-50 text-white rounded-md md:rounded-lg transition-colors"
                  >
                    {chat.sending ? (
                      <FiLoader className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                    ) : (
                      <FiSend className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    )}
                  </button>
                </div>
                {notify && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    {t('chat.urgentNotification')}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-4">
              <FiUser className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm font-medium">{t('chat.selectConversation')}</p>
              <p className="text-xs text-gray-400 mt-1">{t('chat.chooseContact')}</p>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#161b22] rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 dark:border-[#30363d] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('newConversation.title')}
              </h3>
              <button
                onClick={() => setShowNewConversation(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-[#21262d] rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Selected Users */}
            {userSearch.selectedUsers.length > 0 && (
              <div className="p-3 border-b border-gray-200 dark:border-[#30363d]">
                <div className="flex flex-wrap gap-2">
                  {userSearch.selectedUsers.map((u) => (
                    <span
                      key={u.id}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm rounded-full flex items-center gap-1"
                    >
                      {u.username}
                      <button onClick={() => userSearch.toggleUser(u)}>
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                {userSearch.isGroup && (
                  <input
                    type="text"
                    placeholder={t('newConversation.groupName')}
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full mt-2 px-3 py-2 text-sm bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>
            )}

            {/* Search */}
            <div className="p-3 border-b border-gray-200 dark:border-[#30363d]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('newConversation.searchUsers')}
                  value={userSearch.query}
                  onChange={(e) => userSearch.setQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto">
              {userSearch.loading ? (
                <div className="flex items-center justify-center py-8">
                  <FiLoader className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : userSearch.results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <FiUser className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">{t('newConversation.noUsersFound')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-[#30363d]">
                  {userSearch.results.map((u) => {
                    const isSelected = userSearch.isSelected(u.id)
                    return (
                      <button
                        key={u.id}
                        onClick={() => handleUserSelect(u)}
                        className={cn(
                          'w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors flex items-center gap-3',
                          isSelected && 'bg-blue-50 dark:bg-blue-900/20'
                        )}
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {u.username}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                        <span
                          className={cn('px-2 py-0.5 rounded text-xs', getRoleColor(u.role_name))}
                        >
                          {u.role_name}
                        </span>
                        {u.existing_dm_id && (
                          <span className="text-xs text-blue-500">
                            {t('newConversation.existingChat')}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-[#30363d]">
              <button
                onClick={handleCreateConversation}
                disabled={!userSearch.canCreate || creatingConversation}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {creatingConversation ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    {t('newConversation.creating')}
                  </>
                ) : userSearch.isGroup ? (
                  <>
                    <FiUsers className="w-4 h-4" />
                    {t('newConversation.createGroup')}
                  </>
                ) : (
                  <>
                    <FiSend className="w-4 h-4" />
                    {t('newConversation.startChat')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Participants Modal */}
      {showParticipants && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowParticipants(false)}
        >
          <div
            className="bg-white dark:bg-[#161b22] rounded-lg shadow-xl w-full max-w-sm max-h-[60vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 dark:border-[#30363d] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('participants.title')}
              </h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-[#21262d] rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Participants List */}
            <div className="flex-1 overflow-y-auto">
              {participants.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <FiLoader className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-[#30363d]">
                  {participants.map((p) => (
                    <div key={p.user_id} className="px-4 py-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        {p.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {p.username}
                          {p.user_id === user?.id && (
                            <span className="text-gray-400 ml-1">({t('participants.you')})</span>
                          )}
                        </p>
                        {p.role_name && (
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-xs',
                              getRoleColor(p.role_name)
                            )}
                          >
                            {p.role_name}
                          </span>
                        )}
                      </div>
                      {p.is_admin && (
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded">
                          Admin
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

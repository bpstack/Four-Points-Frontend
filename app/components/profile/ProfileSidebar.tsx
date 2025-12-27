// app/components/profile/ProfileSidebar.tsx

'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/app/lib/auth/useAuth'
import { apiClient } from '@/app/lib/apiClient'
import { API_BASE_URL } from '@/app/lib/env'
import {
  FiUser,
  FiLock,
  FiCamera,
  FiMessageSquare,
  FiSettings,
  FiBell,
  FiChevronRight,
  FiEdit2,
  FiCheck,
  FiX,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiTrash2,
  FiUpload,
} from 'react-icons/fi'
import { cn } from '@/app/lib/helpers/utils'

const API_URL = API_BASE_URL
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

export function ProfileSidebar() {
  const t = useTranslations('profile.sidebar')
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activePanel = searchParams.get('panel')

  // Edit states
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [isEditingPassword, setIsEditingPassword] = useState(false)

  // Form states - Username
  const [newUsername, setNewUsername] = useState('')
  const [usernamePassword, setUsernamePassword] = useState('')
  const [usernameLoading, setUsernameLoading] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null)

  // Form states - Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Form states - Avatar
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)

  if (!user) return null

  const handleNavigate = (panel: string | null) => {
    if (panel) {
      router.push(`/dashboard/profile?panel=${panel}`, { scroll: false })
    } else {
      router.push('/dashboard/profile', { scroll: false })
    }
  }

  const formattedUsername =
    user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase()

  // ============================
  // Username Edit Handlers
  // ============================
  const handleStartEditUsername = () => {
    setIsEditingUsername(true)
    setNewUsername(user.username)
    setUsernamePassword('')
    setUsernameError(null)
    setUsernameSuccess(null)
  }

  const handleCancelEditUsername = () => {
    setIsEditingUsername(false)
    setNewUsername('')
    setUsernamePassword('')
    setUsernameError(null)
    setUsernameSuccess(null)
  }

  const handleSaveUsername = async () => {
    // Validations
    if (!newUsername.trim()) {
      setUsernameError(t('validation.usernameRequired'))
      return
    }

    if (newUsername.trim().length < 3) {
      setUsernameError(t('validation.usernameMinLength'))
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(newUsername.trim())) {
      setUsernameError(t('validation.usernameChars'))
      return
    }

    if (!usernamePassword) {
      setUsernameError(t('validation.enterCurrentPassword'))
      return
    }

    setUsernameLoading(true)
    setUsernameError(null)

    try {
      await apiClient.patch(`${API_URL}/api/auth/me/profile`, {
        username: newUsername.trim(),
        currentPassword: usernamePassword,
      })

      setUsernameSuccess(t('success.usernameUpdated'))
      setIsEditingUsername(false)
      setNewUsername('')
      setUsernamePassword('')

      // Refresh user data
      if (refreshUser) {
        await refreshUser()
      }

      // Clear success message after 3 seconds
      setTimeout(() => setUsernameSuccess(null), 3000)
    } catch (error: unknown) {
      console.error('Error updating username:', error)
      setUsernameError(error instanceof Error ? error.message : t('errors.updateUsername'))
    } finally {
      setUsernameLoading(false)
    }
  }

  // ============================
  // Password Edit Handlers
  // ============================
  const handleStartEditPassword = () => {
    setIsEditingPassword(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError(null)
  }

  const handleCancelEditPassword = () => {
    setIsEditingPassword(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError(null)
  }

  const handleSavePassword = async () => {
    // Validations
    if (!currentPassword) {
      setPasswordError(t('validation.enterPassword'))
      return
    }

    if (!newPassword) {
      setPasswordError(t('validation.enterNewPassword'))
      return
    }

    if (newPassword.length < 6) {
      setPasswordError(t('validation.passwordMinLength'))
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('validation.passwordsNoMatch'))
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError(t('validation.passwordMustDiffer'))
      return
    }

    setPasswordLoading(true)
    setPasswordError(null)

    try {
      await apiClient.patch(`${API_URL}/api/auth/me/password`, {
        currentPassword,
        newPassword,
        confirmPassword,
      })

      // Redirect to login with message
      router.push('/login?message=password_changed')
    } catch (error: unknown) {
      console.error('Error updating password:', error)
      setPasswordError(error instanceof Error ? error.message : t('errors.updatePassword'))
      setPasswordLoading(false)
    }
  }

  // ============================
  // Avatar Handlers
  // ============================
  const handleAvatarClick = () => {
    setShowAvatarMenu(!showAvatarMenu)
    setAvatarError(null)
  }

  const handleUploadClick = () => {
    setShowAvatarMenu(false)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input
    e.target.value = ''

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setAvatarError(t('avatar.allowedTypes'))
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setAvatarError(t('avatar.maxSize'))
      return
    }

    setAvatarLoading(true)
    setAvatarError(null)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      await apiClient.postFormData(`${API_URL}/api/auth/me/avatar`, formData)

      // Refresh user data to get new avatar URL
      if (refreshUser) {
        await refreshUser()
      }
    } catch (error: unknown) {
      console.error('Error uploading avatar:', error)
      setAvatarError(error instanceof Error ? error.message : t('errors.uploadImage'))
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleDeleteAvatar = async () => {
    setShowAvatarMenu(false)
    setAvatarLoading(true)
    setAvatarError(null)

    try {
      await apiClient.delete(`${API_URL}/api/auth/me/avatar`)

      // Refresh user data
      if (refreshUser) {
        await refreshUser()
      }
    } catch (error: unknown) {
      console.error('Error deleting avatar:', error)
      setAvatarError(error instanceof Error ? error.message : t('errors.deleteImage'))
    } finally {
      setAvatarLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      {/* Profile Header */}
      <div className="bg-gray-50 dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative group flex-shrink-0">
            {/* Avatar */}
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.username}
                width={96}
                height={96}
                className="w-20 h-20 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                quality={90}
                priority
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-semibold ring-2 ring-gray-200 dark:ring-gray-700">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Avatar Overlay Button */}
            <button
              onClick={handleAvatarClick}
              disabled={avatarLoading}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
            >
              {avatarLoading ? (
                <span className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <FiCamera className="w-6 h-6 text-white" />
              )}
            </button>

            {/* Avatar Menu Dropdown */}
            {showAvatarMenu && (
              <div className="absolute left-0 top-full mt-1 z-10 w-36 py-1 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg shadow-lg">
                <button
                  onClick={handleUploadClick}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#21262d]"
                >
                  <FiUpload className="w-3.5 h-3.5" />
                  {user.avatar_url ? t('avatar.changePhoto') : t('avatar.uploadPhoto')}
                </button>
                {user.avatar_url && (
                  <button
                    onClick={handleDeleteAvatar}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-[#21262d]"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                    {t('avatar.deletePhoto')}
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {formattedUsername}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email || t('noEmail')}
            </p>
            <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {user.role}
            </span>
          </div>
        </div>

        {/* Avatar Error Message */}
        {avatarError && (
          <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <FiAlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400">{avatarError}</p>
            <button
              onClick={() => setAvatarError(null)}
              className="ml-auto p-0.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded"
            >
              <FiX className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Success Message */}
      {usernameSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <FiCheck className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-xs text-green-700 dark:text-green-400">{usernameSuccess}</p>
        </div>
      )}

      {/* Username Section */}
      <div className="bg-gray-50 dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg overflow-hidden">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FiUser className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {t('username.label')}
              </span>
            </div>
            {!isEditingUsername && (
              <button
                onClick={handleStartEditUsername}
                className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                title={t('username.editTitle')}
              >
                <FiEdit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {!isEditingUsername ? (
            <p className="text-sm text-gray-900 dark:text-white">{formattedUsername}</p>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {t('username.newUsername')}
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder={t('username.placeholder')}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  disabled={usernameLoading}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {t('username.currentPasswordConfirm')}
                </label>
                <input
                  type="password"
                  value={usernamePassword}
                  onChange={(e) => setUsernamePassword(e.target.value)}
                  placeholder={t('username.passwordPlaceholder')}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  disabled={usernameLoading}
                />
              </div>

              {usernameError && (
                <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{usernameError}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSaveUsername}
                  disabled={usernameLoading}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {usernameLoading ? (
                    <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <FiCheck className="w-3.5 h-3.5" />
                  )}
                  {usernameLoading ? t('buttons.saving') : t('buttons.save')}
                </button>
                <button
                  onClick={handleCancelEditUsername}
                  disabled={usernameLoading}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] hover:bg-gray-50 dark:hover:bg-[#21262d] disabled:opacity-50 rounded-lg transition-colors"
                >
                  <FiX className="w-3.5 h-3.5" />
                  {t('buttons.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-gray-50 dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg overflow-hidden">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FiLock className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {t('password.label')}
              </span>
            </div>
            {!isEditingPassword && (
              <button
                onClick={handleStartEditPassword}
                className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                title={t('password.changeTitle')}
              >
                <FiEdit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {!isEditingPassword ? (
            <p className="text-sm text-gray-900 dark:text-white">••••••••</p>
          ) : (
            <div className="space-y-3">
              {/* Current Password */}
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {t('password.current')}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t('password.currentPlaceholder')}
                    className="w-full px-3 py-2 pr-10 text-sm bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showCurrentPassword ? (
                      <FiEyeOff className="w-4 h-4" />
                    ) : (
                      <FiEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {t('password.new')}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('password.minChars')}
                    className="w-full px-3 py-2 pr-10 text-sm bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showNewPassword ? (
                      <FiEyeOff className="w-4 h-4" />
                    ) : (
                      <FiEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {t('password.confirm')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('password.repeatPlaceholder')}
                    className="w-full px-3 py-2 pr-10 text-sm bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff className="w-4 h-4" />
                    ) : (
                      <FiEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {t('password.warning')}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSavePassword}
                  disabled={passwordLoading}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {passwordLoading ? (
                    <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <FiCheck className="w-3.5 h-3.5" />
                  )}
                  {passwordLoading ? t('buttons.updating') : t('buttons.update')}
                </button>
                <button
                  onClick={handleCancelEditPassword}
                  disabled={passwordLoading}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] hover:bg-gray-50 dark:hover:bg-[#21262d] disabled:opacity-50 rounded-lg transition-colors"
                >
                  <FiX className="w-3.5 h-3.5" />
                  {t('buttons.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-50 dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-lg overflow-hidden">
        <NavButton
          icon={<FiMessageSquare className="w-4 h-4" />}
          label={t('navigation.messages')}
          description={t('navigation.messagesDesc')}
          active={activePanel === 'messages'}
          onClick={() => handleNavigate('messages')}
        />
        <NavButton
          icon={<FiBell className="w-4 h-4" />}
          label={t('navigation.notifications')}
          description={t('navigation.notificationsDesc')}
          active={activePanel === 'notifications'}
          onClick={() => handleNavigate('notifications')}
          borderTop
        />
        <NavButton
          icon={<FiSettings className="w-4 h-4" />}
          label={t('navigation.settings')}
          description={t('navigation.settingsDesc')}
          active={activePanel === 'settings'}
          onClick={() => handleNavigate('settings')}
          borderTop
        />
      </div>
    </div>
  )
}

function NavButton({
  icon,
  label,
  description,
  active,
  onClick,
  borderTop,
}: {
  icon: React.ReactNode
  label: string
  description: string
  active: boolean
  onClick: () => void
  borderTop?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between p-3 transition-colors text-left',
        borderTop && 'border-t border-gray-200 dark:border-[#30363d]',
        active ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-[#21262d]'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'p-2 rounded-md',
            active
              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          )}
        >
          {icon}
        </div>
        <div>
          <p
            className={cn(
              'text-sm font-medium',
              active ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'
            )}
          >
            {label}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <FiChevronRight
        className={cn(
          'w-4 h-4',
          active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
        )}
      />
    </button>
  )
}

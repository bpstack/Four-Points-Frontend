// app/components/profile/SettingsPanel.tsx

'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { apiClient, isDemoError } from '@/app/lib/apiClient'
import { API_BASE_URL } from '@/app/lib/env'
import { useAuth } from '@/app/lib/auth/useAuth'
import NewUserModal from '@/app/components/auth/NewUserModal'
import { UsersTableSkeleton } from '@/app/ui/skeletons'
import { notificationsApi } from '@/app/lib/groups'
import { departmentsApi } from '@/app/lib/departments'
import { formatDepartmentName } from '@/app/lib/logbooks/hooks/useDepartments'
import { cn } from '@/app/lib/helpers/utils'
import { isAdminRole } from '@/app/lib/helpers/utils'
import { toast } from 'react-hot-toast'
import {
  FiUsers,
  FiBell,
  FiShield,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiUserPlus,
  FiCheck,
  FiX,
  FiChevronDown,
  FiFileText,
  FiGrid,
  FiPlus,
  FiKey,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi'
import { ReportsTab } from './reports'
import { CenterModal, CenterModalFooterButtons, FormField, inputClassName } from '@/app/ui/panels'
import { GlobalNotificationModal } from '@/app/components/notifications/GlobalNotificationModal'

// Types
interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'group-admin' | 'recepcionista' | 'mantenimiento' | string
  created_at?: string
  updated_at?: string
}

interface Department {
  id: number
  name: string
}

interface FormattedDepartment extends Department {
  displayName: string
}

type SettingsTab = 'users' | 'notifications' | 'security' | 'reports' | 'departments'

const API_URL = API_BASE_URL

// Role colors (labels are added dynamically with translations)
const ROLE_COLORS = {
  admin: {
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  'group-admin': {
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  recepcionista: {
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  mantenimiento: {
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
}

// Tab definitions moved inside component to use translations

export function SettingsPanel() {
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isUserAdmin = isAdminRole(currentUser?.role)
  const t = useTranslations('profile.settings')

  // Define tabs with translations (inside component to access t())
  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] =
    useMemo(
      () => [
        {
          id: 'users',
          label: t('tabs.users'),
          icon: <FiUsers className="w-4 h-4" />,
          adminOnly: true,
        },
        {
          id: 'departments',
          label: t('tabs.departments'),
          icon: <FiGrid className="w-4 h-4" />,
          adminOnly: true,
        },
        {
          id: 'notifications',
          label: t('tabs.notifications'),
          icon: <FiBell className="w-4 h-4" />,
        },
        { id: 'security', label: t('tabs.security'), icon: <FiShield className="w-4 h-4" /> },
        {
          id: 'reports',
          label: t('tabs.reports'),
          icon: <FiFileText className="w-4 h-4" />,
          adminOnly: true,
        },
      ],
      [t]
    )

  const activeTab =
    (searchParams.get('tab') as SettingsTab) || (isUserAdmin ? 'users' : 'notifications')

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Mobile dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const availableTabs = tabs.filter((tab) => !tab.adminOnly || isUserAdmin)
  const activeTabConfig = availableTabs.find((t) => t.id === activeTab) || availableTabs[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (activeTab === 'users' && isUserAdmin) {
      fetchUsers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isUserAdmin])

  const handleTabChange = (tab: SettingsTab) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`/dashboard/profile?${params.toString()}`, { scroll: false })
    setIsDropdownOpen(false)
  }

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.get<User[] | { users?: User[]; data?: User[] }>(
        `${API_URL}/api/users`
      )
      const usersList = Array.isArray(data)
        ? data
        : (data as { users?: User[] }).users || (data as { data?: User[] }).data || []
      if (!Array.isArray(usersList)) {
        setError(t('users.errorLoading'))
        setUsers([])
        return
      }
      setUsers(usersList)
    } catch (err: unknown) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : t('users.errorLoading'))
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm(t('users.confirmDelete'))) return
    try {
      await apiClient.delete(`${API_URL}/api/users/${id}`)
      setUsers(users.filter((u) => u.id !== id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t('users.errorDeleting'))
    }
  }

  return (
    <div className="h-full max-w-[1400px]">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('title')}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('subtitle')}</p>
      </div>

      {/* Tabs - Mobile Dropdown */}
      <div className="md:hidden mb-4" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <span className="flex items-center gap-2">
            {activeTabConfig.icon}
            {activeTabConfig.label}
          </span>
          <FiChevronDown
            className={cn('w-4 h-4 transition-transform', isDropdownOpen && 'rotate-180')}
          />
        </button>

        {isDropdownOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />
            {/* Centered Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-sm bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('selectSection')}
                  </h3>
                </div>
                <div className="py-1">
                  {availableTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3 text-sm transition-colors',
                        activeTab === tab.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {tab.icon}
                        {tab.label}
                      </span>
                      {activeTab === tab.id && <FiCheck className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tabs - Desktop */}
      <div className="hidden md:block border-b border-gray-200 dark:border-[#30363d] mb-6">
        <nav className="flex gap-4">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'users' && isUserAdmin && (
          <UserManagement
            users={users}
            loading={loading}
            error={error}
            onDelete={handleDeleteUser}
            onRefresh={fetchUsers}
            onOpenModal={() => setIsModalOpen(true)}
          />
        )}
        {activeTab === 'departments' && isUserAdmin && <DepartmentsTab />}
        {activeTab === 'notifications' && <NotificationsSettings />}
        {activeTab === 'security' && <SecuritySettings />}
        {activeTab === 'reports' && isUserAdmin && <ReportsTab />}
      </div>

      {/* Modal */}
      {isUserAdmin && (
        <NewUserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchUsers}
        />
      )}
    </div>
  )
}

// =====================================================
// DEPARTMENTS TAB
// =====================================================

function DepartmentsTab() {
  const t = useTranslations('profile.settings.departments')
  const [departments, setDepartments] = useState<FormattedDepartment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<FormattedDepartment | null>(null)

  const loadDepartments = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await departmentsApi.getAll()
      const formatted: FormattedDepartment[] = data.map((dept) => ({
        ...dept,
        displayName: formatDepartmentName(dept.name),
      }))
      formatted.sort((a, b) =>
        a.displayName.localeCompare(b.displayName, 'es', { sensitivity: 'base' })
      )
      setDepartments(formatted)
    } catch (err) {
      console.error('Error loading departments:', err)
      toast.error(t('errorLoading'))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadDepartments()
  }, [loadDepartments])

  const handleDelete = async (id: number, displayName: string) => {
    if (!confirm(t('confirmDelete', { name: displayName }))) return
    try {
      await departmentsApi.delete(id)
      toast.success(t('deleted'))
      loadDepartments()
    } catch (err: unknown) {
      console.error('Error deleting department:', err)
      if (!isDemoError(err)) {
        const error = err as { response?: { data?: { error?: string } } }
        toast.error(error?.response?.data?.error || t('errorDeleting'))
      }
    }
  }

  const handleEdit = (department: FormattedDepartment) => {
    setSelectedDepartment(department)
    setIsEditModalOpen(true)
  }

  return (
    <div className="bg-white dark:bg-[#161b22] rounded-lg border border-gray-200 dark:border-[#30363d]">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-[#30363d]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('title')}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('subtitle')} ({departments.length} {t('total')})
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <FiPlus className="w-3.5 h-3.5" />
              {t('new')}
            </button>
            <button
              onClick={loadDepartments}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] hover:bg-gray-50 dark:hover:bg-[#21262d] rounded-lg transition-colors disabled:opacity-50"
            >
              <FiRefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {isLoading && (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg" />
            ))}
          </div>
        )}

        {!isLoading && departments.length === 0 && (
          <div className="text-center py-8">
            <FiGrid className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{t('noDepartments')}</p>
          </div>
        )}

        {!isLoading && departments.length > 0 && (
          <div className="space-y-2">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    #{dept.id}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {dept.displayName}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(dept)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id, dept.displayName)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AddDepartmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadDepartments}
      />

      {/* Edit Modal */}
      {selectedDepartment && (
        <EditDepartmentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedDepartment(null)
          }}
          onSuccess={loadDepartments}
          department={selectedDepartment}
        />
      )}
    </div>
  )
}

// =====================================================
// DEPARTMENT MODALS (usando CenterModal)
// =====================================================

function AddDepartmentModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const t = useTranslations('profile.settings.departments')
  const tButtons = useTranslations('profile.sidebar.buttons')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName('')
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (name.trim().length < 2) {
      toast.error(t('nameMinLength'))
      return
    }

    setIsSubmitting(true)
    try {
      await departmentsApi.create({ name: name.trim().toLowerCase() })
      toast.success(t('created'))
      setName('')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      if (!isDemoError(err)) {
        toast.error(err instanceof Error ? err.message : t('errorCreating'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CenterModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('newDepartment')}
      size="sm"
      headerIcon={<FiGrid className="w-5 h-5 text-green-600 dark:text-green-400" />}
      footer={
        <CenterModalFooterButtons
          onCancel={onClose}
          onSubmit={handleSubmit}
          cancelText={tButtons('cancel')}
          submitText={t('create')}
          isSubmitting={isSubmitting}
          submitDisabled={name.trim().length < 2}
          submitVariant="success"
        />
      }
    >
      <FormField label={t('departmentName')} required hint={t('saveHint')}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClassName}
          placeholder={t('placeholder')}
          disabled={isSubmitting}
          autoFocus
        />
      </FormField>
    </CenterModal>
  )
}

function EditDepartmentModal({
  isOpen,
  onClose,
  onSuccess,
  department,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  department: FormattedDepartment
}) {
  const t = useTranslations('profile.settings.departments')
  const tButtons = useTranslations('profile.sidebar.buttons')
  const [name, setName] = useState(department.name)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName(department.name)
    }
  }, [isOpen, department.name])

  const handleSubmit = async () => {
    if (name.trim().length < 2) {
      toast.error(t('nameMinLength'))
      return
    }

    setIsSubmitting(true)
    try {
      await departmentsApi.update(department.id, { name: name.trim().toLowerCase() })
      toast.success(t('updated'))
      onSuccess()
      onClose()
    } catch (err: unknown) {
      if (!isDemoError(err)) {
        toast.error(err instanceof Error ? err.message : t('errorUpdating'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CenterModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('editDepartment')}
      size="sm"
      headerIcon={<FiEdit2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
      footer={
        <CenterModalFooterButtons
          onCancel={onClose}
          onSubmit={handleSubmit}
          cancelText={tButtons('cancel')}
          submitText={tButtons('save')}
          isSubmitting={isSubmitting}
          submitDisabled={name.trim().length < 2}
          submitVariant="primary"
        />
      }
    >
      <FormField label={t('departmentName')} required hint={t('editHint')}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClassName}
          placeholder={t('placeholder')}
          disabled={isSubmitting}
          autoFocus
        />
      </FormField>
    </CenterModal>
  )
}

// =====================================================
// USER MANAGEMENT
// =====================================================

function UserManagement({
  users,
  loading,
  error,
  onDelete,
  onRefresh,
  onOpenModal,
}: {
  users: User[]
  loading: boolean
  error: string | null
  onDelete: (id: string) => void
  onRefresh: () => void
  onOpenModal: () => void
}) {
  const t = useTranslations('profile.settings.users')

  return (
    <div className="bg-white dark:bg-[#161b22] rounded-lg border border-gray-200 dark:border-[#30363d]">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-[#30363d]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('title')}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onOpenModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <FiUserPlus className="w-3.5 h-3.5" />
              {t('new')}
            </button>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] hover:bg-gray-50 dark:hover:bg-[#21262d] rounded-lg transition-colors disabled:opacity-50"
            >
              <FiRefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading && <UsersTableSkeleton />}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && users.length === 0 && (
          <div className="text-center py-8">
            <FiUsers className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{t('noUsers')}</p>
          </div>
        )}

        {!loading && !error && users.length > 0 && <UserTable users={users} onDelete={onDelete} />}
      </div>
    </div>
  )
}

function UserTable({ users, onDelete }: { users: User[]; onDelete: (id: string) => void }) {
  const t = useTranslations('profile.settings')
  const tButtons = useTranslations('profile.sidebar.buttons')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<User>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    userId: string
    username: string
  } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)

  // Role config with translations
  const ROLE_CONFIG = useMemo(
    () => ({
      admin: {
        label: t('roles.admin'),
        ...ROLE_COLORS.admin,
      },
      'group-admin': {
        label: t('roles.groupAdmin'),
        ...ROLE_COLORS['group-admin'],
      },
      recepcionista: {
        label: t('roles.receptionist'),
        ...ROLE_COLORS.recepcionista,
      },
      mantenimiento: {
        label: t('roles.maintenance'),
        ...ROLE_COLORS.mantenimiento,
      },
    }),
    [t]
  )

  const handleEdit = (user: User) => {
    setEditingId(user.id)
    setEditForm({ username: user.username, email: user.email, role: user.role })
  }

  const handleSave = async (id: string) => {
    if (!editForm.username || !editForm.email || !editForm.role) {
      alert(t('users.allFieldsRequired'))
      return
    }
    setSavingId(id)
    try {
      await apiClient.put(`${API_URL}/api/users/${id}`, editForm)
      setEditingId(null)
      setEditForm({})
      window.location.reload()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t('users.errorUpdating'))
    } finally {
      setSavingId(null)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleResetPassword = async () => {
    if (!resetPasswordModal || !newPassword) return
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setResettingPassword(true)
    try {
      await apiClient.post(`${API_URL}/api/users/${resetPasswordModal.userId}/reset-password`, {
        newPassword,
      })
      toast.success(`Contraseña de ${resetPasswordModal.username} actualizada`)
      setResetPasswordModal(null)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al resetear contraseña')
    } finally {
      setResettingPassword(false)
    }
  }

  const getRoleConfig = (role: string) => {
    return ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.recepcionista
  }

  return (
    <div className="space-y-2">
      {users.map((user) => {
        const roleConfig = getRoleConfig(user.role)
        const isEditing = editingId === user.id

        return (
          <div
            key={user.id}
            className="bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-lg p-3"
          >
            {isEditing ? (
              <div className="space-y-3 md:space-y-0 md:flex md:items-center md:gap-3">
                <input
                  type="text"
                  value={editForm.username || ''}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  placeholder="Username"
                  className="w-full md:w-40 px-3 py-1.5 text-sm border border-gray-300 dark:border-[#30363d] rounded-lg bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white"
                />
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="Email"
                  className="w-full md:flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-[#30363d] rounded-lg bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white"
                />
                <select
                  value={editForm.role || ''}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full md:w-40 px-3 py-1.5 text-sm border border-gray-300 dark:border-[#30363d] rounded-lg bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white"
                >
                  <option value="recepcionista">{t('roles.receptionist')}</option>
                  <option value="admin">{t('roles.admin')}</option>
                  <option value="group-admin">{t('roles.groupAdmin')}</option>
                  <option value="mantenimiento">{t('roles.maintenance')}</option>
                </select>
                <div className="flex gap-2 md:flex-shrink-0">
                  <button
                    onClick={() => handleSave(user.id)}
                    disabled={savingId === user.id}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg"
                  >
                    <FiCheck className="w-3.5 h-3.5" />
                    {savingId === user.id ? tButtons('saving') : tButtons('save')}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-lg"
                  >
                    <FiX className="w-3.5 h-3.5" />
                    {tButtons('cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                {/* Avatar + Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                    {user.username.charAt(0).toUpperCase()}
                  </div>

                  {/* Mobile: stacked layout */}
                  <div className="min-w-0 flex-1 md:hidden">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                    <span
                      className={cn(
                        'inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium border',
                        roleConfig.color,
                        roleConfig.borderColor
                      )}
                    >
                      {roleConfig.label}
                    </span>
                  </div>

                  {/* Desktop: horizontal layout */}
                  <div className="hidden md:flex md:items-center md:gap-4 md:flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate w-32 flex-shrink-0">
                      {user.username}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex-1">
                      {user.email}
                    </p>
                    <span
                      className={cn(
                        'inline-flex px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0',
                        roleConfig.color,
                        roleConfig.borderColor
                      )}
                    >
                      {roleConfig.label}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() =>
                      setResetPasswordModal({ userId: user.id, username: user.username })
                    }
                    className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Reset password"
                  >
                    <FiKey className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleEdit(user)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(user.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Reset Password Modal */}
      <CenterModal
        isOpen={!!resetPasswordModal}
        onClose={() => {
          setResetPasswordModal(null)
          setNewPassword('')
          setConfirmPassword('')
          setShowPassword(false)
        }}
        title={`Resetear contraseña de ${resetPasswordModal?.username}`}
        size="sm"
        headerIcon={<FiKey className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
        footer={
          <CenterModalFooterButtons
            onCancel={() => {
              setResetPasswordModal(null)
              setNewPassword('')
              setConfirmPassword('')
              setShowPassword(false)
            }}
            onSubmit={handleResetPassword}
            submitText={resettingPassword ? 'Guardando...' : 'Guardar'}
            submitDisabled={
              resettingPassword || newPassword.length < 6 || newPassword !== confirmPassword
            }
            isSubmitting={resettingPassword}
          />
        }
      >
        <div className="space-y-4">
          <FormField label="Nueva contraseña" required>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={inputClassName}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>
          <FormField label="Confirmar contraseña" required>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetir contraseña"
                className={inputClassName}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="mt-1 text-xs text-red-500">Las contraseñas no coinciden</p>
            )}
          </FormField>
        </div>
      </CenterModal>
    </div>
  )
}

// =====================================================
// NOTIFICATIONS & SECURITY SETTINGS
// =====================================================

function NotificationsSettings() {
  const t = useTranslations('profile.settings.notifications')
  const [checkingNotifications, setCheckingNotifications] = useState(false)
  const [notificationResult, setNotificationResult] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)

  const handleCheckNotifications = async () => {
    setCheckingNotifications(true)
    setNotificationResult(null)
    try {
      const response = await notificationsApi.checkPending()
      setNotificationResult({
        type: 'success',
        message: response.data
          ? `${t('verified')}: ${response.data.checked}, ${t('sent')}: ${response.data.sent}, ${t('failed')}: ${response.data.failed}`
          : response.message,
      })
      setTimeout(() => setNotificationResult(null), 5000)
    } catch (error: unknown) {
      setNotificationResult({
        type: 'error',
        message: error instanceof Error ? error.message : t('errorChecking'),
      })
      setTimeout(() => setNotificationResult(null), 5000)
    } finally {
      setCheckingNotifications(false)
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-[#161b22] rounded-lg border border-gray-200 dark:border-[#30363d]">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-[#30363d]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('title')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('subtitle')}</p>
            </div>
            <button
              onClick={() => setIsNotificationModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <FiPlus className="w-3.5 h-3.5" />
              {t('createNotification')}
            </button>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <SettingRow label={t('emailNotifications')} description={t('emailDesc')} defaultChecked />

          <div className="py-3 border-t border-gray-200 dark:border-[#30363d]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('pushNotifications')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('pushDesc')}</p>
              </div>
              <button
                onClick={handleCheckNotifications}
                disabled={checkingNotifications}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
              >
                <FiRefreshCw
                  className={cn('w-3.5 h-3.5', checkingNotifications && 'animate-spin')}
                />
                {checkingNotifications ? t('checking') : t('pushNotifications')}
              </button>
            </div>
            {notificationResult && (
              <div
                className={cn(
                  'p-2 rounded-lg text-xs',
                  notificationResult.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                )}
              >
                {notificationResult.message}
              </div>
            )}
          </div>

          <SettingRow
            label={t('systemAlerts')}
            description={t('systemAlertsDesc')}
            defaultChecked
          />
        </div>
      </div>

      <GlobalNotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />
    </>
  )
}

function SecuritySettings() {
  const t = useTranslations('profile.settings.security')

  return (
    <div className="bg-white dark:bg-[#161b22] rounded-lg border border-gray-200 dark:border-[#30363d]">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-[#30363d]">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('title')}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('subtitle')}</p>
      </div>
      <div className="p-4 space-y-3">
        <SettingRow label={t('twoFactor')} description={t('twoFactorDesc')} />
        <SettingRow label={t('passwordRotation')} description={t('passwordRotationDesc')} />
        <SettingRow label={t('loginAlerts')} description={t('loginAlertsDesc')} defaultChecked />

        <div className="pt-4 border-t border-gray-200 dark:border-[#30363d]">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            {t('activeSessions')}
          </h4>
          <div className="space-y-2">
            <SessionItem
              device="Desktop - Chrome"
              location="Barcelona, Spain"
              active
              activeLabel={t('active')}
            />
            <SessionItem device="Mobile - Safari" location="Barcelona, Spain" />
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingRow({
  label,
  description,
  defaultChecked,
}: {
  label: string
  description: string
  defaultChecked?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function SessionItem({
  device,
  location,
  active,
  activeLabel,
}: {
  device: string
  location: string
  active?: boolean
  activeLabel?: string
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-lg">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{device}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{location}</p>
      </div>
      {active && (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {activeLabel || 'Active'}
        </span>
      )}
    </div>
  )
}

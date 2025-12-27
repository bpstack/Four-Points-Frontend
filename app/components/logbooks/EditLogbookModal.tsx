// app/components/logbooks/EditLogbookModal.tsx
'use client'

import { FiSave, FiEdit } from 'react-icons/fi'
import { useDepartments } from '@/app/lib/logbooks/hooks/useDepartments'
import {
  CenterModal,
  CenterModalFooterButtons,
  FormField,
  selectClassName,
  textareaClassName,
} from '@/app/ui/panels'
import { useTranslations } from 'next-intl'

export interface EditLogbookModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  message: string
  setMessage: (message: string) => void
  priority: 'baja' | 'media' | 'alta' | 'urgente'
  setPriority: (priority: 'baja' | 'media' | 'alta' | 'urgente') => void
  department: number
  setDepartment: (department: number) => void
  isSubmitting: boolean
}

export default function EditLogbookModal({
  isOpen,
  onClose,
  onSave,
  message,
  setMessage,
  priority,
  setPriority,
  department,
  setDepartment,
  isSubmitting,
}: EditLogbookModalProps) {
  const { departments, loading: departmentsLoading } = useDepartments()
  const t = useTranslations('logbooks')

  return (
    <CenterModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('modals.editEntry.title')}
      size="lg"
      headerIcon={<FiEdit className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
      footer={
        <CenterModalFooterButtons
          onCancel={onClose}
          onSubmit={onSave}
          cancelText={t('modals.editEntry.footer.cancel')}
          submitText={t('modals.editEntry.footer.submit')}
          submitIcon={<FiSave className="w-4 h-4" />}
          isSubmitting={isSubmitting}
          submitDisabled={!message.trim() || message.trim().length < 3}
          submitVariant="primary"
        />
      }
    >
      <div className="space-y-4">
        <FormField
          label={t('modals.editEntry.fields.message')}
          required
          hint={t('modals.editEntry.hint')}
        >
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={textareaClassName}
            rows={6}
            placeholder={t('modals.editEntry.placeholders.message')}
            disabled={isSubmitting}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('modals.editEntry.fields.priority')}>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'baja' | 'media' | 'alta' | 'urgente')}
              className={selectClassName}
              disabled={isSubmitting}
            >
              <option value="baja">{t('priorities.low')}</option>
              <option value="media">{t('priorities.medium')}</option>
              <option value="alta">{t('priorities.high')}</option>
              <option value="urgente">{t('priorities.critical')}</option>
            </select>
          </FormField>

          <FormField label={t('modals.editEntry.fields.department')}>
            <select
              value={department}
              onChange={(e) => setDepartment(Number(e.target.value))}
              className={selectClassName}
              disabled={isSubmitting || departmentsLoading}
            >
              {departmentsLoading ? (
                <option>{t('modals.common.loading')}</option>
              ) : departments.length > 0 ? (
                departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.displayName}
                  </option>
                ))
              ) : (
                <option value={department}>{t('modals.common.noDepartments')}</option>
              )}
            </select>
          </FormField>
        </div>
      </div>
    </CenterModal>
  )
}

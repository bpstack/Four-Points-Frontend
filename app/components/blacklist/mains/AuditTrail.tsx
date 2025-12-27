// app/dashboard/blacklist/components/mains/AuditTrail.tsx
'use client'

/**
 * Componente Audit Trail (Historial de cambios)
 * Timeline visual con todos los cambios realizados
 * - Creación, modificaciones, eliminación
 * - Quién hizo cada cambio
 * - Qué campos se modificaron
 * - Timestamps
 */

import { useTranslations } from 'next-intl'
import { IoPersonOutline, IoCreateOutline, IoTrashOutline, IoRefreshOutline } from 'react-icons/io5'
import type { AuditEntry } from '@/app/lib/blacklist/types'
import { formatDateTime } from '@/app/lib/blacklist/blacklistUtils'
import { clsx } from 'clsx'

interface AuditTrailProps {
  entries: AuditEntry[]
}

export function AuditTrail({ entries }: AuditTrailProps) {
  const t = useTranslations('blacklist')

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
        {t('audit.noHistory')}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {entries.map((entry, index) => (
        <AuditItem key={entry.id} entry={entry} isLast={index === entries.length - 1} />
      ))}
    </div>
  )
}

// ========================================
// COMPONENTE: Item individual del timeline
// ========================================

interface AuditItemProps {
  entry: AuditEntry
  isLast: boolean
}

function AuditItem({ entry, isLast }: AuditItemProps) {
  const t = useTranslations('blacklist')
  const { icon, bgColor, actionKey } = getAuditConfig(entry.action)

  return (
    <div className="relative pb-6">
      {/* Timeline con icono y contenido */}
      <div className="relative flex gap-4">
        {/* Línea vertical del timeline */}
        {!isLast && (
          <div className="absolute left-[18px] top-9 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800" />
        )}

        {/* Icono del evento */}
        <div
          className={clsx(
            'relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
            bgColor
          )}
        >
          {icon}
        </div>

        {/* Contenido del evento */}
        <div className="flex-1 pt-0.5 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {t(`audit.actions.${actionKey}`)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {t('audit.by')} <span className="font-medium">{entry.changed_by_username}</span>
                </span>
                {entry.ip_address && (
                  <>
                    <span className="text-gray-400 dark:text-gray-600">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                      {entry.ip_address}
                    </span>
                  </>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
              {formatDateTime(entry.timestamp)}
            </span>
          </div>
        </div>
      </div>

      {/* Cambios en campos - Fuera del flex para ocupar todo el ancho */}
      {entry.action === 'UPDATE' && entry.changed_fields && (
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-md p-3 mt-3">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('audit.fieldsModified')}
          </p>
          <div className="space-y-2">
            {Object.entries(entry.changed_fields).map(([field, changes]) => (
              <FieldChange
                key={field}
                field={field}
                oldValue={changes.old}
                newValue={changes.new}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ========================================
// COMPONENTE: Mostrar cambio de campo
// ========================================

interface FieldChangeProps {
  field: string
  oldValue: unknown
  newValue: unknown
}

function FieldChange({ field, oldValue, newValue }: FieldChangeProps) {
  const t = useTranslations('blacklist')
  const fieldLabel = t(`audit.fields.${field}`)

  return (
    <div className="text-xs">
      <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">{fieldLabel}:</div>
      {/* Cambio: Stack vertical para mejor responsividad */}
      <div className="space-y-1 pl-2">
        {/* Valor anterior */}
        <div className="flex items-start gap-2">
          <div className="text-[10px] text-gray-500 dark:text-gray-500 min-w-[45px]">
            {t('audit.before')}
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-0.5 rounded text-[11px] border border-red-200 dark:border-red-800 flex-1 min-w-0 break-all">
            {formatValue(oldValue, t)}
          </div>
        </div>

        {/* Valor nuevo */}
        <div className="flex items-start gap-2">
          <div className="text-[10px] text-gray-500 dark:text-gray-500 min-w-[45px]">
            {t('audit.after')}
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded text-[11px] border border-green-200 dark:border-green-800 flex-1 min-w-0 break-all">
            {formatValue(newValue, t)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ========================================
// HELPERS
// ========================================

function getAuditConfig(action: AuditEntry['action']) {
  switch (action) {
    case 'CREATE':
      return {
        icon: <IoCreateOutline className="text-green-600 dark:text-green-400" size={18} />,
        iconColor: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        actionKey: 'create',
      }
    case 'UPDATE':
      return {
        icon: <IoRefreshOutline className="text-blue-600 dark:text-blue-400" size={18} />,
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        actionKey: 'update',
      }
    case 'DELETE':
      return {
        icon: <IoTrashOutline className="text-red-600 dark:text-red-400" size={18} />,
        iconColor: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        actionKey: 'delete',
      }
    case 'RESTORE':
      return {
        icon: <IoRefreshOutline className="text-green-600 dark:text-green-400" size={18} />,
        iconColor: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        actionKey: 'restore',
      }
    default:
      return {
        icon: <IoPersonOutline className="text-gray-600 dark:text-gray-400" size={18} />,
        iconColor: 'text-gray-600',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        actionKey: 'unknown',
      }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatValue(value: unknown, t: any): string {
  if (value === null || value === undefined) {
    return t('audit.values.empty')
  }

  if (typeof value === 'boolean') {
    return value ? t('audit.values.yes') : t('audit.values.no')
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? t('audit.values.elements', { count: value.length })
      : t('audit.values.empty')
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  // Formatear fechas si parecen ISO strings
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    try {
      const date = new Date(value)
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date)
    } catch {
      return value
    }
  }

  // Traducir valores conocidos
  const translations: Record<string, string> = {
    LOW: 'Baja',
    MEDIUM: 'Media',
    HIGH: 'Alta',
    CRITICAL: 'Crítica',
    ACTIVE: 'Activo',
    DELETED: 'Eliminado',
    DNI: 'DNI',
    PASSPORT: 'Pasaporte',
    NIE: 'NIE',
    OTHER: 'Otro',
  }

  const stringValue = String(value)
  return translations[stringValue] || stringValue
}

// ✅ Features del AuditTrail:

// ✅ Timeline visual - Línea vertical conectando eventos
// ✅ Iconos por tipo de acción:

// 🆕 CREATE - Verde
// 🔄 UPDATE - Azul
// 🗑️ DELETE - Rojo
// ↩️ RESTORE - Verde

// ✅ Información completa:

// Usuario que realizó el cambio
// Timestamp formateado
// IP address (opcional)

// ✅ Diff de campos (solo UPDATE):

// Antes/Después con colores (rojo → verde)
// Nombres de campos en español
// Formateo inteligente de valores

// ✅ Formateo automático:

// Fechas ISO → DD/MM/YYYY
// Booleanos → Sí/No
// Arrays → "N elementos"
// Traducciones de valores (LOW → Baja)

// ✅ Responsive - Adapta spacing en mobile
// ✅ Dark mode completo
// ✅ Estado vacío - Mensaje cuando no hay historial

// 📊 Ejemplo de datos de entrada:
// typescriptconst auditEntries = [
//   {
//     id: '1',
//     blacklist_id: 'xxx',
//     action: 'CREATE',
//     changed_by: 'user-id',
//     changed_by_username: 'Salvador',
//     timestamp: '2024-12-05T10:30:00Z',
//     ip_address: '192.168.1.100',
//   },
//   {
//     id: '2',
//     blacklist_id: 'xxx',
//     action: 'UPDATE',
//     changed_by: 'user-id',
//     changed_by_username: 'Salvador',
//     changed_fields: {
//       severity: { old: 'MEDIUM', new: 'HIGH' },
//       comments: { old: 'Conducta inapropiada', new: 'Conducta muy inapropiada' },
//     },
//     timestamp: '2024-12-05T14:20:00Z',
//     ip_address: '192.168.1.100',
//   },
// ]
// 📊 Ejemplo de uso:
// typescript<AuditTrail entries={auditEntries} />

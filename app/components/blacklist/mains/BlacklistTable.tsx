// app/dashboard/blacklist/components/mains/BlacklistTable.tsx
'use client'

/**
 * Tabla de registros Blacklist
 * - Datos desde Server Component (SSR)
 * - Highlight de coincidencias
 * - Responsive (tabla desktop, cards mobile)
 * - Badges de severidad y estado
 */

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IoEyeOutline, IoWarning } from 'react-icons/io5'
import { Badge } from '@/app/components/blacklist/ui/Badge'
import { Button } from '@/app/components/blacklist/ui/Button'
import type { BlacklistEntry } from '@/app/lib/blacklist/types'
import { SEVERITY_LEVELS } from '@/app/lib/blacklist/types'
import { formatDate, highlightMatches, truncateText } from '@/app/lib/blacklist/blacklistUtils'
import { useTranslations } from 'next-intl'

interface BlacklistTableProps {
  entries: BlacklistEntry[]
  searchTerm?: string
}

export function BlacklistTable({ entries, searchTerm }: BlacklistTableProps) {
  const router = useRouter()
  const t = useTranslations('blacklist')

  // ========================================
  // MANEJAR CLICK EN FILA
  // ========================================
  const handleRowClick = (id: string) => {
    router.push(`/dashboard/blacklist/${id}`)
  }

  // Si no hay resultados
  if (entries.length === 0) {
    return <EmptyState t={t} />
  }

  return (
    <>
      {/* DESKTOP: Tabla */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-[#0D1117] border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('table.guest')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('table.document')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('table.dates')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('table.severity')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('table.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('table.registeredBy')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#0D1117] divide-y divide-gray-200 dark:divide-gray-800">
            {entries.map((entry) => (
              <tr
                key={entry.id}
                onClick={() => handleRowClick(entry.id)}
                className="hover:bg-gray-50 dark:hover:bg-[#161B22] cursor-pointer transition-colors"
              >
                {/* Nombre del huésped */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {entry.severity === 'CRITICAL' && (
                      <IoWarning className="text-red-500 flex-shrink-0" size={18} />
                    )}
                    <div>
                      <div
                        className="font-medium text-gray-900 dark:text-gray-100"
                        dangerouslySetInnerHTML={{
                          __html: searchTerm
                            ? highlightMatches(entry.guest_name, searchTerm)
                            : entry.guest_name,
                        }}
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {truncateText(entry.reason, 60)}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Documento */}
                <td className="px-6 py-4">
                  <div>
                    <div
                      className="text-gray-900 dark:text-gray-100 font-mono"
                      dangerouslySetInnerHTML={{
                        __html: searchTerm
                          ? highlightMatches(entry.document_number, searchTerm)
                          : entry.document_number,
                      }}
                    />
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {entry.document_type}
                    </div>
                  </div>
                </td>

                {/* Fechas */}
                <td className="px-6 py-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  <div className="text-sm">{formatDate(entry.check_in_date)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    → {formatDate(entry.check_out_date)}
                  </div>
                </td>

                {/* Gravedad */}
                <td className="px-6 py-4">
                  <Badge
                    variant={
                      entry.severity === 'CRITICAL'
                        ? 'danger'
                        : entry.severity === 'HIGH'
                          ? 'warning'
                          : entry.severity === 'MEDIUM'
                            ? 'info'
                            : 'default'
                    }
                  >
                    {SEVERITY_LEVELS[entry.severity]}
                  </Badge>
                </td>

                {/* Estado */}
                <td className="px-6 py-4">
                  <Badge variant={entry.status === 'ACTIVE' ? 'success' : 'default'}>
                    {entry.status === 'ACTIVE' ? t('status.active') : t('status.deleted')}
                  </Badge>
                </td>

                {/* Autor */}
                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                  <div className="text-sm">{entry.created_by_username || t('detail.unknown')}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(entry.created_at)}
                  </div>
                </td>

                {/* Acciones */}
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/dashboard/blacklist/${entry.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                  >
                    <IoEyeOutline size={18} />
                    <span>{t('modal.edit')}</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE: Cards */}
      <div className="md:hidden space-y-4 p-4">
        {entries.map((entry) => (
          <BlacklistCard key={entry.id} entry={entry} searchTerm={searchTerm} t={t} />
        ))}
      </div>
    </>
  )
}

// ========================================
// COMPONENTE: Card para mobile
// ========================================

interface BlacklistCardProps {
  entry: BlacklistEntry
  searchTerm?: string
  t: ReturnType<typeof useTranslations<'blacklist'>>
}

function BlacklistCard({ entry, searchTerm, t }: BlacklistCardProps) {
  return (
    <Link
      href={`/dashboard/blacklist/${entry.id}`}
      className="block bg-white dark:bg-[#161B22] border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {entry.severity === 'CRITICAL' && (
              <IoWarning className="text-red-500 flex-shrink-0" size={18} />
            )}
            <h3
              className="font-semibold text-gray-900 dark:text-gray-100"
              dangerouslySetInnerHTML={{
                __html: searchTerm
                  ? highlightMatches(entry.guest_name, searchTerm)
                  : entry.guest_name,
              }}
            />
          </div>
          <p
            className="text-sm text-gray-600 dark:text-gray-400 font-mono"
            dangerouslySetInnerHTML={{
              __html: searchTerm
                ? highlightMatches(entry.document_number, searchTerm)
                : entry.document_number,
            }}
          />
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge
            variant={
              entry.severity === 'CRITICAL'
                ? 'danger'
                : entry.severity === 'HIGH'
                  ? 'warning'
                  : entry.severity === 'MEDIUM'
                    ? 'info'
                    : 'default'
            }
            size="sm"
          >
            {SEVERITY_LEVELS[entry.severity]}
          </Badge>
          <Badge variant={entry.status === 'ACTIVE' ? 'success' : 'default'} size="sm">
            {entry.status === 'ACTIVE' ? t('status.active') : t('status.deleted')}
          </Badge>
        </div>
      </div>

      {/* Motivo */}
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">{entry.reason}</p>

      {/* Fechas */}
      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
        <span>{formatDate(entry.check_in_date)}</span>
        <span>→</span>
        <span>{formatDate(entry.check_out_date)}</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Por:{' '}
          <span className="font-medium">{entry.created_by_username || t('detail.unknown')}</span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {formatDate(entry.created_at)}
        </div>
      </div>
    </Link>
  )
}

// ========================================
// COMPONENTE: Estado vacío
// ========================================

interface EmptyStateProps {
  t: ReturnType<typeof useTranslations<'blacklist'>>
}

function EmptyState({ t }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 dark:bg-[#161B22] rounded-full flex items-center justify-center mb-4">
        <IoWarning className="text-gray-400 dark:text-gray-600" size={32} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {t('table.noEntries')}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
        {t('table.noResultsSearch')}
      </p>
      <Link href="/dashboard/blacklist/new">
        <Button variant="primary">{t('page.newEntry')}</Button>
      </Link>
    </div>
  )
}

// ✅ Features del BlacklistTable:

// ✅ Diseño responsive:

// Desktop: Tabla completa con todas las columnas
// Mobile: Cards apiladas con información resumida

// ✅ Highlight de búsqueda - Resalta coincidencias en nombre y documento
// ✅ Columnas informativas:

// Huésped (nombre + motivo resumido)
// Documento (número + tipo)
// Fechas (entrada → salida)
// Gravedad (badge con color)
// Estado (activo/eliminado)
// Autor (username + fecha)

// ✅ Iconos visuales:

// ⚠️ Warning en registros CRITICAL
// 👁️ Ver detalles

// ✅ Interactividad:

// Hover en filas
// Click en fila redirige a detalle
// Link directo en botón "Ver"

// ✅ Badges con colores semánticos
// ✅ Estado vacío - Mensaje amigable con CTA
// ✅ Dark mode completo
// ✅ Truncado de texto - Motivo resumido (60 chars)
// ✅ Tipografía monospace - Para documentos

// 📊 Ejemplo de uso:
// typescript<BlacklistTable
//   entries={blacklistData}
//   searchTerm={searchParams.get('q') || undefined}
// />

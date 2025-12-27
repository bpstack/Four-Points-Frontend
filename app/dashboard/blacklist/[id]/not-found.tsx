// app/dashboard/blacklist/[id]/not-found.tsx
'use client'

/**
 * Página 404 personalizada para registros no encontrados
 */

import Link from 'next/link'
import { IoSearchOutline, IoChevronBack } from 'react-icons/io5'
import { useTranslations } from 'next-intl'
import { Button } from '@/app/components/blacklist/ui/Button'
import { Card } from '@/app/components/blacklist/ui/Card'

export default function NotFound() {
  const t = useTranslations('blacklist')

  return (
    <div className="min-h-screen bg-white dark:bg-[#010409] flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center bg-white dark:bg-[#0D1117] border-gray-200 dark:border-gray-800">
        {/* Icono */}
        <div className="w-20 h-20 bg-gray-100 dark:bg-[#161B22] rounded-full flex items-center justify-center mx-auto mb-6">
          <IoSearchOutline className="text-gray-400 dark:text-gray-600" size={40} />
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          {t('notFound.entryTitle')}
        </h1>

        {/* Descripción */}
        <p className="text-gray-600 dark:text-gray-400 mb-8">{t('notFound.entryDescription')}</p>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard/blacklist">
            <Button variant="primary" leftIcon={<IoChevronBack size={18} />} fullWidth>
              {t('detail.backToList')}
            </Button>
          </Link>

          <Link href="/dashboard">
            <Button variant="secondary" fullWidth>
              {t('notFound.goToDashboard')}
            </Button>
          </Link>
        </div>

        {/* Ayuda adicional */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('notFound.needHelp')}{' '}
            <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
              {t('notFound.contactSupport')}
            </a>
          </p>
        </div>
      </Card>
    </div>
  )
}

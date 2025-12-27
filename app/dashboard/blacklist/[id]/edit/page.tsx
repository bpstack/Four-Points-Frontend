// app/dashboard/blacklist/[id]/edit/page.tsx
'use client'

/**
 * Página para editar registro en Blacklist
 */

import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { IoChevronBack } from 'react-icons/io5'
import { useTranslations } from 'next-intl'
import { BlacklistForm } from '@/app/components/blacklist/mains/BlacklistForm'
import { getBlacklistById } from '../../actions'
import type { BlacklistEntry } from '@/app/lib/blacklist/types'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditBlacklistPage({ params }: PageProps) {
  const t = useTranslations('blacklist')
  const [entry, setEntry] = useState<BlacklistEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState<string | null>(null)

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return

    const loadData = async () => {
      try {
        const data = await getBlacklistById(id)
        setEntry(data.entry)
      } catch {
        notFound()
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen dark:bg-[#010409] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!entry) {
    notFound()
  }

  return (
    <div className="min-h-screen dark:bg-[#010409]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/dashboard/blacklist/${id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
        >
          <IoChevronBack size={16} />
          {t('editPage.backToDetail')}
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('editPage.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{entry.guest_name}</p>
        </div>

        <BlacklistForm mode="edit" initialData={entry} />
      </div>
    </div>
  )
}

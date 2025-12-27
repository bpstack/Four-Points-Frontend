// app/ui/dashboard/nav-links.tsx
'use client'

import {
  HomeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  UserIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  HomeModernIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SlBookOpen } from 'react-icons/sl'
import { LiaParkingSolid } from 'react-icons/lia'
import { GiOfficeChair } from 'react-icons/gi'
import { CgDanger } from 'react-icons/cg'
import { MdPointOfSale } from 'react-icons/md'
import { useState } from 'react'
import { IoIosRestaurant } from 'react-icons/io'
import { isAdminRole } from '@/app/lib/helpers/utils'
import { useTranslations } from 'next-intl'

interface NavLink {
  nameKey: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const mainLinks: NavLink[] = [
  { nameKey: 'dashboard', href: '/dashboard', icon: HomeIcon },
  { nameKey: 'logbooks', href: '/dashboard/logbooks', icon: SlBookOpen },
  { nameKey: 'parking', href: '/dashboard/parking', icon: LiaParkingSolid },
  { nameKey: 'maintenance', href: '/dashboard/maintenance', icon: Cog6ToothIcon },
  { nameKey: 'restaurant', href: '/dashboard/restaurant', icon: IoIosRestaurant },
  { nameKey: 'conciliation', href: '/dashboard/conciliation', icon: HomeModernIcon },
  { nameKey: 'groups', href: '/dashboard/groups', icon: UserGroupIcon },
  { nameKey: 'blacklist', href: '/dashboard/blacklist', icon: CgDanger },
]

const backOfficeLinks: NavLink[] = [
  { nameKey: 'backoffice', href: '/dashboard/bo', icon: GiOfficeChair, adminOnly: true },
]

const cashierLinks: Omit<NavLink, 'icon'>[] = [
  { nameKey: 'cashierDashboard', href: '/dashboard/cashier' },
  { nameKey: 'hotelCashier', href: '/dashboard/cashier/hotel' },
  { nameKey: 'cashierReports', href: '/dashboard/cashier/reports' },
  { nameKey: 'cashierLogs', href: '/dashboard/cashier/logs' },
]

const profileLinks: NavLink[] = [
  { nameKey: 'profile', href: '/dashboard/profile', icon: UserIcon },
  { nameKey: 'settings', href: '/dashboard/profile?panel=settings', icon: Cog6ToothIcon },
]

interface NavLinksProps {
  onClose?: () => void
  currentUserRole?: string
}

export default function NavLinks({ onClose, currentUserRole }: NavLinksProps) {
  const pathname = usePathname()
  const [isCashierOpen, setIsCashierOpen] = useState(false)
  const t = useTranslations('common.navigation')

  const isCashierActive = pathname.startsWith('/dashboard/cashier')

  const renderLink = (link: NavLink) => {
    const LinkIcon = link.icon
    const isActive = pathname === link.href

    return (
      <Link
        key={link.nameKey}
        href={link.href}
        onClick={onClose}
        className={`
          flex items-center gap-2 md:gap-3 px-2.5 md:px-3 py-3 md:py-2 rounded-lg text-sm font-medium transition-all duration-200
          ${
            isActive
              ? 'bg-blue-50 dark:bg-gray-800 text-blue-700 dark:text-white border-l-4 border-blue-600 dark:border-blue-400'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white border-l-4 border-transparent'
          }
        `}
      >
        {LinkIcon && <LinkIcon className="w-5 h-5 flex-shrink-0" />}
        <span>{t(link.nameKey)}</span>
      </Link>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Navigation Group */}
      <div className="flex flex-col gap-1">{mainLinks.map((link) => renderLink(link))}</div>

      {/* Separator */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Back Office Tasks Group */}
      <div className="flex flex-col gap-1">
        <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide mb-1">
          {t('backofficeTasks')}
        </h3>

        {backOfficeLinks.map((link) => {
          if (link.adminOnly && !isAdminRole(currentUserRole)) {
            return null
          }
          return renderLink(link)
        })}

        {/* Cashier Dropdown */}
        <div>
          <button
            onClick={() => setIsCashierOpen(!isCashierOpen)}
            className={`
              w-full flex items-center gap-2 md:gap-3 px-2.5 md:px-3 py-3 md:py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${
                isCashierActive
                  ? 'bg-blue-50 dark:bg-gray-800 text-blue-700 dark:text-white border-l-4 border-blue-600 dark:border-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white border-l-4 border-transparent'
              }
            `}
          >
            <MdPointOfSale className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 text-left">{t('cashier')}</span>
            {isCashierOpen ? (
              <ChevronDownIcon className="w-4 h-4 flex-shrink-0 transition-transform duration-200" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 flex-shrink-0 transition-transform duration-200" />
            )}
          </button>

          {/* Submenu */}
          <div
            className={`
              overflow-hidden transition-all duration-200 ease-in-out
              ${isCashierOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}
            `}
          >
            <div className="pl-8 pr-3 py-1 space-y-1">
              {cashierLinks.map((subLink) => {
                const isSubActive = pathname === subLink.href

                return (
                  <Link
                    key={subLink.nameKey}
                    href={subLink.href}
                    onClick={onClose}
                    className={`
                      block px-2.5 md:px-3 py-2.5 md:py-2 rounded-md text-sm transition-all duration-200
                      ${
                        isSubActive
                          ? 'bg-blue-100 dark:bg-gray-700 text-blue-700 dark:text-blue-300 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }
                    `}
                  >
                    {t(subLink.nameKey)}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Profile Group */}
      <div className="flex flex-col gap-1">{profileLinks.map((link) => renderLink(link))}</div>
    </div>
  )
}

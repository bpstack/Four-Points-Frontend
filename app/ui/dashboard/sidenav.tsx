//app/ui/dashboard/sidenav.tsx
'use client'

import Link from 'next/link'
import NavLinks from '@/app/ui/dashboard/nav-links'
import { Fa4 } from 'react-icons/fa6'
import { TbTransformPointTopLeft } from 'react-icons/tb'
import {
  XMarkIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/app/lib/auth/useAuth'

interface SideNavProps {
  onClose?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export default function SideNav({ onClose, collapsed = false, onToggleCollapse }: SideNavProps) {
  const { user } = useAuth()
  
  // Mobile sidebar (when onClose is provided) should always be expanded
  const isMobile = !!onClose
  const isCollapsed = isMobile ? false : collapsed

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#0d1117]">
      {/* Logo Section with Close button on mobile */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#010409]">
        <Link
          className={`flex flex-1 h-full items-center gap-3 hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors group ${isCollapsed ? 'justify-center px-2' : 'px-6'}`}
          href="/dashboard"
          onClick={onClose}
        >
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-500 dark:group-hover:bg-blue-600 transition-colors">
            <Fa4 className="text-blue-600 dark:text-white group-hover:text-white text-xl group-hover:scale-110 transition-all duration-300" />
            {!isCollapsed && (
              <TbTransformPointTopLeft className="text-blue-600 dark:text-white group-hover:text-white text-xl group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
            )}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-base font-display font-semibold text-gray-900 dark:text-gray-100 group-hover:text-white dark:group-hover:text-white transition-colors">
                Hotel PMS
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-200 dark:group-hover:text-gray-200 transition-colors">
                Management
              </span>
            </div>
          )}
        </Link>

        {/* Close button - mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-3 mr-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 md:pt-8">
        <div className={isCollapsed ? 'px-2' : 'px-3'}>
          <NavLinks onClose={onClose} currentUserRole={user?.role} collapsed={isCollapsed} />
        </div>
      </nav>

      {/* Collapse Toggle Button - Desktop/Tablet only */}
      {onToggleCollapse && (
        <div className="hidden md:block border-t border-gray-200 dark:border-gray-800 p-2">
          <button
            onClick={onToggleCollapse}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronDoubleRightIcon className="w-5 h-5" />
            ) : (
              <>
                <ChevronDoubleLeftIcon className="w-5 h-5" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

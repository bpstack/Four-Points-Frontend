// app/dashboard/layout.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import SideNav from '@/app/ui/dashboard/sidenav'
import { FiMenu, FiChevronRight, FiSearch } from 'react-icons/fi'
import { GlobalSearch, MobileSearchModal } from '@/app/components/search'
import { SimpleThemeButton } from '@/app/components/theme/SetThemeButton'
import { useAuth } from '@/app/lib/auth/useAuth'
import ProfileDropdown from '@/app/components/layout/ProfileDropdown'
import { NotificationBell } from '@/app/components/notifications'
import { DashboardSkeleton } from '@/app/components/dashboard'

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const newValue = !prev
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(newValue))
      return newValue
    })
  }, [])

  useEffect(() => {
    setMounted(true)
    document.body.removeAttribute('cz-shortcut-listen')
    const savedCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    if (savedCollapsed !== null) {
      setSidebarCollapsed(JSON.parse(savedCollapsed))
    }
  }, [])

  useEffect(() => {
    if (!mounted || loading || redirecting) return
    if (!user) {
      setRedirecting(true)
      window.location.href = '/login'
    }
  }, [mounted, loading, user, redirecting])

  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean)
    let currentPath = ''
    return paths.map((path, index) => {
      currentPath += `/${path}`
      return {
        label: path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' '),
        href: currentPath,
        isLast: index === paths.length - 1,
      }
    })
  }

  const breadcrumbs = generateBreadcrumbs()

  if (!mounted || loading) {
    return <DashboardSkeleton />
  }

  if (!user) {
    return <DashboardSkeleton />
  }

  return (
    <div className="flex h-screen bg-white dark:bg-[#010409] antialiased">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed md:static inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${sidebarCollapsed ? 'md:w-16' : 'md:w-64'} w-64
        `}
      >
        <SideNav
          onClose={sidebarOpen ? () => setSidebarOpen(false) : undefined}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#010409] flex items-center justify-between px-4 md:px-6">
          {/* Left Section */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
            >
              <FiMenu className="h-6 w-6" />
            </button>

            {/* Breadcrumb Navigation - Desktop only */}
            <nav className="hidden md:flex items-center gap-1 overflow-x-auto scrollbar-hide min-w-0">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center gap-1 flex-shrink-0">
                  {index > 0 && (
                    <FiChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                  )}
                  {crumb.isLast ? (
                    <span className="text-sm font-medium text-gray-900 dark:text-white px-2 py-1 truncate">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors truncate"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
            {/* Mobile Search Button */}
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FiSearch className="h-5 w-5" />
            </button>

            {/* Desktop Search */}
            <div className="hidden md:block">
              <GlobalSearch />
            </div>

            <SimpleThemeButton />
            <NotificationBell />
            <ProfileDropdown />
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-white dark:bg-[#010409]">
          <div className="w-full p-4 md:p-6">{children}</div>
        </main>
      </div>

      {/* Mobile Search Modal */}
      <MobileSearchModal isOpen={mobileSearchOpen} onClose={() => setMobileSearchOpen(false)} />
    </div>
  )
}

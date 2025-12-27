// app/components/cashier/ShiftTabs.tsx
'use client'

import { useTranslations } from 'next-intl'
import type { CashierShift, ShiftType } from '@/app/lib/cashier/types'

interface ShiftTabsProps {
  shifts: CashierShift[] | undefined
  activeTab: ShiftType
  onTabChange: (tab: ShiftType) => void
}

const SHIFT_ICONS: Record<ShiftType, string> = {
  night: '🌙',
  morning: '☀️',
  afternoon: '🌅',
  closing: '🔒',
}

const SHIFT_ORDER: ShiftType[] = ['night', 'morning', 'afternoon', 'closing']

export default function ShiftTabs({ shifts, activeTab, onTabChange }: ShiftTabsProps) {
  const t = useTranslations('cashier')

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-800">
      {SHIFT_ORDER.map((shift) => {
        const shiftData = shifts?.find((s) => s.shift_type === shift)
        const isOpen = shiftData?.status === 'open'
        const isClosed = shiftData?.status === 'closed'

        return (
          <button
            key={shift}
            onClick={() => onTabChange(shift)}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors relative ${
              activeTab === shift
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <span>
                {SHIFT_ICONS[shift]} {t(`shifts.${shift}`)}
              </span>
              {isClosed && (
                <span
                  className="w-1.5 h-1.5 bg-green-500 rounded-full"
                  title={t('summary.closed')}
                />
              )}
              {isOpen && (
                <span
                  className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"
                  title={t('summary.open')}
                />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

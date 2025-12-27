// app/components/conciliation/TotalsCards.tsx
'use client'

import { useTranslations } from 'next-intl'

interface TotalsCardsProps {
  totalReception: number
  totalHousekeeping: number
  difference: number
  layout?: 'horizontal' | 'vertical'
}

export default function TotalsCards({
  totalReception,
  totalHousekeeping,
  difference,
  layout = 'horizontal',
}: TotalsCardsProps) {
  const t = useTranslations('conciliation')
  const isVertical = layout === 'vertical'

  return (
    <div className={isVertical ? 'space-y-3' : 'grid grid-cols-1 md:grid-cols-3 gap-4'}>
      {isVertical && (
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t('totals.title')}
        </h3>
      )}
      <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              {t('totals.reception')}
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
              {totalReception}
            </div>
          </div>
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <div className="w-5 h-5 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
              R
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-[#0D1117] border border-[#d0d7de] dark:border-[#30363d] rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
              {t('totals.housekeeping')}
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
              {totalHousekeeping}
            </div>
          </div>
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <div className="w-5 h-5 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
              H
            </div>
          </div>
        </div>
      </div>
      <div
        className={`bg-white dark:bg-[#0D1117] border rounded-xl shadow-sm p-4 ${
          difference === 0
            ? 'border-green-300 dark:border-green-800'
            : 'border-red-300 dark:border-red-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div
              className={`text-xs font-medium ${
                difference === 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {t('totals.discrepancy')}
            </div>
            <div
              className={`text-xl font-bold mt-0.5 ${
                difference === 0
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}
            >
              {difference}
            </div>
          </div>
          <div
            className={`p-2 rounded-lg ${
              difference === 0
                ? 'bg-green-100 dark:bg-green-900/20'
                : 'bg-red-100 dark:bg-red-900/20'
            }`}
          >
            <div
              className={`w-5 h-5 flex items-center justify-center font-bold text-sm ${
                difference === 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {difference === 0 ? '✓' : '!'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
